import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TestCatalogComponent } from './pages/test-catalog/test-catalog.component';
import { VersionsComponent } from './pages/versions/versions.component';
import { VersionWorkspaceComponent } from './pages/version-workspace/version-workspace.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'catalog', component: TestCatalogComponent },
      { path: 'versions', component: VersionsComponent },
      { path: 'versions/:id/workspace', component: VersionWorkspaceComponent },
      { path: 'teams', component: TeamsComponent },
      { path: 'reports', component: ReportsComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
