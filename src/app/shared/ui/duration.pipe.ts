import { Pipe, PipeTransform } from '@angular/core';

/** Segundos → "m:ss". */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    const total = Math.max(0, Math.round(seconds ?? 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }
}
