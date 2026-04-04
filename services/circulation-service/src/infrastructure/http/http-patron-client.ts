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
      const data = await res.json() as any;
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
      const data = await res.json() as any;
      return this.toSnapshot(data);
    } catch (err) {
      this.logger.warn(`Could not reach patron-service: ${String(err)}`);
      return null;
    }
  }

  private toSnapshot(data: any): PatronSnapshot {
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
