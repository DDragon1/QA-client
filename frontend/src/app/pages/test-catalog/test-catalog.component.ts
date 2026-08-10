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
import { ApiService } from '../../core/services/api.service';
import { Feature, TestCase } from '../../core/models';
import { LABELS, TEST_TYPE_OPTIONS } from '../../core/i18n/he';
import { TestCaseDialogComponent } from './test-case-dialog.component';
import { FeatureDialogComponent } from './feature-dialog.component';

type CatalogRow = TestCase & { featureName: string };

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
  ],
  templateUrl: './test-catalog.component.html',
  styleUrl: './test-catalog.component.scss',
})
export class TestCatalogComponent implements OnInit {
  readonly labels = LABELS;
  readonly testTypeOptions = TEST_TYPE_OPTIONS;
  loading = true;
  features: Feature[] = [];
  catalogRows: CatalogRow[] = [];
  showInactive = false;
  filterFeature = '';

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFeatures();
  }

  get featureOptions(): string[] {
    return this.features.map((f) => f.name);
  }

  loadFeatures(): void {
    this.loading = true;
    this.api.getFeatures().subscribe({
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
    const rows: CatalogRow[] = [];
    for (const feature of this.features) {
      if (this.filterFeature && feature.name !== this.filterFeature) continue;
      for (const tc of feature.testCases ?? []) {
        if (this.showInactive || tc.isActive) {
          rows.push({ ...tc, featureName: feature.name });
        }
      }
    }
    this.catalogRows = rows;
  }

  onFilterChange(): void {
    this.rebuildCatalogRows();
  }

  displayedColumns = ['feature', 'scenario', 'steps', 'expectedResult', 'type', 'active', 'actions'];

  addFeature(): void {
    const ref = this.dialog.open(FeatureDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe((name: string | undefined) => {
      if (!name) return;
      this.api.createFeature(name).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadFeatures();
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

  deleteTest(testCase: TestCase): void {
    if (!confirm(`למחוק את הבדיקה "${testCase.scenario}"?`)) return;
    this.api.deleteTestCase(testCase.id).subscribe({
      next: () => {
        this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
        this.loadFeatures();
      },
      error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
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
    if (!file) return;

    this.api.importExcel(file).subscribe({
      next: (result) => {
        this.snackBar.open(
          `${LABELS.catalog.importSuccess}: ${result.features} תכולות, ${result.testCases} בדיקות`,
          '',
          { duration: 4000 }
        );
        this.loadFeatures();
        input.value = '';
      },
      error: (err) => {
        this.snackBar.open(err.error?.error ?? LABELS.common.error, '', { duration: 4000 });
        input.value = '';
      },
    });
  }

  typeLabel(type: string): string {
    return LABELS.testType[type as keyof typeof LABELS.testType] ?? type;
  }
}
