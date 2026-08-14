import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { AppVersion, Environment } from '../../core/models';
import { ENVIRONMENT_OPTIONS, LABELS } from '../../core/i18n/he';
import { VersionDialogComponent } from './version-dialog.component';
import { confirmAction } from '../../shared/confirm';
import { finishWarningMessages } from '../../core/utils/finish-warnings';

@Component({
  selector: 'app-versions',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './versions.component.html',
  styleUrl: './versions.component.scss',
})
export class VersionsComponent implements OnInit {
  readonly labels = LABELS;
  readonly environmentOptions = ENVIRONMENT_OPTIONS;
  loading = true;
  finishingId: string | null = null;
  versions: AppVersion[] = [];
  environmentFilter: Environment | '' = '';

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get filteredVersions(): AppVersion[] {
    if (!this.environmentFilter) return this.versions;
    return this.versions.filter((v) => v.environment === this.environmentFilter);
  }

  ngOnInit(): void {
    this.loadVersions();
  }

  loadVersions(): void {
    this.loading = true;
    this.api.getVersions().subscribe({
      next: (versions) => {
        this.versions = versions;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  createVersion(): void {
    const ref = this.dialog.open(VersionDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe(
      (
        result:
          | { name: string; description?: string; environment: Environment }
          | undefined
      ) => {
        if (!result) return;
        this.api.createVersion(result.name, result.description, result.environment).subscribe({
          next: () => {
            this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
            this.loadVersions();
          },
          error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
        });
      }
    );
  }

  async finishVersion(version: AppVersion): Promise<void> {
    if (version.finishedAt || this.finishingId) return;
    const warnings = finishWarningMessages(version);
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

    this.finishingId = version.id;
    this.api.finishVersion(version.id).subscribe({
      next: (updated) => {
        const index = this.versions.findIndex((v) => v.id === version.id);
        if (index >= 0) this.versions[index] = updated;
        this.finishingId = null;
        this.snackBar.open(LABELS.versions.finishSuccess, '', { duration: 2500 });
      },
      error: (err: HttpErrorResponse) => {
        this.finishingId = null;
        const message =
          err.status === 400
            ? LABELS.versions.alreadyFinished
            : (err.error?.error as string | undefined) || LABELS.common.error;
        this.snackBar.open(message, '', { duration: 3500 });
        if (err.status === 400) this.loadVersions();
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('he-IL');
  }

  progressPercent(version: AppVersion): number {
    if (!version.stats.total) return 0;
    return Math.round((version.stats.done / version.stats.total) * 100);
  }
}
