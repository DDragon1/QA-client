import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppVersion,
  Feature,
  ImportResult,
  TestCase,
  VersionTestRun,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getFeatures(): Observable<Feature[]> {
    return this.http.get<Feature[]>(`${this.baseUrl}/features`);
  }

  createFeature(name: string): Observable<Feature> {
    return this.http.post<Feature>(`${this.baseUrl}/features`, { name });
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

  createVersion(name: string, description?: string): Observable<AppVersion> {
    return this.http.post<AppVersion>(`${this.baseUrl}/versions`, { name, description });
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

  getReportExcelUrl(versionId: string): string {
    return `${this.baseUrl}/versions/${versionId}/report.xlsx`;
  }

  getReportPdfUrl(versionId: string): string {
    return `${this.baseUrl}/versions/${versionId}/report.pdf`;
  }
}
