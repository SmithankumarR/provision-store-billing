/**
 * ESC/POS Command Builder for Thermal Receipt Printers (58mm / 80mm)
 * Generates raw byte buffers compatible with standard Bluetooth receipt printers.
 */

export enum Align {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

export enum TextSize {
  NORMAL = 0,
  DOUBLE_HEIGHT = 1,
  DOUBLE_WIDTH = 2,
  DOUBLE_BOTH = 3,
}

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /**
   * Reset printer settings to default
   */
  public init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /**
   * Set text alignment
   */
  public setAlign(align: Align): this {
    this.buffer.push(0x1b, 0x61, align);
    return this;
  }

  /**
   * Enable/Disable bold text
   */
  public setBold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  /**
   * Set font size
   */
  public setTextSize(size: TextSize): this {
    let mode = 0x00;
    if (size === TextSize.DOUBLE_HEIGHT) mode = 0x01;
    if (size === TextSize.DOUBLE_WIDTH) mode = 0x10;
    if (size === TextSize.DOUBLE_BOTH) mode = 0x11;

    this.buffer.push(0x1d, 0x21, mode);
    return this;
  }

  /**
   * Print text string
   */
  public text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 0x3f); // ASCII fallback
    }
    return this;
  }

  /**
   * Print text string with newline
   */
  public textLine(str: string = ''): this {
    this.text(str);
    this.newLine();
    return this;
  }

  /**
   * Insert line feeds
   */
  public newLine(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  /**
   * Print a horizontal divider line of specified character and width
   */
  public divider(width: number = 32, char: string = '-'): this {
    this.textLine(char.repeat(width));
    return this;
  }

  /**
   * Cut paper command
   */
  public cut(): this {
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  /**
   * Export final Uint8Array byte array for transmission over Bluetooth
   */
  public build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Export array of numbers
   */
  public toArray(): number[] {
    return [...this.buffer];
  }
}
