import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IEventPublisher } from '../../application/ports/event-publisher.interface';
import { EventChannel, DomainEvent } from '@biblioflow/shared-events';

// ─────────────────────────────────────────────────────────────────────────────
// RedisEventPublisher – Publishes domain events to Redis Pub/Sub channels
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RedisEventPublisher implements IEventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventPublisher.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.client.on('connect', () => this.logger.log('Redis publisher connected'));
    this.client.on('error', (err) => this.logger.error('Redis publisher error', err));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async publish<T>(channel: EventChannel, event: DomainEvent<T>): Promise<void> {
    const message = JSON.stringify(event);
    await this.client.publish(channel, message);
    this.logger.debug(`Published event [${channel}] id=${event.eventId}`);
  }
}
