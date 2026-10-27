import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';

/** Reproduz um áudio guardado como Blob, liberando a object URL ao trocar/destruir. */
@Component({
  selector: 'app-audio-clip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audio-clip.html',
  styleUrl: './audio-clip.scss',
})
export class AudioClip {
  readonly blob = input.required<Blob>();
  protected readonly url = computed(() => URL.createObjectURL(this.blob()));

  constructor() {
    effect((onCleanup) => {
      const url = this.url();
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }
}
