// ─────────────────────────────────────────────────────────────────────────────
// CardNumber – Value Object
// Format: LIB-YYYYMMDD-XXXX (library prefix + date + 4-char suffix)
// ─────────────────────────────────────────────────────────────────────────────

export class CardNumber {
  private static readonly REGEX = /^[A-Z]{2,6}-\d{8}-[A-Z0-9]{4}$/;

  private constructor(private readonly value: string) {}

  static create(raw: string): CardNumber {
    const normalized = raw.trim().toUpperCase();
    if (!CardNumber.REGEX.test(normalized)) {
      throw new Error(`Invalid card number format: ${raw}. Expected format: LIB-YYYYMMDD-XXXX`);
    }
    return new CardNumber(normalized);
  }

  static generate(libraryPrefix: string): CardNumber {
    const prefix = libraryPrefix.toUpperCase().slice(0, 6);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return new CardNumber(`${prefix}-${date}-${suffix}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CardNumber): boolean {
    return this.value === other.value;
  }
}
