// src/data/crisisPhrases.ts
// Single source of truth for crisis detection phrases
// Per SAFETY_SYSTEM.md: phrase-based, not single words (reduces false positives)
// Used by: useCrisisMode hook → now.tsx, result.tsx, home screen input

export const CRISIS_PHRASES: {
  phrase: string;
  category: CrisisCategory;
}[] = [
  // Medical emergency
  { phrase: 'not breathing', category: 'medical_emergency' },
  { phrase: 'cant breathe', category: 'medical_emergency' },
  { phrase: 'stopped breathing', category: 'medical_emergency' },
  { phrase: 'unconscious', category: 'medical_emergency' },
  { phrase: 'wont wake up', category: 'medical_emergency' },
  { phrase: 'passed out', category: 'medical_emergency' },
  { phrase: 'severe bleeding', category: 'medical_emergency' },
  { phrase: 'having a seizure', category: 'medical_emergency' },
  { phrase: 'seizure now', category: 'medical_emergency' },
  { phrase: 'ingested', category: 'medical_emergency' },
  { phrase: 'overdose', category: 'medical_emergency' },
  { phrase: 'swallowed something', category: 'medical_emergency' },
  { phrase: 'call an ambulance', category: 'medical_emergency' },
  { phrase: 'need emergency', category: 'medical_emergency' },

  // Suicidal — parent
  { phrase: 'kill myself', category: 'suicidal_parent' },
  { phrase: 'want to die', category: 'suicidal_parent' },
  { phrase: 'end my life', category: 'suicidal_parent' },
  { phrase: 'end it all', category: 'suicidal_parent' },
  { phrase: 'no reason to live', category: 'suicidal_parent' },
  { phrase: 'better off dead', category: 'suicidal_parent' },
  { phrase: 'better off without me', category: 'suicidal_parent' },
  { phrase: 'thinking about suicide', category: 'suicidal_parent' },

  // Suicidal — child
  { phrase: 'said they want to die', category: 'suicidal_child' },
  { phrase: 'wants to kill themselves', category: 'suicidal_child' },
  { phrase: 'my child said suicide', category: 'suicidal_child' },
  { phrase: 'child is suicidal', category: 'suicidal_child' },
  { phrase: 'talked about ending their life', category: 'suicidal_child' },

  // Parent losing control
  { phrase: 'might hurt my child', category: 'parent_losing_control' },
  { phrase: 'might hurt my kid', category: 'parent_losing_control' },
  { phrase: 'going to hurt them', category: 'parent_losing_control' },
  { phrase: 'going to hurt', category: 'parent_losing_control' },
  { phrase: 'feel like hurting', category: 'parent_losing_control' },
  { phrase: 'going to lose it completely', category: 'parent_losing_control' },
  { phrase: 'about to snap', category: 'parent_losing_control' },
  { phrase: 'cant control myself', category: 'parent_losing_control' },

  // Violence toward child
  { phrase: 'hit my child', category: 'violence_toward_child' },
  { phrase: 'hitting my child', category: 'violence_toward_child' },
  { phrase: 'hit my kid', category: 'violence_toward_child' },
  { phrase: 'slapped my child', category: 'violence_toward_child' },
  { phrase: 'choked my child', category: 'violence_toward_child' },
  { phrase: 'shook my baby', category: 'violence_toward_child' },
  { phrase: 'beat my child', category: 'violence_toward_child' },
  { phrase: 'punched my child', category: 'violence_toward_child' },

  // Violence toward parent
  { phrase: 'has a knife', category: 'violence_toward_parent' },
  { phrase: 'grabbed a knife', category: 'violence_toward_parent' },
  { phrase: 'has a gun', category: 'violence_toward_parent' },
  { phrase: 'attacking me', category: 'violence_toward_parent' },
  { phrase: 'stabbing me', category: 'violence_toward_parent' },
  { phrase: 'choking me', category: 'violence_toward_parent' },

  // Child self-harm
  { phrase: 'self harm', category: 'child_self_harm' },
  { phrase: 'self-harm', category: 'child_self_harm' },
  { phrase: 'cutting themselves', category: 'child_self_harm' },
  { phrase: 'cutting himself', category: 'child_self_harm' },
  { phrase: 'cutting herself', category: 'child_self_harm' },
  { phrase: 'burns themselves', category: 'child_self_harm' },
  { phrase: 'hitting themselves until', category: 'child_self_harm' },
  { phrase: 'hurt themselves', category: 'child_self_harm' },
  { phrase: 'hurt herself', category: 'child_self_harm' },
  { phrase: 'hurt himself', category: 'child_self_harm' },

  // Abuse indicators
  { phrase: 'locked them in', category: 'abuse_indicator' },
  { phrase: "haven't fed", category: 'abuse_indicator' },
  { phrase: 'bruises on my child', category: 'abuse_indicator' },
  { phrase: 'someone is hurting my child', category: 'abuse_indicator' },
  { phrase: 'being abused', category: 'abuse_indicator' },
  { phrase: 'someone touched my child', category: 'abuse_indicator' },
];

export type CrisisCategory =
  | 'medical_emergency'
  | 'suicidal_parent'
  | 'suicidal_child'
  | 'parent_losing_control'
  | 'violence_toward_child'
  | 'violence_toward_parent'
  | 'child_self_harm'
  | 'abuse_indicator';

export type RiskLevel = 'MEDICAL_EMERGENCY' | 'CRISIS_RISK' | 'ELEVATED_RISK';

export const RISK_LEVELS: Record<CrisisCategory, RiskLevel> = {
  medical_emergency: 'MEDICAL_EMERGENCY',
  suicidal_parent: 'CRISIS_RISK',
  suicidal_child: 'CRISIS_RISK',
  parent_losing_control: 'ELEVATED_RISK',
  violence_toward_child: 'CRISIS_RISK',
  violence_toward_parent: 'ELEVATED_RISK',
  child_self_harm: 'ELEVATED_RISK',
  abuse_indicator: 'ELEVATED_RISK',
};

