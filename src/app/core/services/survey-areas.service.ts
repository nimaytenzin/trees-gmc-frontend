import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { SurveyArea } from '../models/survey-area.model';

@Injectable({ providedIn: 'root' })
export class SurveyAreasService {
  private readonly API = '/api/survey-areas';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SurveyArea[]> {
    return this.http
      .get<{ data: SurveyArea[] }>(this.API)
      .pipe(map((r) => r.data));
  }

  create(payload: { name: string; geom: Record<string, unknown> }): Observable<SurveyArea> {
    return this.http
      .post<{ data: SurveyArea }>(this.API, payload)
      .pipe(map((r) => r.data));
  }

  update(
    id: string,
    payload: Partial<{ name: string; geom: Record<string, unknown> }>,
  ): Observable<SurveyArea> {
    return this.http
      .put<{ data: SurveyArea }>(`${this.API}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ data: { message: string } }>(`${this.API}/${id}`)
      .pipe(map((r) => r.data));
  }
}

