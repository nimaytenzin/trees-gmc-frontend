import { Photo } from './photo.model';

export type AssessmentType = 'Initial' | 'Periodic';

export interface GrowthMetric {
  id: string;
  /** Initial assessment (first for tree) or Periodic assessment. */
  assessmentType?: AssessmentType;
  heightM: number;
  dbhM: number;
  canopySpreadM: number;
  remarks?: string;
  recordedAt: string;
  treeId: string;
  existingForm?: 'Good' | 'Fair' | 'Poor' | 'Dead';
  healthCondition?: 'Good' | 'Fair' | 'Poor' | 'Dead';
  amenityValue?: 'High' | 'Medium' | 'Low';
  transplantSurvival?: 'High' | 'Medium' | 'Low';
  /** @deprecated Use healthCondition. Kept for backward compat. */
  condition?: 'Good' | 'Fair' | 'Poor' | 'Dead';
  photos?: Photo[];
  createdAt: string;
}
