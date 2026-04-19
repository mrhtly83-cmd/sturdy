// apps/mobile/src/types/parentingScript.ts

export type ScriptStep = {
  parent_action: string;
  script:        string;
};

export type ParentingScriptRequest = {
  childName:       string;
  childAge:        number;
  message:         string;
  userId?:         string;
  childProfileId?: string;
  intensity?:      number | null;
  // Follow-up mode — Option B
  isFollowUp?:     boolean;
  followUpType?:   'refused' | 'escalated' | 'worked' | 'other';
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

export type SavedScriptInput = {
  situation_summary: string;
  regulate:          ScriptStep;
  connect:           ScriptStep;
  guide:             ScriptStep;
  avoid:             string[];
  childAge?:         number | null;
};

export type SavedScript = SavedScriptInput & {
  id:        string;
  createdAt: string;
}
