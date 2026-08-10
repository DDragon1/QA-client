import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AppVersion } from '../../core/models';
import { LABELS } from '../../core/i18n/he';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly labels = LABELS;
  loading = true;
  latestVersion: AppVersion | null = null;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getVersions().subscribe({
      next: (versions) => {
        this.latestVersion = versions[0] ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = LABELS.common.error;
        this.loading = false;
      },
    });
  }
}
