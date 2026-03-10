// Subtle spinner using process.stderr

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

/** Terminal spinner that writes to stderr so stdout stays clean. */
export class Spinner {
  private text: string;
  private frame = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly isTTY: boolean;

  constructor(text = 'Working...') {
    this.text = text;
    this.isTTY = process.stderr.isTTY ?? false;
  }

  /** Start the spinner. Returns `this` for chaining. */
  start(text?: string): this {
    if (text !== undefined) this.text = text;
    if (!this.isTTY) return this;
    this.timer = setInterval(() => {
      const f = FRAMES[this.frame % FRAMES.length] ?? FRAMES[0];
      process.stderr.write(`\r\x1b[36m${f}\x1b[0m ${this.text}`);
      this.frame++;
    }, 80);
    return this;
  }

  /** Update spinner text without restarting. */
  update(text: string): this {
    this.text = text;
    return this;
  }

  /** Stop the spinner and optionally print a final message. */
  stop(finalText?: string): this {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.isTTY) {
      process.stderr.write('\r\x1b[K'); // clear line
    }
    if (finalText !== undefined) {
      process.stderr.write(finalText + '\n');
    }
    return this;
  }
}
