import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { LABELS } from '../core/i18n/he';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  warn?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">{{ labels.common.cancel }}</button>
      <button
        mat-raised-button
        [color]="data.warn ? 'warn' : 'primary'"
        (click)="dialogRef.close(true)"
      >
        {{ data.confirmLabel || labels.common.confirm }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .message {
        white-space: pre-wrap;
        line-height: 1.5;
        margin: 0;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly labels = LABELS;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
