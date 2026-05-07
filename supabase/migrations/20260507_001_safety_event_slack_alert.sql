-- 20260507_001_safety_event_slack_alert.sql
--
-- Wires safety_events INSERT → Slack-format webhook notification.
--
-- Why: a child-safety product without alerting on detected crisis events is
-- genuinely risky. The safety filter (chat-parenting-assistant/safetyFilter)
-- correctly classifies and logs into safety_events, but no human gets pinged.
-- This trigger sends a notification with safe metadata (NOT message content)
-- to whatever webhook URL is stored in Vault under 'slack_safety_webhook'.
--
-- Privacy guarantees:
--   - Message excerpt is NEVER sent. The team reads it from the DB row if
--     follow-up is needed.
--   - Child profile / conversation / message IDs are NOT sent.
--   - User UUID is sent so the team can locate the user in the dashboard.
--   - All other fields sent are metadata: risk_level, policy_route,
--     resolved_with (crisis type), classifier_version, created_at, event id.
--
-- Architecture:
--   - The webhook URL is stored in Vault. Operators can rotate it any time
--     via vault.update_secret(...) without touching this migration.
--   - The trigger function is exception-safe: a failing webhook never
--     blocks the safety_events INSERT itself. Critical safety telemetry
--     stays consistent even if Slack/webhook.site is down.
--   - net.http_post is async (pg_net schedules HTTP in the background),
--     so insert latency is unaffected.
--
-- ─────────────────────────────────────────────────────────────────────────
-- OPERATOR SETUP (must be in place BEFORE applying this migration):
-- ─────────────────────────────────────────────────────────────────────────
--
-- 1. Get a webhook URL.
--    For testing: visit https://webhook.site → copy the unique URL it
--    gives you (e.g. https://webhook.site/abc-123-...).
--    For production: Slack workspace admin → Apps → Incoming Webhooks
--    → Add to channel → copy URL (e.g. https://hooks.slack.com/services/...).
--
-- 2. Store URL in Vault. Run in SQL Editor (type by hand to avoid paste
--    artifacts — paste the URL value where indicated):
--
--      select vault.create_secret(
--        'PASTE_WEBHOOK_URL_HERE',
--        'slack_safety_webhook',
--        'Webhook URL for safety event alerts. Rotate via vault.update_secret.'
--      );
--
-- 3. Verify before applying:
--
--      select name, length(decrypted_secret) as url_len
--        from vault.decrypted_secrets
--        where name = 'slack_safety_webhook';
--
--    Expect 1 row. url_len varies (~70-90 chars for webhook.site,
--    ~80 chars for Slack hooks). Just confirm > 50.
--
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- Defensive — both extensions are already created by prior migrations,
-- but this migration must run cleanly on a fresh environment too.
create extension if not exists pg_net;
create extension if not exists "supabase_vault";

-- Trigger function. Builds a Slack-format markdown message with metadata
-- only (no message content), reads the webhook URL from Vault, and posts
-- async via pg_net. Wrapped in `exception when others` so a webhook
-- failure cannot block the safety_events insert.
create or replace function public.notify_safety_event()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  webhook_url text;
  payload     jsonb;
begin
  -- Read webhook URL from Vault. If unset (e.g. brand-new env where the
  -- operator hasn't run vault.create_secret yet), no-op gracefully.
  select decrypted_secret into webhook_url
    from vault.decrypted_secrets
    where name = 'slack_safety_webhook';

  if webhook_url is null or webhook_url = '' then
    raise notice 'notify_safety_event: slack_safety_webhook not set in Vault, skipping';
    return NEW;
  end if;

  -- Build a Slack-format payload. webhook.site also accepts arbitrary JSON
  -- so this same payload format works for both test and production targets.
  payload := jsonb_build_object(
    'text',
    '🚨 *Sturdy safety event*' || chr(10)
      || '*Risk:* ' || NEW.risk_level || chr(10)
      || '*Policy:* ' || NEW.policy_route || chr(10)
      || '*Crisis type:* ' || coalesce(NEW.resolved_with, '(none)') || chr(10)
      || '*Classifier:* ' || coalesce(NEW.classifier_version, '(none)') || chr(10)
      || '*User:* `' || coalesce(NEW.user_id::text, '(anonymous)') || '`' || chr(10)
      || '*Event:* `' || NEW.id::text || '`' || chr(10)
      || '*Time:* ' || to_char(NEW.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS UTC')
  );

  perform net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := payload
  );

  return NEW;

exception
  when others then
    -- Never block the original insert. Log via raise notice; nothing else.
    raise notice 'notify_safety_event webhook failed: % %', SQLSTATE, SQLERRM;
    return NEW;
end;
$$;

-- Trigger: fires after every non-SAFE insert. Idempotent — drop+recreate
-- so re-running this migration replaces the trigger cleanly.
drop trigger if exists safety_event_notify on public.safety_events;

create trigger safety_event_notify
  after insert on public.safety_events
  for each row
  when (NEW.risk_level <> 'SAFE')
  execute function public.notify_safety_event();

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- VERIFICATION (run after applying):
-- ─────────────────────────────────────────────────────────────────────────
--
-- 1. Confirm trigger is registered:
--      select tgname, tgenabled, pg_get_triggerdef(oid) as definition
--        from pg_trigger
--        where tgname = 'safety_event_notify';
--    Expect 1 row, tgenabled = 'O' (origin / enabled).
--
-- 2. Live smoke test — insert a fake safety event:
--      insert into public.safety_events
--        (user_id, message_excerpt, risk_level, policy_route, classifier_version, resolved_with)
--      values
--        (null, '[smoke test — please ignore]', 'ELEVATED_RISK',
--         'safety_support', 'v1-keyword', 'smoke_test');
--
--    Within ~5 seconds the webhook target (webhook.site or Slack) should
--    show an incoming POST with the Slack-format payload.
--
-- 3. Read net._http_response to confirm HTTP status 200:
--      select id, status_code, content::text, created
--        from net._http_response
--        order by id desc
--        limit 3;
--
-- 4. Clean up the test row:
--      delete from public.safety_events where resolved_with = 'smoke_test';
--
-- ─────────────────────────────────────────────────────────────────────────
-- ROLLBACK:
-- ─────────────────────────────────────────────────────────────────────────
--
--   begin;
--     drop trigger if exists safety_event_notify on public.safety_events;
--     drop function if exists public.notify_safety_event();
--   commit;
--
-- (Vault secret can be left in place — orphaned secrets are harmless.)
--
-- ─────────────────────────────────────────────────────────────────────────
-- ROTATION (e.g. swapping webhook.site URL → real Slack URL post-launch):
-- ─────────────────────────────────────────────────────────────────────────
--
--   select vault.update_secret(
--     (select id from vault.decrypted_secrets where name = 'slack_safety_webhook'),
--     'NEW_WEBHOOK_URL',
--     'slack_safety_webhook',
--     'Updated to production Slack webhook'
--   );
--
-- The trigger reads from Vault on every fire, so the new URL takes effect
-- immediately. No migration changes, no Edge Function redeploy.
