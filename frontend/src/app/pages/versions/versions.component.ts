import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AppVersion } from '../../core/models';
import { LABELS } from '../../core/i18n/he';
import { VersionDialogComponent } from './version-dialog.component';

@Component({
  selector: 'app-versions',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './versions.component.html',
  styleUrl: './versions.component.scss',
})
export class VersionsComponent implements OnInit {
  readonly labels = LABELS;
  loading = true;
  versions: AppVersion[] = [];
  displayedColumns = ['name', 'description', 'createdAt', 'stats', 'actions'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

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
    ref.afterClosed().subscribe((result: { name: string; description?: string } | undefined) => {
      if (!result) return;
      this.api.createVersion(result.name, result.description).subscribe({
        next: () => {
          this.snackBar.open(LABELS.common.success, '', { duration: 2000 });
          this.loadVersions();
        },
        error: () => this.snackBar.open(LABELS.common.error, '', { duration: 3000 }),
      });
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('he-IL');
  }
}
