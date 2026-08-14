import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { IdentityService } from '../core/services/identity.service';
import { ApiService } from '../core/services/api.service';
import { LABELS } from '../core/i18n/he';

@Component({
  selector: 'app-identity-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ labels.identity.title }}</h2>
    <mat-dialog-content>
      <p class="subtitle">{{ labels.identity.subtitle }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ labels.identity.name }}</mat-label>
        <input matInput [(ngModel)]="name" maxlength="80" />
      </mat-form-field>
      @if (recentNames.length) {
        <div class="recent">
          <p class="recent-label">{{ labels.identity.recent }}</p>
          <mat-chip-set>
            @for (item of recentNames; track item) {
              <mat-chip (click)="name = item">{{ item }}</mat-chip>
            }
          </mat-chip-set>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (!data.required) {
        <button mat-button (click)="dialogRef.close(false)">{{ labels.common.cancel }}</button>
      }
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="save()">
        {{ labels.identity.save }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .subtitle,
      .recent-label {
        color: var(--text-muted);
        margin: 0 0 12px;
        line-height: 1.45;
      }
      .recent {
        margin-top: 4px;
      }
      mat-chip {
        cursor: pointer;
      }
    `,
  ],
})
export class IdentityDialogComponent implements OnInit {
  readonly labels = LABELS;
  name = '';
  recentNames: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<IdentityDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { required: boolean },
    private identity: IdentityService,
    private api: ApiService
  ) {
    this.name = identity.name();
    this.recentNames = identity.recentNames();
  }

  ngOnInit(): void {
    this.api.getActors().subscribe({
      next: (names: string[]) => {
        this.identity.mergeKnownNames(names);
        this.recentNames = this.identity.recentNames();
      },
      error: () => undefined,
    });
  }

  save(): void {
    const value = this.name.trim();
    if (!value) return;
    this.identity.setName(value);
    this.dialogRef.close(true);
  }
}
