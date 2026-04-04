import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EVENTS, DomainEvent, LoanCreatedPayload } from '@biblioflow/shared-events';

// ─────────────────────────────────────────────────────────────────────────────
// LoanCreatedHandler
// Subscribes to loan.created events and schedules return reminder notifications
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class LoanCreatedHandler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LoanCreatedHandler.name);
  private subscriber: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.subscriber = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
    });

    this.subscriber.subscribe(EVENTS.LOAN_CREATED, EVENTS.HOLD_AVAILABLE, EVENTS.LOAN_OVERDUE);

    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });

    this.logger.log(`Subscribed to: ${EVENTS.LOAN_CREATED}, ${EVENTS.HOLD_AVAILABLE}, ${EVENTS.LOAN_OVERDUE}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber.quit();
  }

  private handleMessage(channel: string, message: string): void {
    try {
      const event = JSON.parse(message) as DomainEvent<unknown>;

      switch (channel) {
        case EVENTS.LOAN_CREATED: {
          const payload = event.payload as LoanCreatedPayload;
          this.logger.log(`Scheduling return reminder for loan ${payload.loanId}, due ${payload.dueDate}`);
          // TODO: Schedule email via job queue (BullMQ) 24h before dueDate
          break;
        }
        case EVENTS.HOLD_AVAILABLE: {
          this.logger.log(`Notifying patron that hold is available`);
          // TODO: Send "your reservation is ready" email/push
          break;
        }
        case EVENTS.LOAN_OVERDUE: {
          this.logger.log(`Sending overdue notice`);
          // TODO: Send overdue notification
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle message on channel ${channel}`, error);
    }
  }
}
