import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import {
  AppVersion,
  Feature,
  ImportResult,
  Team,
  TestCase,
  VersionTestRun,
} from '../models';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private config: RuntimeConfigService
  ) {}

  private get baseUrl(): string {
    return this.config.apiUrl;
  }

  getActors(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/actors`);
  }

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.baseUrl}/teams`);
  }

  createTeam(name: string): Observable<Team> {
    return this.http.post<Team>(`${this.baseUrl}/teams`, { name });
  }

  updateTeam(id: string, data: { name?: string; sortOrder?: number }): Observable<Team> {
    return this.http.patch<Team>(`${this.baseUrl}/teams/${id}`, data);
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/teams/${id}`);
  }

  getFeatures(includeInactive = false): Observable<Feature[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<Feature[]>(`${this.baseUrl}/features${params}`);
  }

  createFeature(name: string, teamId?: string | null): Observable<Feature> {
    return this.http.post<Feature>(`${this.baseUrl}/features`, { name, teamId: teamId ?? null });
  }

  updateFeature(id: string, data: Partial<Feature>): Observable<Feature> {
    return this.http.patch<Feature>(`${this.baseUrl}/features/${id}`, data);
  }

  deleteFeature(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/features/${id}`);
  }

  getTestCases(includeInactive = false): Observable<TestCase[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<TestCase[]>(`${this.baseUrl}/test-cases${params}`);
  }

  createTestCase(data: Partial<TestCase>): Observable<TestCase> {
    return this.http.post<TestCase>(`${this.baseUrl}/test-cases`, data);
  }

  updateTestCase(id: string, data: Partial<TestCase>): Observable<TestCase> {
    return this.http.patch<TestCase>(`${this.baseUrl}/test-cases/${id}`, data);
  }

  deleteTestCase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/test-cases/${id}`);
  }

  getVersions(): Observable<AppVersion[]> {
    return this.http.get<AppVersion[]>(`${this.baseUrl}/versions`);
  }

  getVersion(id: string): Observable<AppVersion> {
    return this.http.get<AppVersion>(`${this.baseUrl}/versions/${id}`);
  }

  createVersion(
    name: string,
    description?: string,
    environment?: string
  ): Observable<AppVersion> {
    return this.http.post<AppVersion>(`${this.baseUrl}/versions`, {
      name,
      description,
      environment,
    });
  }

  finishVersion(id: string): Observable<AppVersion> {
    return this.http.post<AppVersion>(`${this.baseUrl}/versions/${id}/finish`, {});
  }

  getVersionRuns(versionId: string): Observable<VersionTestRun[]> {
    return this.http.get<VersionTestRun[]>(`${this.baseUrl}/versions/${versionId}/runs`);
  }

  updateVersionRun(
    versionId: string,
    runId: string,
    data: {
      runStatus?: string;
      resultStatus?: string | null;
      notes?: string | null;
      rowVersion: number;
    }
  ): Observable<VersionTestRun> {
    return this.http.patch<VersionTestRun>(
      `${this.baseUrl}/versions/${versionId}/runs/${runId}`,
      data
    );
  }

  importExcel(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.baseUrl}/import/excel`, formData);
  }

  downloadReport(url: string, filename: string): Observable<void> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(
      tap((response) => {
        const blob = response.body;
        if (!blob) throw new Error('empty');
        if (blob.type.includes('json')) {
          throw new HttpErrorResponse({ status: 400, statusText: 'report-error' });
        }
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(objectUrl);
      }),
      map(() => undefined)
    );
  }

  getReportExcelUrl(versionId: string): string {
    return `${this.baseUrl}/versions/${versionId}/report.xlsx`;
  }

  getReportPdfUrl(versionId: string): string {
    return `${this.baseUrl}/versions/${versionId}/report.pdf`;
  }
}
