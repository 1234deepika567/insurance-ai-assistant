export interface PolicyDetails {
  policyNumber: string;
  insuredName: string;
  premiumAmount: string;
  expiryDate: string;
  coverageDetails: string;
  benefitDetails: string;
  claimDetails: string;
  exclusions: string;
  highLevelSummary: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}
