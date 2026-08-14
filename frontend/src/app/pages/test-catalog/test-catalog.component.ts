import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Feature, Team, TestCase } from '../../core/models';
import { LABELS, TEST_TYPE_OPTIONS } from '../../core/i18n/he';
import { TestCaseDialogComponent } from './test-case-dialog.component';
import { FeatureDialogComponent, FeatureDialogResult } from './feature-dialog.component';
import { confirmAction } from '../../shared/confirm';

type CatalogRow = TestCase & { featureName: string; teamName: string | null };

@Component({
  selector: 'app-test-catalog',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSlideToggleModule,
    MatPaginatorModule,
  ],
  templateUrl: './test-catalog.component.html',
  styleUrl: './test-catalog.component.scss',
})
export class TestCatalogComponent implements OnInit {
  readonly labels = LABELS;
  readonly testTypeOptions = TEST_TYPE_OPTIONS;
  loading = true;
  importing = false;
  features: Feature[] = [];
  teams: Team[] = [];
  catalogRows: CatalogRow[] = [];
  showInactive = false;
  filterFeature = '';
  filterTeam = '';
  searchQuery = '';
  pageIndex = 0;
  pageSize = 50;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get featureOptions(): string[] {
    return this.features.map((f) => f.name);
  }

  get teamOptions(): string[] {
    return [...new Set(this.teams.map((t) => t.name))];
  }

  get pagedRows(): CatalogRow[] {
    const start = this.pageIndex * this.pageSize;
    return this.catalogRows.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.loadTeams();
    this.loadFeatures();
  }

  loadTeams(): void {
    this.api.getTeams().subscribe({
      next: (teams) => (this.teams = teams),
      error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
    });
  }

  loadFeatures(): void {
    this.loading = true;
    this.api.getFeatures(true).subscribe({
      next: (features) => {
        this.features = features;
        this.rebuildCatalogRows();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open(LABELS.common.error, LABELS.common.cancel, { duration: 3000 });
        this.loading = false;
      },
    });
  }

  rebuildCatalogRows(): void {
    const query = this.searchQuery.trim().toLowerCase();
    const rows: CatalogRow[] = [];
    for (const feature of this.features) {
      if (this.filterFeature && feature.name !== this.filterFeature) continue;
      const teamName = feature.team?.name ?? null;
      if (this.filterTeam && teamName !== this.filterTeam) continue;
      for (const tc of feature.testCases ?? []) {
        if (this.showInactive || tc.isActive) {
          const haystack = `${feature.name} ${teamName ?? ''} ${tc.scenario} ${tc.steps} ${tc.expectedResult}`.toLowerCase();
          if (query && !haystack.includes(query)) continue;
          rows.push({ ...tc, featureName: feature.name, teamName });
        }
      }
    }
    this.catalogRows = rows;
    const maxPage = Math.max(0, Math.ceil(rows.length / this.pageSize) - 1);
    if (this.pageIndex > maxPage) this.pageIndex = 0;
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.rebuildCatalogRows();
  }

  displayedColumns = ['feature', 'team', 'scenario', 'steps', 'expectedResult', 'type', 'active', 'actions'];

  addFeature(): void {
    const ref = this.dialog.open(FeatureDialogComponent, {
      width: '420px',
      data: { teams: this.teams },
    });
    ref.afterClosed().subscribe((result: FeatureDialogResult | undefined) => {
      if (!result) return;
      this.api.createFeature(result.name, result.teamId).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadFeatures();
          this.loadTeams();
        },
        error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
      });
    });
  }

  editFeature(row: CatalogRow): void {
    const feature = this.features.find((f) => f.id === row.featureId);
    if (!feature) return;

    const ref = this.dialog.open(FeatureDialogComponent, {
      width: '420px',
      data: { feature, teams: this.teams },
    });
    ref.afterClosed().subscribe((result: FeatureDialogResult | undefined) => {
      if (!result) return;
      this.api.updateFeature(feature.id, { name: result.name, teamId: result.teamId }).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadFeatures();
          this.loadTeams();
        },
        error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
      });
    });
  }

  addTest(feature?: Feature): void {
    const ref = this.dialog.open(TestCaseDialogComponent, {
      width: '560px',
      data: { features: this.features, featureId: feature?.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.createTestCase(result).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadFeatures();
        },
        error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
      });
    });
  }

  editTest(testCase: TestCase): void {
    const ref = this.dialog.open(TestCaseDialogComponent, {
      width: '560px',
      data: { features: this.features, testCase },
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.api.updateTestCase(testCase.id, result).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadFeatures();
        },
        error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
      });
    });
  }

  async deleteTest(testCase: TestCase): Promise<void> {
    const confirmed = await confirmAction(this.dialog, {
      title: LABELS.common.delete,
      message: `${LABELS.catalog.deleteTestConfirm}\n\n${testCase.scenario}`,
      confirmLabel: LABELS.common.delete,
      warn: true,
    });
    if (!confirmed) return;
    this.api.deleteTestCase(testCase.id).subscribe({
      next: () => {
        this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
        this.loadFeatures();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.error ?? LABELS.common.error, '', { duration: 4000 });
      },
    });
  }

  toggleActive(testCase: TestCase, isActive: boolean): void {
    const source = this.findTestCase(testCase.id);
    if (!source) return;

    const previous = source.isActive;
    source.isActive = isActive;
    this.rebuildCatalogRows();

    this.api.updateTestCase(testCase.id, { isActive }).subscribe({
      error: () => {
        source.isActive = previous;
        this.rebuildCatalogRows();
        this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
      },
    });
  }

  private findTestCase(id: string): TestCase | undefined {
    for (const feature of this.features) {
      const found = feature.testCases?.find((tc) => tc.id === id);
      if (found) return found;
    }
    return undefined;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.importing) return;

    this.importing = true;
    this.api.importExcel(file).subscribe({
      next: (result) => {
        this.importing = false;
        this.snackBar.open(
          `${LABELS.catalog.importSuccess}: ${result.features} תכולות, ${result.testCases} בדיקות`,
          '',
          { duration: 4000 }
        );
        this.loadFeatures();
        this.loadTeams();
        input.value = '';
      },
      error: (err) => {
        this.importing = false;
        this.snackBar.open(err.error?.error ?? LABELS.common.error, '', { duration: 4000 });
        input.value = '';
      },
    });
  }

  typeLabel(type: string): string {
    return LABELS.testType[type as keyof typeof LABELS.testType] ?? type;
  }
}
