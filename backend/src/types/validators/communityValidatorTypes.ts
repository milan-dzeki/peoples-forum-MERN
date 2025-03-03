export interface ComunityInputs {
  pendingInvitedModerators: string[];
  name: string | undefined;
  description: string | undefined;
  rules: {
    title: string | undefined;
    description: string | undefined
  }[];
  pendingInvitedUsers: string[];
  chatNames: string[];
}

export interface CommunityRuleType {
  title: string | undefined;
  description: string | undefined;
}

export interface CommunityRulesErrorsType {
  title?: string;
  description?: string;
}

export interface CommunityValidationErrors  {
  [name: string]: string | CommunityRulesErrorsType[] | null;
}

export interface CommunityErrorsType {
  [name: string]: string | CommunityRulesErrorsType[];
}
