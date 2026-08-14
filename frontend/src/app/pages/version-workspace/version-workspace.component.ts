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
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { AppVersion, VersionTestRun } from '../../core/models';
import {
  LABELS,
  RUN_STATUS_OPTIONS,
  RESULT_STATUS_OPTIONS,
  TEST_TYPE_OPTIONS,
} from '../../core/i18n/he';
import { confirmAction } from '../../shared/confirm';
import { finishWarningMessages } from '../../core/utils/finish-warnings';

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
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
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
  loadError = false;
  finishing = false;
  version: AppVersion | null = null;
  runs: VersionTestRun[] = [];
  filteredRuns: VersionTestRun[] = [];

  filterFeature = '';
  filterTeam = '';
  filterRunStatus = '';
  filterResultStatus = '';
  filterType = '';
  searchQuery = '';
  pageIndex = 0;
  pageSize = 50;

  displayedColumns = [
    'feature',
    'team',
    'scenario',
    'type',
    'runStatus',
    'resultStatus',
    'notes',
    'updatedBy',
  ];

  private versionId = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  get isFinished(): boolean {
    return !!this.version?.finishedAt;
  }

  get pagedRuns(): VersionTestRun[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredRuns.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.versionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.loadError = false;
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
            this.loadError = true;
            this.loading = false;
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(
          err.status === 404 ? LABELS.workspace.notFound : LABELS.common.error,
          '',
          { duration: 3000 }
        );
        this.version = null;
        this.loadError = err.status !== 404;
        this.loading = false;
      },
    });
  }

  get featureOptions(): string[] {
    return [...new Set(this.runs.map((r) => r.testCase.feature.name))];
  }

  get teamOptions(): string[] {
    return [
      ...new Set(
        this.runs
          .map((r) => r.testCase.feature.team?.name)
          .filter((name): name is string => !!name)
      ),
    ];
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredRuns = this.runs.filter((run) => {
      if (this.filterFeature && run.testCase.feature.name !== this.filterFeature) return false;
      if (this.filterTeam && (run.testCase.feature.team?.name ?? '') !== this.filterTeam) return false;
      if (this.filterRunStatus && run.runStatus !== this.filterRunStatus) return false;
      if (this.filterResultStatus && run.resultStatus !== this.filterResultStatus) return false;
      if (this.filterType && run.testCase.type !== this.filterType) return false;
      if (query) {
        const haystack =
          `${run.testCase.feature.name} ${run.testCase.feature.team?.name ?? ''} ${run.testCase.scenario} ${run.testCase.steps} ${run.testCase.expectedResult} ${run.notes ?? ''} ${run.lastUpdatedBy ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    const maxPage = Math.max(0, Math.ceil(this.filteredRuns.length / this.pageSize) - 1);
    if (this.pageIndex > maxPage) this.pageIndex = 0;
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  async finishVersion(): Promise<void> {
    if (this.isFinished || this.finishing || !this.version) return;
    const warnings = finishWarningMessages(this.version, this.runs);
    const extra = warnings.length
      ? `\n\n${warnings.join('\n')}\n${LABELS.versions.finishAnyway}`
      : '';
    const confirmed = await confirmAction(this.dialog, {
      title: LABELS.versions.finish,
      message: `${LABELS.versions.finishConfirm}${extra}`,
      confirmLabel: LABELS.versions.finish,
      warn: true,
    });
    if (!confirmed) return;

    this.finishing = true;
    this.api.finishVersion(this.versionId).subscribe({
      next: (version) => {
        this.version = version;
        this.finishing = false;
        this.snackBar.open(LABELS.versions.finishSuccess, '', { duration: 2500 });
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        this.finishing = false;
        const message =
          err.status === 400
            ? LABELS.versions.alreadyFinished
            : (err.error?.error as string | undefined) || LABELS.common.error;
        this.snackBar.open(message, '', { duration: 3500 });
        if (err.status === 400) this.loadData();
      },
    });
  }

  onNotesBlur(run: VersionTestRun, event: FocusEvent): void {
    const value = ((event.target as HTMLInputElement | null)?.value ?? '').trim() || null;
    const current = run.notes?.trim() || null;
    if (value === current) return;
    this.updateRun(run, 'notes', value);
  }

  updateRun(run: VersionTestRun, field: 'runStatus' | 'resultStatus' | 'notes', value: string | null): void {
    if (this.isFinished) return;

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
          const who = err.error?.current?.lastUpdatedBy as string | undefined;
          this.snackBar.open(
            who ? `${LABELS.common.conflict} (${who})` : LABELS.common.conflict,
            '',
            { duration: 4000 }
          );
          this.loadData();
        } else if (err.status === 403) {
          this.snackBar.open(LABELS.workspace.lockedBanner, '', { duration: 3500 });
          this.loadData();
        } else {
          this.snackBar.open(
            (err.error?.error as string | undefined) || LABELS.common.error,
            '',
            { duration: 3000 }
          );
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
