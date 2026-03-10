import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Tree, TreeFilter, PaginatedTrees, TreeStatistics } from '../../../core/models/tree.model';
import { Species } from '../../../core/models/species.model';
import { GrowthMetric } from '../../../core/models/growth-metric.model';
import { Photo } from '../../../core/models/photo.model';

@Injectable({ providedIn: 'root' })
export class TreeService {
  private readonly API = '/api/trees';
  private readonly SPECIES_API = '/api/species';
  private readonly PUBLIC_API = '/api/public';

  constructor(private http: HttpClient) {}

  // --- Public endpoints (no auth) ---

  getPublicStatistics(): Observable<TreeStatistics> {
    return this.http
      .get<{ data: TreeStatistics }>(`${this.PUBLIC_API}/statistics`)
      .pipe(map((r) => r.data));
  }

  getPublicFeaturedTree(): Observable<Tree | null> {
    return this.http
      .get<{ data: Tree | null }>(`${this.PUBLIC_API}/featured-tree`)
      .pipe(map((r) => r.data));
  }

  getPublicSpecies(): Observable<Species[]> {
    return this.http
      .get<{ data: Species[] }>(`${this.PUBLIC_API}/species`)
      .pipe(map((r) => r.data));
  }

  getPublicTrees(filters: TreeFilter = {}): Observable<PaginatedTrees> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.speciesId) params = params.set('speciesId', filters.speciesId);
    if (filters.heightOp) params = params.set('heightOp', filters.heightOp);
    if (filters.heightValue !== undefined && filters.heightValue !== null)
      params = params.set('heightValue', filters.heightValue.toString());
    if (filters.dbhOp) params = params.set('dbhOp', filters.dbhOp);
    if (filters.dbhValue !== undefined && filters.dbhValue !== null)
      params = params.set('dbhValue', filters.dbhValue.toString());
    if (filters.canopyOp) params = params.set('canopyOp', filters.canopyOp);
    if (filters.canopyValue !== undefined && filters.canopyValue !== null)
      params = params.set('canopyValue', filters.canopyValue.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return this.http
      .get<{ data: PaginatedTrees }>(`${this.PUBLIC_API}/trees`, { params })
      .pipe(map((r) => r.data));
  }

  getPublicTreesForMap(): Observable<Tree[]> {
    return this.http
      .get<{ data: Tree[] }>(`${this.PUBLIC_API}/trees/map`)
      .pipe(map((r) => r.data));
  }

  getPublicTree(id: string): Observable<Tree> {
    return this.http
      .get<{ data: Tree }>(`${this.PUBLIC_API}/trees/${id}`)
      .pipe(map((r) => r.data));
  }

  // --- Authenticated endpoints ---

  create(data: any): Observable<Tree> {
    return this.http.post<{ data: Tree }>(this.API, data).pipe(map((r) => r.data));
  }

  getAll(filters: TreeFilter = {}): Observable<PaginatedTrees> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.healthCondition) params = params.set('healthCondition', filters.healthCondition);
    if (filters.speciesId) params = params.set('speciesId', filters.speciesId);
    if (filters.heightOp) params = params.set('heightOp', filters.heightOp);
    if (filters.heightValue !== undefined && filters.heightValue !== null)
      params = params.set('heightValue', filters.heightValue.toString());
    if (filters.dbhOp) params = params.set('dbhOp', filters.dbhOp);
    if (filters.dbhValue !== undefined && filters.dbhValue !== null)
      params = params.set('dbhValue', filters.dbhValue.toString());
    if (filters.canopyOp) params = params.set('canopyOp', filters.canopyOp);
    if (filters.canopyValue !== undefined && filters.canopyValue !== null)
      params = params.set('canopyValue', filters.canopyValue.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return this.http
      .get<{ data: PaginatedTrees }>(this.API, { params })
      .pipe(map((r) => r.data));
  }

  getAllForMap(): Observable<Tree[]> {
    return this.http
      .get<{ data: Tree[] }>(`${this.API}/map`)
      .pipe(map((r) => r.data));
  }

  getOne(id: string): Observable<Tree> {
    return this.http
      .get<{ data: Tree }>(`${this.API}/${id}`)
      .pipe(map((r) => r.data));
  }

  getStatistics(): Observable<TreeStatistics> {
    return this.http
      .get<{ data: TreeStatistics }>(`${this.API}/statistics`)
      .pipe(map((r) => r.data));
  }

  // --- Species (authenticated) ---

  getSpecies(): Observable<Species[]> {
    return this.http
      .get<{ data: Species[] }>(this.SPECIES_API)
      .pipe(map((r) => r.data));
  }

  createSpecies(data: any): Observable<Species> {
    return this.http
      .post<{ data: Species }>(this.SPECIES_API, data)
      .pipe(map((r) => r.data));
  }

  updateSpecies(id: string, data: Partial<Species>): Observable<Species> {
    return this.http
      .put<{ data: Species }>(`${this.SPECIES_API}/${id}`, data)
      .pipe(map((r) => r.data));
  }

  deleteSpecies(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ data: { message: string } }>(`${this.SPECIES_API}/${id}`)
      .pipe(map((r) => r.data));
  }

  // --- Growth Metrics ---

  addGrowthMetric(treeId: string, data: any): Observable<GrowthMetric> {
    return this.http
      .post<{ data: GrowthMetric }>(`${this.API}/${treeId}/growth-metrics`, data)
      .pipe(map((r) => r.data));
  }

  getGrowthMetrics(treeId: string): Observable<GrowthMetric[]> {
    return this.http
      .get<{ data: GrowthMetric[] }>(`${this.API}/${treeId}/growth-metrics`)
      .pipe(map((r) => r.data));
  }

  uploadPhotos(metricId: string, files: File[]): Observable<Photo[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http
      .post<{ data: Photo[] }>(`/api/growth-metrics/${metricId}/photos`, formData)
      .pipe(map((r) => r.data));
  }
}
