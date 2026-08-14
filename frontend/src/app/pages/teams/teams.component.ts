import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Team } from '../../core/models';
import { LABELS } from '../../core/i18n/he';
import { TeamDialogComponent } from './team-dialog.component';
import { confirmAction } from '../../shared/confirm';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent implements OnInit {
  readonly labels = LABELS;
  loading = true;
  teams: Team[] = [];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.api.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  addTeam(): void {
    const ref = this.dialog.open(TeamDialogComponent, {
      width: '400px',
      data: {},
    });
    ref.afterClosed().subscribe((name: string | undefined) => {
      if (!name) return;
      this.api.createTeam(name).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadTeams();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
    });
  }

  editTeam(team: Team): void {
    const ref = this.dialog.open(TeamDialogComponent, {
      width: '400px',
      data: { team },
    });
    ref.afterClosed().subscribe((name: string | undefined) => {
      if (!name || name === team.name) return;
      this.api.updateTeam(team.id, { name }).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadTeams();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
    });
  }

  async deleteTeam(team: Team): Promise<void> {
    const confirmed = await confirmAction(this.dialog, {
      title: LABELS.common.delete,
      message: LABELS.teams.deleteConfirm,
      confirmLabel: LABELS.common.delete,
      warn: true,
    });
    if (!confirmed) return;
    this.api.deleteTeam(team.id).subscribe({
      next: () => {
        this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
        this.loadTeams();
      },
      error: (err: HttpErrorResponse) => this.showError(err),
    });
  }

  private showError(err: HttpErrorResponse): void {
    const message =
      err.status === 409
        ? LABELS.teams.duplicate
        : (err.error?.error as string | undefined) || LABELS.common.error;
    this.snackBar.open(message, '', { duration: 4000 });
  }
}
