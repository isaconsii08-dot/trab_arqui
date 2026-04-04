// ─────────────────────────────────────────────────────────────────────────────
// Email – Value Object
// Ensures email format validity at the domain level
// ─────────────────────────────────────────────────────────────────────────────

export class Email {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.REGEX.test(normalized)) {
      throw new Error(`Invalid email format: ${raw}`);
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
