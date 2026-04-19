// src/lib/saveScript.ts
// v5 — Saves to structured jsonb column

import { supabase } from './supabase';

type ScriptStep = {
  parent_action: string;
  script: string;
  coaching?: string;
  strategies?: string[];
};

type SaveScriptInput = {
  situation_summary: string;
  regulate: ScriptStep;
  connect: ScriptStep;
  guide: ScriptStep;
  avoid: string[];
  childProfileId?: string | null;
  conversationId?: string | null;
  triggerLabel?: string | null;
};

export async function saveScript(input: SaveScriptInput): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('No signed-in user');

  const { error } = await supabase.from('saved_scripts').insert({
    user_id: user.id,
    child_profile_id: input.childProfileId || null,
    conversation_id: input.conversationId || null,
    title: input.situation_summary.slice(0, 80),
    trigger_label: input.triggerLabel || null,
    structured: {
      situation_summary: input.situation_summary,
      regulate: input.regulate,
      connect: input.connect,
      guide: input.guide,
      avoid: input.avoid,
    },
    notes: null,
  });

  if (error) throw error;
}