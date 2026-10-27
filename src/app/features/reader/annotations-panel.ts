import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  BOOKMARK_COLORS,
  Bookmark,
  BookmarkColor,
  colorHex,
  Highlight,
  HIGHLIGHT_COLORS,
  HighlightColor,
  Locator,
  TocEntry,
} from '../../core/domain';
import { ColorSwatches } from '../../shared/ui/color-swatches';
import { EmptyState } from '../../shared/ui/empty-state';

/** Painel lateral com destaques, marcadores e sumário do livro. */
@Component({
  selector: 'app-annotations-panel',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule, MatTabsModule, MatTooltipModule, ColorSwatches, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './annotations-panel.html',
  styleUrl: './annotations-panel.scss',
})
export class AnnotationsPanel {
  readonly highlights = input.required<readonly Highlight[]>();
  readonly bookmarks = input.required<readonly Bookmark[]>();
  readonly toc = input.required<readonly TocEntry[]>();

  readonly navigate = output<Locator>();
  readonly openHighlight = output<string>();
  readonly recolorBookmark = output<{ bookmark: Bookmark; color: BookmarkColor }>();
  readonly removeBookmark = output<Bookmark>();
  readonly closed = output<void>();

  protected readonly highlightColors = HIGHLIGHT_COLORS;
  protected readonly bookmarkColors = BOOKMARK_COLORS;
  protected readonly colorFilter = signal<HighlightColor | null>(null);

  protected readonly visibleHighlights = computed(() => {
    const filter = this.colorFilter();
    return filter ? this.highlights().filter((h) => h.color === filter) : this.highlights();
  });

  protected highlightHex(color: HighlightColor): string {
    return colorHex(HIGHLIGHT_COLORS, color);
  }

  protected bookmarkHex(color: BookmarkColor): string {
    return colorHex(BOOKMARK_COLORS, color);
  }

  protected toggleFilter(color: HighlightColor): void {
    this.colorFilter.update((current) => (current === color ? null : color));
  }

  protected hasAudio(highlight: Highlight): boolean {
    return highlight.comments.some((comment) => comment.audio);
  }
}
