---
title: "ADR-004: In-Process Event Bus for Cross-Domain Communication"
status: accepted
date: 2026-07-13
deciders: Principal AI Architect, Backend Lead
tags: [architecture, events, event-bus, cross-domain]
---

# ADR-004: In-Process Event Bus for Cross-Domain Communication

## Context

SmartFood's modular monolith decomposes the backend into 7 strict domain boundaries. Domains must communicate without direct coupling. For example:

- When an order is created (Orders domain), the Delivery domain must assign a driver
- When a payment is completed (Payments domain), the Orders domain must confirm the order
- When a menu is updated (Restaurants domain), the Orders domain must re-validate pending orders

The communication mechanism must be:
- Type-safe (TypeScript compile-time checks)
- Traceable (events persisted for audit)
- Real-time capable (mirrored to Socket.IO for mobile clients)
- Reliable (at-least-once delivery, retry with backoff)

## Decision

We will implement an **in-process typed event bus** with MongoDB persistence for reliability and replay capability.

### Architecture

```
┌────────────┐     ┌──────────────────────┐     ┌────────────┐
│ Publisher  │────▶│    Event Bus          │────▶│ Subscriber │
│ (Service)  │     │                      │     │ (Service)  │
└────────────┘     │  ┌────────────────┐  │     └────────────┘
                   │  │ Event Router   │  │
                   │  │ (in-process)   │  │
                   │  └────────┬───────┘  │
                   │           │          │
                   │  ┌────────▼───────┐  │     ┌────────────┐
                   │  │ MongoDB        │──────▶  │ Socket.IO  │
                   │  │ Persistence    │  │     │ Broadcast  │
                   │  └────────────────┘  │     └────────────┘
                   └──────────────────────┘
```

### Event Schema

Every event follows this typed interface:

```typescript
interface DomainEvent<T = unknown> {
  id: string;              // UUID v4 — unique event identifier
  type: string;            // "order.created", "payment.completed"
  aggregateId: string;     // ID of the aggregate root (e.g., orderId)
  aggregateType: string;   // "order", "payment", "restaurant"
  data: T;                 // Payload specific to the event type
  metadata: {
    correlationId: string; // Tracing across domain boundaries
    causationId?: string;  // Event that caused this event (causation chain)
    occurredAt: Date;      // When the event was created
    version: number;       // Event schema version for backward compatibility
    publishedBy: string;   // Domain that published the event
  };
}
```

### Event Registry

All events are defined in a central registry at `shared/events/` with typed interfaces:

```
shared/events/
├── index.ts                 # Re-exports all event types
├── order.events.ts          # IOrderCreatedEvent, IOrderCancelledEvent, etc.
├── payment.events.ts        # IPaymentCompletedEvent, IPaymentFailedEvent
├── restaurant.events.ts     # IMenuUpdatedEvent, IRestaurantStatusEvent
├── delivery.events.ts       # IDeliveryAssignedEvent, IDeliveryCompletedEvent
└── notification.events.ts   # INotificationRequiredEvent
```

### Delivery Guarantees

| Characteristic | Implementation |
|----------------|----------------|
| Delivery | At-least-once (persist before dispatch, retry on failure) |
| Ordering | Per-aggregate FIFO (events for the same aggregate are processed in order) |
| Retry | Exponential backoff: 100ms → 500ms → 2s → 10s → dead letter |
| Dead letter | Events exceeding retry limit stored in `dead_letter_events` collection for manual inspection |
| Persistence | Events stored in `domain_events` collection with TTL index (90-day retention) |

### Subscriber Registration

```typescript
// Domains register subscribers at application startup
eventBus.subscribe('order.created', deliveryService.onOrderCreated, {
  groupId: 'delivery',
  retryOnFailure: true,
  maxRetries: 5,
});

eventBus.subscribe('payment.completed', orderService.onPaymentCompleted, {
  groupId: 'orders',
  retryOnFailure: true,
  maxRetries: 3,
});
```

### Socket.IO Mirroring

Events that require real-time updates are mirrored to Socket.IO rooms:
- `order.created` → customer's room + restaurant's room
- `delivery.assigned` → customer's room
- `restaurant.status` → all customers browsing that restaurant

## Alternatives Considered

### Alternative 1: Message Queue (RabbitMQ / Redis Streams / BullMQ)
- **Pros**: Mature message broker, guaranteed delivery, consumer groups, dead letter queues built-in, horizontal scaling (multiple services can consume independently)
- **Cons**: Additional infrastructure to manage, network latency, serialization overhead, operational complexity, violates "no Redis" and "no BullMQ" constraints
- **Rejected because**: The modular monolith architecture means all domains run in the same process — an external message broker adds complexity without benefit. If we extract domains into microservices later, we can swap the in-process bus for a message queue without changing the event schema or subscriber interfaces.

### Alternative 2: Direct method calls between services
- **Pros**: Simplest implementation, compile-time type safety, no serialization, synchronous consistency
- **Cons**: Tight coupling between domains, no audit trail, difficult to add new consumers, can't replay events, no real-time broadcast capability
- **Rejected because**: Direct coupling violates the domain isolation principle. Event-driven architecture gives us loose coupling, auditability, and extensibility without significant complexity.

## Consequences

### Positive
- **Loose coupling**: Domains only know about event types, not about each other's implementations
- **Audit trail**: Every cross-domain action is recorded with causation chain
- **Replay capability**: Events can be replayed to rebuild state or catch up subscribers after downtime
- **Real-time mirroring**: Same events serve both in-process subscribers and Socket.IO clients
- **Type safety**: Events are typed TypeScript interfaces — compiler catches mismatches
- **Extraction ready**: When a domain becomes a microservice, the event schema stays the same — only the transport changes

### Negative
- **In-process only**: Cannot independently scale subscribers — all run in the same process
- **Memory pressure**: If a subscriber is slow, events queue in memory (mitigated by MongoDB persistence)
- **No built-in consumer groups**: Each subscriber gets every event (OK in monolith, but affects extraction)
- **Dead letter handling requires manual operations**: No auto-retry UI like RabbitMQ management
- **Event schema versioning**: Breaking changes to event schemas require coordinated subscriber updates

### Mitigations
- MongoDB persistence ensures events are not lost on process restart
- Dead letter collection with admin dashboard for manual retry
- Event schema version field allows coexistence of old and new subscribers during migration
- Performance monitoring on event processing latency (alert if > 500ms per event)

## Trade-offs

| Concern | In-Process Bus | Message Queue (RabbitMQ) |
|---------|---------------|--------------------------|
| Latency | ~0ms (in-process) | 1-10ms (network) |
| Operational complexity | None (in-process) | High (cluster management) |
| Independent scaling | No | Yes |
| Dead letter management | Manual | Built-in UI |
| Audit trail | MongoDB persistence | RabbitMQ + custom |
| Extraction readiness | Transport swap needed | Already distributed |

## Migration Path

When extracting a domain to a microservice:
1. Replace `eventBus.publish()` with a message queue producer (same event interface)
2. Replace `eventBus.subscribe()` with a message queue consumer (same event interface)
3. The event types, schemas, and handler interfaces remain unchanged
4. Socket.IO mirroring moves to the API gateway or a dedicated real-time service
