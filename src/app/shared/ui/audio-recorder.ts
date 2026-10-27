import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DurationPipe } from './duration.pipe';

export interface RecordedAudio {
  blob: Blob;
  duration: number;
}

const MAX_SECONDS = 300;

/** Grava áudio do microfone com MediaRecorder e emite o Blob resultante. */
@Component({
  selector: 'app-audio-recorder',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (recording()) {
      <button mat-flat-button type="button" class="recording" (click)="stop()">
        <mat-icon class="filled">stop_circle</mat-icon>
        {{ elapsed() | duration }}
      </button>
    } @else {
      <button
        mat-icon-button
        type="button"
        [matTooltip]="error() ?? 'Gravar áudio'"
        [disabled]="!supported"
        (click)="start()"
        aria-label="Gravar áudio"
      >
        <mat-icon [class.error]="error()">mic</mat-icon>
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .recording {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
      animation: pulse 1.4s ease-in-out infinite;
    }
    .error {
      color: var(--mat-sys-error);
    }
    @keyframes pulse {
      50% {
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--mat-sys-error) 25%, transparent);
      }
    }
  `,
})
export class AudioRecorder {
  readonly recorded = output<RecordedAudio>();
  protected readonly recording = signal(false);
  protected readonly elapsed = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  private recorder?: MediaRecorder;
  private timer?: ReturnType<typeof setInterval>;
  private discard = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.discard = true;
      this.stop();
    });
  }

  async start(): Promise<void> {
    this.error.set(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.error.set('Permita o acesso ao microfone para gravar');
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (this.discard || !chunks.length) return;
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      this.recorded.emit({ blob, duration: (Date.now() - startedAt) / 1000 });
    };

    recorder.start();
    this.recorder = recorder;
    this.recording.set(true);
    this.timer = setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      this.elapsed.set(seconds);
      if (seconds >= MAX_SECONDS) this.stop();
    }, 250);
  }

  stop(): void {
    clearInterval(this.timer);
    this.recorder?.stop();
    this.recorder = undefined;
    this.recording.set(false);
    this.elapsed.set(0);
  }
}
