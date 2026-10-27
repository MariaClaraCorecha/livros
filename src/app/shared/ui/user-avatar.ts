import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { initials } from '../../core/domain';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" alt="" referrerpolicy="no-referrer" (error)="failed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ letters() }}</span>
    }
  `,
  host: {
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[style.--size.px]': 'size()',
    '[style.--ring]': 'ring() ?? "transparent"',
  },
  styles: `
    :host {
      --ring-width: max(2px, calc(var(--size) * 0.05));
      inline-size: var(--size);
      block-size: var(--size);
      flex: none;
      display: grid;
      place-items: center;
      border-radius: 50%;
      padding: var(--ring-width);
      background: var(--ring);
      overflow: hidden;
    }
    img,
    span {
      inline-size: 100%;
      block-size: 100%;
      border-radius: 50%;
      border: var(--ring-width) solid var(--mat-sys-surface);
    }
    img {
      object-fit: cover;
    }
    span {
      display: grid;
      place-items: center;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-weight: 600;
      font-size: calc(var(--size) * 0.36);
    }
  `,
})
export class UserAvatar {
  readonly name = input('');
  readonly src = input<string | undefined>();
  readonly ring = input<string | undefined>();
  readonly size = input(40);
  protected readonly letters = computed(() => initials(this.name()));
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
