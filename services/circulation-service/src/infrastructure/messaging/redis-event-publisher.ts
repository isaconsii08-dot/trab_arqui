import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IEventPublisher } from '../../application/ports/event-publisher.interface';
import { EventChannel, DomainEvent } from '@biblioflow/shared-events';

@Injectable()
export class RedisEventPublisher implements IEventPublisher, OnModuleInit {
  private readonly logger = new Logger(RedisEventPublisher.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST') ?? 'localhost',
      port: this.config.get<number>('REDIS_PORT') ?? 6379,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async publish<T>(channel: EventChannel, event: DomainEvent<T>): Promise<void> {
    try {
      await this.client.publish(channel as string, JSON.stringify(event));
    } catch (err) {
      this.logger.error(`Failed to publish to ${channel}`, err);
      throw err;
    }
  }
}
