import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

const EMOJI_GROUPS = [
  { label: 'Reações', emojis: ['❤️', '😍', '😂', '😮', '😢', '😡', '👏', '🔥', '💡', '⭐', '✅', '❓', '👍', '👎', '🙌', '💯'] },
  { label: 'Leitura', emojis: ['📚', '📖', '🔖', '✍️', '📝', '💭', '🧠', '🎯', '📌', '🔍', '💬', '🗝️', '☕', '🕯️', '🎧', '🏷️'] },
  { label: 'Emoções', emojis: ['😊', '🥰', '🤔', '😌', '🥲', '😱', '🤯', '😴', '🙃', '😎', '🤩', '😬', '😇', '🥹', '😤', '🫶'] },
  { label: 'Natureza', emojis: ['🌱', '🌿', '🌸', '🌙', '☀️', '🌊', '🍂', '🌈', '⚡', '❄️', '🍃', '🌻', '🦋', '🐾', '🌍', '✨'] },
] as const;

/** Grade de emojis por categoria; feita para viver dentro de um mat-menu. */
@Component({
  selector: 'app-emoji-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist" (click)="$event.stopPropagation()">
      @for (group of groups; track group.label; let index = $index) {
        <button type="button" role="tab" [attr.aria-selected]="active() === index" (click)="active.set(index)">
          {{ group.emojis[0] }} <span>{{ group.label }}</span>
        </button>
      }
    </div>
    <div class="grid" role="listbox" [attr.aria-label]="groups[active()].label">
      @for (emoji of groups[active()].emojis; track emoji) {
        <button type="button" role="option" class="emoji" [attr.aria-label]="emoji" (click)="picked.emit(emoji)">
          {{ emoji }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px;
      inline-size: 296px;
      max-inline-size: 100%;
    }
    .tabs {
      display: flex;
      gap: 4px;
      margin-block-end: 8px;
      overflow-x: auto;
    }
    .tabs button {
      border: 0;
      border-radius: 999px;
      padding: 4px 10px;
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
      cursor: pointer;
    }
    .tabs button[aria-selected='true'] {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .tabs span {
      display: none;
    }
    .tabs button[aria-selected='true'] span {
      display: inline;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 2px;
    }
    .emoji {
      border: 0;
      background: transparent;
      font-size: 22px;
      line-height: 1;
      aspect-ratio: 1;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 100ms ease, background 100ms ease;
    }
    .emoji:hover,
    .emoji:focus-visible {
      background: var(--mat-sys-surface-container-high);
      transform: scale(1.15);
      outline: none;
    }
  `,
})
export class EmojiPicker {
  protected readonly groups = EMOJI_GROUPS;
  protected readonly active = signal(0);
  readonly picked = output<string>();
}
