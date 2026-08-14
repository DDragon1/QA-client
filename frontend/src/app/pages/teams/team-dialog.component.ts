import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Team } from '../../core/models';
import { LABELS } from '../../core/i18n/he';

@Component({
  selector: 'app-team-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.team ? labels.teams.edit : labels.teams.add }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.teams.name }}</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ labels.common.cancel }}</button>
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="save()">
        {{ labels.common.save }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; }'],
})
export class TeamDialogComponent {
  readonly labels = LABELS;
  name = '';

  constructor(
    public dialogRef: MatDialogRef<TeamDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public data: { team?: Team }
  ) {
    this.name = data.team?.name ?? '';
  }

  save(): void {
    this.dialogRef.close(this.name.trim());
  }
}
