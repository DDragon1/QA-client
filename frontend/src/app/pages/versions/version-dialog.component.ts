import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LABELS } from '../../core/i18n/he';

@Component({
  selector: 'app-version-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ labels.versions.newVersion }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.versions.name }}</mat-label>
        <input matInput [(ngModel)]="name" placeholder="v1.0.0" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.versions.description }}</mat-label>
        <textarea matInput rows="2" [(ngModel)]="description"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ labels.common.cancel }}</button>
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="save()">
        {{ labels.versions.create }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; margin-bottom: 8px; }'],
})
export class VersionDialogComponent {
  readonly labels = LABELS;
  name = '';
  description = '';

  constructor(public dialogRef: MatDialogRef<VersionDialogComponent>) {}

  save(): void {
    this.dialogRef.close({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
    });
  }
}
