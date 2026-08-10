import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const isDark = localStorage.getItem('qa-theme-dark') === 'true';
document.documentElement.classList.toggle('dark-theme', isDark);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
