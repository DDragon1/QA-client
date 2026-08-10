import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Feature, TestCase } from '../../core/models';
import { LABELS, TEST_TYPE_OPTIONS } from '../../core/i18n/he';

interface DialogData {
  features: Feature[];
  featureId?: string;
  testCase?: TestCase;
}

@Component({
  selector: 'app-test-case-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ testCase ? labels.common.edit : labels.catalog.addTest }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.feature }}</mat-label>
        <mat-select [(ngModel)]="featureId">
          @for (f of features; track f.id) {
            <mat-option [value]="f.id">{{ f.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.scenario }}</mat-label>
        <input matInput [(ngModel)]="scenario" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.steps }}</mat-label>
        <textarea matInput rows="3" [(ngModel)]="steps"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.expectedResult }}</mat-label>
        <textarea matInput rows="2" [(ngModel)]="expectedResult"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.type }}</mat-label>
        <mat-select [(ngModel)]="type">
          @for (opt of testTypeOptions; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ labels.common.cancel }}</button>
      <button mat-raised-button color="primary" [disabled]="!isValid" (click)="save()">
        {{ labels.common.save }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; margin-bottom: 8px; }'],
})
export class TestCaseDialogComponent {
  readonly labels = LABELS;
  readonly testTypeOptions = TEST_TYPE_OPTIONS;
  features: Feature[];
  featureId: string;
  scenario: string;
  steps: string;
  expectedResult: string;
  type: string;
  testCase?: TestCase;

  constructor(
    public dialogRef: MatDialogRef<TestCaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.features = data.features;
    this.testCase = data.testCase;
    this.featureId = data.testCase?.featureId ?? data.featureId ?? data.features[0]?.id ?? '';
    this.scenario = data.testCase?.scenario ?? '';
    this.steps = data.testCase?.steps ?? '';
    this.expectedResult = data.testCase?.expectedResult ?? '';
    this.type = data.testCase?.type ?? 'manual';
  }

  get isValid(): boolean {
    return !!(this.featureId && this.scenario.trim() && this.steps.trim() && this.expectedResult.trim());
  }

  save(): void {
    this.dialogRef.close({
      featureId: this.featureId,
      scenario: this.scenario.trim(),
      steps: this.steps.trim(),
      expectedResult: this.expectedResult.trim(),
      type: this.type,
    });
  }
}
