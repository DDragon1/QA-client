import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AppVersion } from '../../core/models';
import { LABELS } from '../../core/i18n/he';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  readonly labels = LABELS;
  loading = true;
  versions: AppVersion[] = [];
  selectedVersionId = '';

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.api.getVersions().subscribe({
      next: (versions) => {
        this.versions = versions;
        this.selectedVersionId = versions[0]?.id ?? '';
        this.loading = false;
      },
      error: () => {
        this.snackBar.open(LABELS.common.error, '', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  downloadExcel(): void {
    if (!this.selectedVersionId) return;
    window.open(this.api.getReportExcelUrl(this.selectedVersionId), '_blank');
  }

  downloadPdf(): void {
    if (!this.selectedVersionId) return;
    window.open(this.api.getReportPdfUrl(this.selectedVersionId), '_blank');
  }
}
