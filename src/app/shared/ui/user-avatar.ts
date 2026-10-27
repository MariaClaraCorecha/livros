import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { initials } from '../../core/domain';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-avatar.html',
  host: {
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[style.--size.px]': 'size()',
    '[style.--ring]': 'ring() ?? "transparent"',
  },
  styleUrl: './user-avatar.scss',
})
export class UserAvatar {
  readonly name = input('');
  readonly src = input<string | undefined>();
  readonly ring = input<string | undefined>();
  readonly size = input(40);
  protected readonly letters = computed(() => initials(this.name()));
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
