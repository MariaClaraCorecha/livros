import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badge"><mat-icon>{{ icon() }}</mat-icon></div>
    <h3>{{ title() }}</h3>
    <p class="muted">{{ message() }}</p>
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      padding: 40px 16px;
    }
    .badge {
      inline-size: 72px;
      block-size: 72px;
      border-radius: 24px;
      display: grid;
      place-items: center;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      margin-block-end: 8px;
    }
    .badge mat-icon {
      font-size: 36px;
      inline-size: 36px;
      block-size: 36px;
    }
    h3 {
      font: var(--mat-sys-title-medium);
    }
    p {
      margin: 0 0 12px;
      max-inline-size: 360px;
    }
  `,
})
export class EmptyState {
  readonly icon = input('info');
  readonly title = input.required<string>();
  readonly message = input('');
}
