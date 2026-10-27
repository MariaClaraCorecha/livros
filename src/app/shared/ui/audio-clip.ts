import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';

/** Reproduz um áudio guardado como Blob, liberando a object URL ao trocar/destruir. */
@Component({
  selector: 'app-audio-clip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<audio controls preload="metadata" [src]="url()"></audio>`,
  styles: `
    :host {
      display: block;
    }
    audio {
      inline-size: 100%;
      max-inline-size: 360px;
      block-size: 40px;
      border-radius: 999px;
    }
  `,
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
