// src/lib/loadSavedScripts.ts
// v5 — Reads from structured jsonb column + resolves child names

import { supabase } from './supabase';

export type SavedScriptRow = {
  id: string;
  user_id: string;
  title: string | null;
  trigger_label: string | null;
  child_profile_id: string | null;
  structured: {
    situation_summary: string;
    regulate: { parent_action: string; script: string; coaching?: string; strategies?: string[] };
    connect: { parent_action: string; script: string; coaching?: string; strategies?: string[] };
    guide: { parent_action: string; script: string; coaching?: string; strategies?: string[] };
    avoid: string[];
  };
  notes: string | null;
  created_at: string;
  child_name?: string;
};

export async function loadSavedScripts(): Promise<SavedScriptRow[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('No signed-in user');

  const { data, error } = await supabase
    .from('saved_scripts')
    .select('id, user_id, title, trigger_label, child_profile_id, structured, notes, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as SavedScriptRow[];

  // Resolve child names
  const childIds = [...new Set(rows.map(r => r.child_profile_id).filter(Boolean))] as string[];

  if (childIds.length > 0) {
    const { data: children } = await supabase
      .from('child_profiles')
      .select('id, name')
      .in('id', childIds);

    if (children) {
      const childMap = Object.fromEntries(children.map(c => [c.id, c.name]));
      rows.forEach(r => {
        if (r.child_profile_id && childMap[r.child_profile_id]) {
          r.child_name = childMap[r.child_profile_id];
        }
      });
    }
  }

  return rows;
}

export async function deleteSavedScript(scriptId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_scripts')
    .delete()
    .eq('id', scriptId);

  if (error) throw error;
}