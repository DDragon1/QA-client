import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LABELS } from '../core/i18n/he';
import { ThemeService } from '../core/services/theme.service';
import { IdentityService } from '../core/services/identity.service';
import { IdentityDialogComponent } from '../shared/identity-dialog.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit {
  readonly labels = LABELS;
  readonly theme = inject(ThemeService);
  readonly identity = inject(IdentityService);
  private readonly dialog = inject(MatDialog);
  readonly navItems = [
    { path: '/dashboard', label: LABELS.nav.dashboard, icon: 'space_dashboard' },
    { path: '/catalog', label: LABELS.nav.catalog, icon: 'library_books' },
    { path: '/versions', label: LABELS.nav.versions, icon: 'layers' },
    { path: '/teams', label: LABELS.nav.teams, icon: 'groups' },
    { path: '/reports', label: LABELS.nav.reports, icon: 'summarize' },
  ];

  ngOnInit(): void {
    if (!this.identity.declared) {
      this.openIdentity(true);
    }
  }

  openIdentity(required: boolean): void {
    this.dialog.open(IdentityDialogComponent, {
      width: '440px',
      disableClose: required,
      data: { required },
    });
  }
}
