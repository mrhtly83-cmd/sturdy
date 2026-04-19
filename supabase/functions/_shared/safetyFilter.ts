export type RiskLevel =
  | 'SAFE'
  | 'ELEVATED_RISK'
  | 'CRISIS_RISK'
  | 'MEDICAL_EMERGENCY';

export type CrisisType =
  | 'medical_emergency'
  | 'suicidal_parent'
  | 'suicidal_child'
  | 'parent_losing_control'
  | 'violence_toward_child'
  | 'violence_toward_parent'
  | 'child_self_harm'
  | 'abuse_indicator'
  | null;

export type PolicyRoute =
  | 'normal_parenting'
  | 'safety_support'
  | 'violence_escalation'
  | 'medical_emergency'
  | 'fallback_response';

export type SafetyResult = {
  riskLevel:   RiskLevel;
  crisisType:  CrisisType;
  policyRoute: PolicyRoute;
  isSafe:      boolean;
  matchedPhrases: string[];
};

// ─────────────────────────────────────────────
// Keyword categories
// Each entry is a phrase to match (lowercase).
// Partial matches are intentional — "hit" catches
// "hitting", "hit him", "I hit", etc.
// ─────────────────────────────────────────────

const MEDICAL_EMERGENCY_KEYWORDS = [
  'not breathing',
  'cant breathe',
  "can't breathe",
  'cannot breathe',
  'stopped breathing',
  'unconscious',
  'won\'t wake up',
  'wont wake up',
  'not waking up',
  'passed out',
  'seizure',
  'convulsing',
  'bleeding badly',
  'bleeding a lot',
  'severe bleeding',
  'head injury',
  'swallowed something',
  'ate something',
  'ingested',
  'poisoning',
  'overdose',
  'not responsive',
  'unresponsive',
  'choking on',
  'turning blue',
  'call 911',
  'call an ambulance',
  'need an ambulance',
];

const SUICIDAL_PARENT_KEYWORDS = [
  'want to die',
  'want to be dead',
  'kill myself',
  'killing myself',
  'end my life',
  'end it all',
  'cant go on',
  "can't go on",
  'no reason to live',
  'better off dead',
  'better off without me',
  'thinking about suicide',
  'suicidal',
  'take my own life',
  'dont want to be here',
  "don't want to be here",
  'wish i was dead',
  'wish i were dead',
  'not worth living',
  'life is not worth',
];

const SUICIDAL_CHILD_KEYWORDS = [
  'child wants to die',
  'kid wants to die',
  'said they want to die',
  'said he wants to die',
  'said she wants to die',
  'wants to kill themselves',
  'wants to kill himself',
  'wants to kill herself',
  'child said they hate their life',
  'child is suicidal',
  'kid is suicidal',
  'my child said suicide',
  'my son said suicide',
  'my daughter said suicide',
  'child talked about suicide',
  'child threatened to kill',
];

const PARENT_LOSING_CONTROL_KEYWORDS = [
  'going to lose it',
  'about to lose it',
  'going to snap',
  'about to snap',
  'might hurt them',
  'might hurt my child',
  'might hurt my kid',
  'cant control myself',
  "can't control myself",
  'losing control',
  'losing my mind',
  'going to hurt',
  'about to hurt',
  'feel like hurting',
  'want to hurt my',
  'so angry i could',
  'rage',
  'out of control anger',
  'cant stop myself',
  "can't stop myself",
];

const VIOLENCE_TOWARD_CHILD_KEYWORDS = [
  'hit my child',
  'hit my kid',
  'hitting my child',
  'hitting my kid',
  'slapped my child',
  'slap my child',
  'hurt my child',
  'hurt my kid',
  'hurting my child',
  'choked my child',
  'choke my child',
  'shook my baby',
  'shake my baby',
  'shaking my baby',
  'beat my child',
  'beating my child',
  'punched my child',
  'punch my child',
  'bruised my child',
  'marks on my child',
  'i hit him',
  'i hit her',
  'i slapped him',
  'i slapped her',
];

const VIOLENCE_TOWARD_PARENT_KEYWORDS = [
  'hitting me',
  'hit me',
  'attacking me',
  'attack me',
  'stabbing me',
  'stabbed me',
  'punching me',
  'punched me',
  'choking me',
  'choked me',
  'weapon',
  'knife',
  'has a knife',
  'grabbed a knife',
  'has a gun',
  'grabbed a gun',
  'threatening me with',
  'threatening to hurt me',
  'trying to hurt me',
];

const CHILD_SELF_HARM_KEYWORDS = [
  'hurting themselves',
  'hurting himself',
  'hurting herself',
  'cutting themselves',
  'cutting himself',
  'cutting herself',
  'self harm',
  'self-harm',
  'selfharm',
  'burns themselves',
  'burns himself',
  'burns herself',
  'scratching until',
  'pulling their hair out',
  'banging their head',
  'hitting themselves',
  'hitting himself',
  'hitting herself',
  'harming themselves',
];

const ABUSE_INDICATOR_KEYWORDS = [
  'locked them in',
  'locked him in',
  'locked her in',
  'locked in a room',
  'left them alone',
  'left him alone',
  'left her alone',
  'haven\'t fed',
  'not been fed',
  'no food',
  'bruises on my child',
  'marks on them',
  'unexplained bruises',
  'someone is hurting my child',
  'being abused',
  'someone touched my child',
  'inappropriate touching',
];

// ─────────────────────────────────────────────
// Matcher
// ─────────────────────────────────────────────

function matchKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw.toLowerCase()));
}

// ─────────────────────────────────────────────
// Main safety filter
// ─────────────────────────────────────────────

export function runSafetyFilter(message: string): SafetyResult {
  // Medical emergency — highest priority, check first
  const medicalMatches = matchKeywords(message, MEDICAL_EMERGENCY_KEYWORDS);
  if (medicalMatches.length > 0) {
    return {
      riskLevel:      'MEDICAL_EMERGENCY',
      crisisType:     'medical_emergency',
      policyRoute:    'medical_emergency',
      isSafe:         false,
      matchedPhrases: medicalMatches,
    };
  }

  // Suicidal parent
  const suicidalParentMatches = matchKeywords(message, SUICIDAL_PARENT_KEYWORDS);
  if (suicidalParentMatches.length > 0) {
    return {
      riskLevel:      'CRISIS_RISK',
      crisisType:     'suicidal_parent',
      policyRoute:    'safety_support',
      isSafe:         false,
      matchedPhrases: suicidalParentMatches,
    };
  }

  // Suicidal child
  const suicidalChildMatches = matchKeywords(message, SUICIDAL_CHILD_KEYWORDS);
  if (suicidalChildMatches.length > 0) {
    return {
      riskLevel:      'CRISIS_RISK',
      crisisType:     'suicidal_child',
      policyRoute:    'safety_support',
      isSafe:         false,
      matchedPhrases: suicidalChildMatches,
    };
  }

  // Violence toward child
  const violenceChildMatches = matchKeywords(message, VIOLENCE_TOWARD_CHILD_KEYWORDS);
  if (violenceChildMatches.length > 0) {
    return {
      riskLevel:      'CRISIS_RISK',
      crisisType:     'violence_toward_child',
      policyRoute:    'violence_escalation',
      isSafe:         false,
      matchedPhrases: violenceChildMatches,
    };
  }

  // Parent losing control
  const losingControlMatches = matchKeywords(message, PARENT_LOSING_CONTROL_KEYWORDS);
  if (losingControlMatches.length > 0) {
    return {
      riskLevel:      'ELEVATED_RISK',
      crisisType:     'parent_losing_control',
      policyRoute:    'safety_support',
      isSafe:         false,
      matchedPhrases: losingControlMatches,
    };
  }

  // Violence toward parent
  const violenceParentMatches = matchKeywords(message, VIOLENCE_TOWARD_PARENT_KEYWORDS);
  if (violenceParentMatches.length > 0) {
    return {
      riskLevel:      'ELEVATED_RISK',
      crisisType:     'violence_toward_parent',
      policyRoute:    'violence_escalation',
      isSafe:         false,
      matchedPhrases: violenceParentMatches,
    };
  }

  // Child self-harm
  const childSelfHarmMatches = matchKeywords(message, CHILD_SELF_HARM_KEYWORDS);
  if (childSelfHarmMatches.length > 0) {
    return {
      riskLevel:      'ELEVATED_RISK',
      crisisType:     'child_self_harm',
      policyRoute:    'safety_support',
      isSafe:         false,
      matchedPhrases: childSelfHarmMatches,
    };
  }

  // Abuse indicators
  const abuseMatches = matchKeywords(message, ABUSE_INDICATOR_KEYWORDS);
  if (abuseMatches.length > 0) {
    return {
      riskLevel:      'ELEVATED_RISK',
      crisisType:     'abuse_indicator',
      policyRoute:    'violence_escalation',
      isSafe:         false,
      matchedPhrases: abuseMatches,
    };
  }

  // Safe — proceed to normal AI generation
  return {
    riskLevel:      'SAFE',
    crisisType:     null,
    policyRoute:    'normal_parenting',
    isSafe:         true,
    matchedPhrases: [],
  };
}
