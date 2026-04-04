import { EventChannel, DomainEvent } from '@biblioflow/shared-events';

export interface IEventPublisher {
  publish<T>(channel: EventChannel, event: DomainEvent<T>): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('IEventPublisher');
