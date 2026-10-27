import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

const EMOJI_GROUPS = [
  {
    label: 'Reações',
    emojis: [
      '❤️',
      '😍',
      '😂',
      '😮',
      '😢',
      '😡',
      '👏',
      '🔥',
      '💡',
      '⭐',
      '✅',
      '❓',
      '👍',
      '👎',
      '🙌',
      '💯',
    ],
  },
  {
    label: 'Leitura',
    emojis: [
      '📚',
      '📖',
      '🔖',
      '✍️',
      '📝',
      '💭',
      '🧠',
      '🎯',
      '📌',
      '🔍',
      '💬',
      '🗝️',
      '☕',
      '🕯️',
      '🎧',
      '🏷️',
    ],
  },
  {
    label: 'Emoções',
    emojis: [
      '😊',
      '🥰',
      '🤔',
      '😌',
      '🥲',
      '😱',
      '🤯',
      '😴',
      '🙃',
      '😎',
      '🤩',
      '😬',
      '😇',
      '🥹',
      '😤',
      '🫶',
    ],
  },
  {
    label: 'Natureza',
    emojis: [
      '🌱',
      '🌿',
      '🌸',
      '🌙',
      '☀️',
      '🌊',
      '🍂',
      '🌈',
      '⚡',
      '❄️',
      '🍃',
      '🌻',
      '🦋',
      '🐾',
      '🌍',
      '✨',
    ],
  },
] as const;

/** Grade de emojis por categoria; feita para viver dentro de um mat-menu. */
@Component({
  selector: 'app-emoji-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './emoji-picker.html',
  styleUrl: './emoji-picker.scss',
})
export class EmojiPicker {
  protected readonly groups = EMOJI_GROUPS;
  protected readonly active = signal(0);
  readonly picked = output<string>();
}
