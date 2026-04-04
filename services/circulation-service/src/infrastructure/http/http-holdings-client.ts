import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IHoldingsServiceClient,
  ItemSnapshot,
} from '../../application/ports/holdings-service-client.interface';

@Injectable()
export class HttpHoldingsClient implements IHoldingsServiceClient {
  private readonly logger = new Logger(HttpHoldingsClient.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('HOLDINGS_SERVICE_URL') ?? 'http://localhost:3003';
  }

  async reserveItem(barcode: string): Promise<ItemSnapshot | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/v1/holdings/items/${barcode}/reserve`,
        { method: 'PATCH' },
      );
      if (!res.ok) return null;
      return await res.json() as ItemSnapshot;
    } catch (err) {
      this.logger.warn(`Could not reach holdings-service: ${String(err)}`);
      return null;
    }
  }

  async releaseItem(barcode: string): Promise<void> {
    try {
      await fetch(
        `${this.baseUrl}/api/v1/holdings/items/${barcode}/release`,
        { method: 'PATCH' },
      );
    } catch (err) {
      this.logger.warn(`Could not release item ${barcode}: ${String(err)}`);
    }
  }

  async getItemByBarcode(barcode: string): Promise<ItemSnapshot | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/holdings/items/${barcode}`);
      if (!res.ok) return null;
      return await res.json() as ItemSnapshot;
    } catch (err) {
      this.logger.warn(`Could not reach holdings-service: ${String(err)}`);
      return null;
    }
  }
}
