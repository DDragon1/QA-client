import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LABELS } from '../../core/i18n/he';

@Component({
  selector: 'app-feature-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ labels.catalog.addFeature }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.feature }}</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ labels.common.cancel }}</button>
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="dialogRef.close(name.trim())">
        {{ labels.common.save }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; }'],
})
export class FeatureDialogComponent {
  readonly labels = LABELS;
  name = '';

  constructor(
    public dialogRef: MatDialogRef<FeatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: unknown
  ) {}
}
