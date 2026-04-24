// apps/mobile/src/lib/api.ts
// Updated response type includes coaching + strategies per step
// + Follow-up response type


// @ts-ignore
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL.');


// @ts-ignore
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'dev-local';


const PARENTING_SCRIPT_URL = `${SUPABASE_URL}/functions/v1/chat-parenting-assistant`;


const HEADERS = {
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${SUPABASE_ANON_KEY}`,
} as const;


export type ScriptStep = {
  parent_action: string;
  script:        string;
  coaching?:     string;
  strategies?:   string[];
};


export type ParentingScriptRequest = {
  childName:       string;
  childAge:        number;
  message:         string;
  userId?:         string;
  childProfileId?: string;
  intensity?:      number | null;
  mode?:           string;
  isFollowUp?:     boolean;
  followUpType?:   string;
  originalScript?: {
    situation_summary: string;
    regulate:          string;
    connect:           string;
    guide:             string;
  };
};


export type ParentingScriptResponse = {
  situation_summary: string;
  regulate:          ScriptStep;
  connect:           ScriptStep;
  guide:             ScriptStep;
  avoid:             string[];
};


export class CrisisDetectedError extends Error {
  readonly crisisType: string;
  readonly riskLevel:  string;
  constructor(crisisType: string, riskLevel: string) {
    super('crisis-detected');
    this.name       = 'CrisisDetectedError';
    this.crisisType = crisisType;
    this.riskLevel  = riskLevel;
  }
}


function isValidStep(v: unknown): v is ScriptStep {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return typeof s.parent_action === 'string' && typeof s.script === 'string';
}


function isValidResponse(v: unknown): v is ParentingScriptResponse {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.situation_summary === 'string' &&
    isValidStep(c.regulate) &&
    isValidStep(c.connect)  &&
    isValidStep(c.guide)    &&
    Array.isArray(c.avoid)
  );
}


export async function getParentingScript(
  input: ParentingScriptRequest,
): Promise<ParentingScriptResponse> {
  let response: Response;


  console.log('[API] Sending request — mode:', input.mode ?? 'sos');


  try {
    response = await fetch(PARENTING_SCRIPT_URL, {
      method:  'POST',
      headers: HEADERS,
      body:    JSON.stringify(input),
    });
  } catch (e) {
    console.log('[API] Network error:', e);
    throw new Error('network-error');
  }


  console.log('[API] Response status:', response.status);


  let rawText = '';
  try {
    rawText = await response.text();
    console.log('[API] Raw length:', rawText.length);
  } catch (e) {
    console.log('[API] Failed to read response:', e);
    throw new Error('read-error');
  }


  let data: unknown = null;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.log('[API] JSON parse failed:', rawText.slice(0, 300));
    throw new Error('parse-error');
  }


  if (!response.ok) {
    const msg = typeof data === 'object' && data !== null && 'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error : 'request-failed';
    console.log('[API] Response not ok:', msg);
    throw new Error(msg);
  }


  if (
    typeof data === 'object' && data !== null && 'response_type' in data &&
    (data as { response_type: unknown }).response_type === 'crisis'
  ) {
    const c = data as { crisis_type?: string; risk_level?: string };
    throw new CrisisDetectedError(c.crisis_type ?? 'unknown', c.risk_level ?? 'ELEVATED_RISK');
  }


  if (!isValidResponse(data)) {
    console.log('[API] Validation failed:', JSON.stringify(data).slice(0, 300));
    throw new Error('invalid-response');
  }


  console.log('[API] Success');
  return data;
}

