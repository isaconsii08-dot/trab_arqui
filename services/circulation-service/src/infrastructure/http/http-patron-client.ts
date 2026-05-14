import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPatronServiceClient,
  PatronSnapshot,
} from '../../application/ports/patron-service-client.interface';
import { PatronSuspendedError } from '@biblioflow/shared-errors';

@Injectable()
export class HttpPatronClient implements IPatronServiceClient {
  private readonly logger = new Logger(HttpPatronClient.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('PATRON_SERVICE_URL') ?? 'http://localhost:3001';
  }

  async getPatronByCardNumber(cardNumber: string): Promise<PatronSnapshot | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/v1/patrons/card/${cardNumber}`,
      );
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;
      return this.toSnapshot(data);
    } catch (err) {
      this.logger.warn(`Could not reach patron-service: ${String(err)}`);
      return null;
    }
  }

  async getPatronById(id: string): Promise<PatronSnapshot | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/patrons/${id}`);
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;
      return this.toSnapshot(data);
    } catch (err) {
      this.logger.warn(`Could not reach patron-service: ${String(err)}`);
      return null;
    }
  }

  async createFine(patronId: string, loanId: string, amount: number, reason: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/patrons/${patronId}/fines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, amount, reason }),
      });
    } catch (err) {
      this.logger.warn(`Could not create fine in patron-service: ${String(err)}`);
    }
  }

  private toSnapshot(data: Record<string, unknown>): PatronSnapshot {
    return {
      id: data.id as string,
      cardNumber: data.cardNumber as string,
      fullName: data.fullName as string,
      status: data.status as string,
      pendingFinesAmount: data.pendingFinesAmount as number ?? 0,
      assertCanBorrow(): void {
        if (data.status !== 'active') {
          throw new PatronSuspendedError(data.id as string);
        }
      },
    };
  }
}
