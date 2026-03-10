import { Photo } from './photo.model';

export interface GrowthMetric {
  id: string;
  heightM: number;
  dbhCm: number;
  canopySpreadM: number;
  remarks?: string;
  recordedAt: string;
  treeId: string;
  /** Condition when recorded (Good/Fair/Poor). From tree.healthCondition if not on metric. */
  condition?: 'Good' | 'Fair' | 'Poor' | 'Dead';
  photos?: Photo[];
  createdAt: string;
}
