import { Species } from './species.model';
import { GrowthMetric } from './growth-metric.model';

export interface Tree {
  id: string;
  treeId: string;
  speciesId: string;
  species?: Species;
  /** Display common name (from species or flattened from API). */
  commonName?: string;
  /** Display scientific name (from species or flattened from API). */
  scientificName?: string;
  xCoordinate: number;
  yCoordinate: number;
  zCoordinate?: number;
  yearOfPlantation?: number;
  dbhM?: number;
  heightM?: number;
  canopySpreadM?: number;
  growthMetrics?: GrowthMetric[];
  createdAt: string;
  updatedAt: string;
}

export interface TreeFilter {
  search?: string;
  healthCondition?: string;
  speciesId?: string;
  heightOp?: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
  heightValue?: number;
  dbhOp?: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
  dbhValue?: number;
  canopyOp?: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
  canopyValue?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedTrees {
  items: Tree[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TreeStatistics {
  total: number;
  conditionStats: { condition: string; count: string }[];
  avgMetrics: { avgHeight: string; avgDbh: string; avgCanopy: string };
  speciesCount: number;
}
