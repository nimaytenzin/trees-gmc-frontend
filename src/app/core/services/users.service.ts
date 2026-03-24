import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { BulkUploadResult } from '../models/user.model';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly API = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getEnumerators(): Observable<User[]> {
    return this.http
      .get<{ data: User[] }>(`${this.API}/enumerators`)
      .pipe(map((r) => r.data));
  }

  downloadEnumeratorsTemplate(): void {
    this.http
      .get(`${this.API}/enumerators/template`, {
        responseType: 'blob',
      })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'enumerators-template.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  bulkUploadEnumerators(file: File): Observable<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ data: BulkUploadResult }>(`${this.API}/enumerators/bulk`, formData)
      .pipe(map((r) => r.data ?? { created: 0, errors: [] }));
  }

  changePassword(
    userId: string,
    newPassword: string,
    currentPassword?: string,
  ): Observable<{ message: string }> {
    return this.http
      .put<{ data: { message: string } }>(`${this.API}/${userId}/password`, {
        newPassword,
        currentPassword,
      })
      .pipe(map((r) => r.data));
  }

  setActive(userId: string, isActive: boolean): Observable<User> {
    return this.http
      .patch<{ data: User }>(`${this.API}/${userId}/active`, { isActive })
      .pipe(map((r) => r.data));
  }
}
