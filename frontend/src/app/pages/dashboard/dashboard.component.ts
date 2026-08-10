import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AppVersion } from '../../core/models';
import { LABELS } from '../../core/i18n/he';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly labels = LABELS;
  readonly circumference = 2 * Math.PI * 52;
  loading = true;
  versions: AppVersion[] = [];
  selectedVersionId = '';
  selectedVersion: AppVersion | null = null;
  error = '';

  constructor(private api: ApiService) {}

  get activeVersions(): AppVersion[] {
    return this.versions.filter((v) => !v.finishedAt);
  }

  get closedVersions(): AppVersion[] {
    return this.versions.filter((v) => !!v.finishedAt);
  }

  get completionPercent(): number {
    const total = this.selectedVersion?.stats.total ?? 0;
    if (!total) return 0;
    return Math.round(((this.selectedVersion?.stats.done ?? 0) / total) * 100);
  }

  get completionLabel(): string {
    return `${this.selectedVersion?.stats.done ?? 0}/${this.selectedVersion?.stats.total ?? 0} ${LABELS.runStatus.done}`;
  }

  get ringOffset(): number {
    return this.circumference * (1 - this.completionPercent / 100);
  }

  ngOnInit(): void {
    this.api.getVersions().subscribe({
      next: (versions) => {
        this.versions = versions;
        this.selectedVersionId = versions[0]?.id ?? '';
        this.selectedVersion = versions[0] ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = LABELS.common.error;
        this.loading = false;
      },
    });
  }

  onVersionChange(versionId: string): void {
    this.selectedVersionId = versionId;
    this.selectedVersion = this.versions.find((v) => v.id === versionId) ?? null;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('he-IL');
  }

  versionOptionLabel(version: AppVersion): string {
    return `${version.name} · ${this.formatDate(version.createdAt)}`;
  }
}
