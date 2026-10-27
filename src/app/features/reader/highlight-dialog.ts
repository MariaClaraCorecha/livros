import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ReadingSessionStore } from '../../core/application/reading-session.store';
import { colorHex, Highlight, HIGHLIGHT_COLORS, HighlightColor } from '../../core/domain';
import { AudioClip } from '../../shared/ui/audio-clip';
import { AudioRecorder, RecordedAudio } from '../../shared/ui/audio-recorder';
import { ColorSwatches } from '../../shared/ui/color-swatches';
import { confirmAction } from '../../shared/ui/confirm-dialog';
import { DurationPipe } from '../../shared/ui/duration.pipe';
import { EmojiPicker } from '../../shared/ui/emoji-picker';

export interface HighlightDialogData {
  highlightId: string;
}

/** Detalhes de um destaque: cor, reações com emoji e comentários em texto e áudio. */
@Component({
  selector: 'app-highlight-dialog',
  imports: [
    DatePipe,
    CdkTextareaAutosize,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
    AudioClip,
    AudioRecorder,
    ColorSwatches,
    DurationPipe,
    EmojiPicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './highlight-dialog.html',
  styleUrl: './highlight-dialog.scss',
})
export class HighlightDialog {
  private readonly store = inject(ReadingSessionStore);
  private readonly dialog = inject(MatDialog);
  private readonly ref = inject(MatDialogRef<HighlightDialog>);
  private readonly data = inject<HighlightDialogData>(MAT_DIALOG_DATA);
  private readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  protected readonly colors = HIGHLIGHT_COLORS;
  protected readonly highlight = computed(() => this.store.highlights().find((h) => h.id === this.data.highlightId));
  protected readonly hex = computed(() => colorHex(HIGHLIGHT_COLORS, this.highlight()?.color ?? 'yellow'));
  protected readonly draft = signal('');
  protected readonly audio = signal<RecordedAudio | null>(null);
  protected readonly sending = signal(false);
  protected readonly canSend = computed(() => !this.sending() && (!!this.draft().trim() || !!this.audio()));

  protected recolor(highlight: Highlight, color: HighlightColor): void {
    void this.store.recolorHighlight(highlight, color);
  }

  protected react(highlight: Highlight, emoji: string): void {
    void this.store.toggleReaction(highlight, emoji);
  }

  protected insertEmoji(emoji: string): void {
    const field = this.textarea()?.nativeElement;
    const text = this.draft();
    const start = field?.selectionStart ?? text.length;
    const end = field?.selectionEnd ?? text.length;
    this.draft.set(text.slice(0, start) + emoji + text.slice(end));
    queueMicrotask(() => {
      field?.focus();
      field?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  protected async send(highlight: Highlight): Promise<void> {
    if (!this.canSend()) return;
    this.sending.set(true);
    try {
      const audio = this.audio();
      await this.store.addComment(highlight, {
        text: this.draft().trim(),
        audio: audio?.blob,
        audioDuration: audio?.duration,
      });
      this.draft.set('');
      this.audio.set(null);
    } finally {
      this.sending.set(false);
    }
  }

  protected removeComment(highlight: Highlight, commentId: string): void {
    void this.store.removeComment(highlight, commentId);
  }

  protected async remove(highlight: Highlight): Promise<void> {
    const confirmed = await confirmAction(this.dialog, {
      title: 'Excluir destaque?',
      message: 'O destaque e todos os seus comentários serão apagados.',
    });
    if (!confirmed) return;
    await this.store.removeHighlight(highlight.id);
    this.ref.close();
  }
}
