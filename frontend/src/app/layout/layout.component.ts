import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LABELS } from '../core/i18n/he';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  readonly labels = LABELS;
  readonly theme = inject(ThemeService);
  readonly navItems = [
    { path: '/dashboard', label: LABELS.nav.dashboard, icon: 'dashboard' },
    { path: '/catalog', label: LABELS.nav.catalog, icon: 'list_alt' },
    { path: '/versions', label: LABELS.nav.versions, icon: 'layers' },
    { path: '/reports', label: LABELS.nav.reports, icon: 'description' },
  ];
}
