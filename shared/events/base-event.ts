export interface IDomainEvent<T extends string = string> {
  id: string;
  type: T;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  correlationId: string;
  data: unknown;
}
