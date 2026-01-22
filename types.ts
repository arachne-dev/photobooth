
export interface StyleDNAItem {
  label: string;
  value: number;
}

export interface StyleAnalysis {
  tags: string[];
  vogueDescription: string;
  styleDNA: StyleDNAItem[];
  timestamp: string;
  image: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT'
}
