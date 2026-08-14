import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Feature, Team } from '../../core/models';
import { LABELS } from '../../core/i18n/he';

export interface FeatureDialogData {
  feature?: Feature;
  teams: Team[];
}

export interface FeatureDialogResult {
  name: string;
  teamId: string | null;
}

@Component({
  selector: 'app-feature-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.feature ? labels.catalog.editFeature : labels.catalog.addFeature }}
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.feature }}</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.common.team }}</mat-label>
        <mat-select [(ngModel)]="teamId">
          <mat-option value="">{{ labels.common.noTeam }}</mat-option>
          @for (team of data.teams; track team.id) {
            <mat-option [value]="team.id">{{ team.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ labels.common.cancel }}</button>
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="save()">
        {{ labels.common.save }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; margin-bottom: 8px; }'],
})
export class FeatureDialogComponent {
  readonly labels = LABELS;
  name = '';
  teamId = '';

  constructor(
    public dialogRef: MatDialogRef<FeatureDialogComponent, FeatureDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: FeatureDialogData
  ) {
    this.name = data.feature?.name ?? '';
    this.teamId = data.feature?.teamId ?? data.feature?.team?.id ?? '';
  }

  save(): void {
    this.dialogRef.close({
      name: this.name.trim(),
      teamId: this.teamId || null,
    });
  }
}
