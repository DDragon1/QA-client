import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { AppVersion, VersionTestRun } from '../../core/models';
import {
  LABELS,
  RUN_STATUS_OPTIONS,
  RESULT_STATUS_OPTIONS,
  TEST_TYPE_OPTIONS,
} from '../../core/i18n/he';

@Component({
  selector: 'app-version-workspace',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './version-workspace.component.html',
  styleUrl: './version-workspace.component.scss',
})
export class VersionWorkspaceComponent implements OnInit {
  readonly labels = LABELS;
  readonly runStatusOptions = RUN_STATUS_OPTIONS;
  readonly resultStatusOptions = RESULT_STATUS_OPTIONS.filter((o) => o.value !== '');
  readonly testTypeOptions = TEST_TYPE_OPTIONS;

  loading = true;
  version: AppVersion | null = null;
  runs: VersionTestRun[] = [];
  filteredRuns: VersionTestRun[] = [];

  filterFeature = '';
  filterRunStatus = '';
  filterResultStatus = '';
  filterType = '';

  displayedColumns = [
    'feature',
    'scenario',
    'type',
    'runStatus',
    'resultStatus',
    'notes',
  ];

  private versionId = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.versionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.api.getVersion(this.versionId).subscribe({
      next: (version) => {
        this.version = version;
        this.api.getVersionRuns(this.versionId).subscribe({
          next: (runs) => {
            this.runs = runs;
            this.applyFilters();
            this.loading = false;
          },
          error: () => {
            this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
            this.loading = false;
          },
        });
      },
      error: () => {
        this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  get featureOptions(): string[] {
    return [...new Set(this.runs.map((r) => r.testCase.feature.name))];
  }

  applyFilters(): void {
    this.filteredRuns = this.runs.filter((run) => {
      if (this.filterFeature && run.testCase.feature.name !== this.filterFeature) return false;
      if (this.filterRunStatus && run.runStatus !== this.filterRunStatus) return false;
      if (this.filterResultStatus && run.resultStatus !== this.filterResultStatus) return false;
      if (this.filterType && run.testCase.type !== this.filterType) return false;
      return true;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  updateRun(run: VersionTestRun, field: 'runStatus' | 'resultStatus' | 'notes', value: string | null): void {
    const payload: {
      runStatus?: string;
      resultStatus?: string | null;
      notes?: string | null;
      rowVersion: number;
    } = { rowVersion: run.rowVersion };

    if (field === 'runStatus') payload.runStatus = value ?? run.runStatus;
    if (field === 'resultStatus') payload.resultStatus = value;
    if (field === 'notes') payload.notes = value;

    this.api.updateVersionRun(this.versionId, run.id, payload).subscribe({
      next: (updated) => {
        const index = this.runs.findIndex((r) => r.id === run.id);
        if (index >= 0) this.runs[index] = updated;
        this.applyFilters();
        if (this.version) {
          this.api.getVersion(this.versionId).subscribe((v) => (this.version = v));
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.snackBar.open(LABELS.common.conflict, '', { duration: 4000 });
          this.loadData();
        } else {
          this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
        }
      },
    });
  }

  runStatusLabel(status: string): string {
    return LABELS.runStatus[status as keyof typeof LABELS.runStatus] ?? status;
  }

  resultStatusLabel(status: string | null): string {
    if (!status) return '-';
    return LABELS.resultStatus[status as keyof typeof LABELS.resultStatus] ?? status;
  }

  typeLabel(type: string): string {
    return LABELS.testType[type as keyof typeof LABELS.testType] ?? type;
  }

  runStatusClass(status: string): string {
    return `status-${status}`;
  }

  resultStatusClass(status: string | null): string {
    return status ? `result-${status}` : '';
  }
}
