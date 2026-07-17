---
title: "ADR-001: Modular Monolith Architecture"
status: accepted
date: 2026-07-13
deciders: Principal AI Architect, Product Manager, CTO
tags: [architecture, modular-monolith, domain-driven-design]
---

# ADR-001: Modular Monolith Architecture

## Context

SmartFood is an enterprise food delivery platform connecting customers, restaurants, and administrators. The platform must handle 100,000+ orders per day, process real-time payments, manage geospatial delivery logistics, and provide multi-tenant administration.

The central architectural question is: **should the backend be built as a monolith or as microservices?**

Key considerations:
- Team size: 20+ engineers across multiple squads
- Scale requirements: 100K orders/day, 99.9% uptime, sub-500ms p95
- Development velocity: need fast iteration in early stages
- Operational complexity: small DevOps team initially
- Domain complexity: 7 distinct bounded contexts (Orders, Restaurants, Customers, Payments, Delivery, Notifications, Analytics)

## Decision

We will build the SmartFood backend as a **modular monolith** — a single deployable Express.js application decomposed into strict domain boundaries.

Each domain is a self-contained module with its own:
- Routes, controllers, services, repositories, models
- Zod validation schemas
- Event definitions (emitted and consumed)
- TypeScript types

Cross-domain communication is strictly governed:
- **No direct database access** across domain boundaries
- **No importing controllers or models** from another domain
- **Typed event bus** for asynchronous communication
- **Service interfaces** for synchronous needs (via DI container)

## Alternatives Considered

### Alternative 1: Microservices
- **Pros**: Independent deployability, team autonomy, technology diversity, independent scaling
- **Cons**: Operational complexity (service discovery, circuit breakers, distributed tracing), data consistency challenges (eventual consistency, sagas), network latency, debugging difficulty, higher infrastructure costs
- **Rejected because**: The DevOps team is small, the scale target (100K orders/day) is well within a monolith's capability, and the operational overhead would slow early development. We can extract domains into microservices later if profiling proves necessary.

### Alternative 2: Monolithic (no domain boundaries)
- **Pros**: Simplest initial architecture, fastest development, no cross-domain communication overhead
- **Cons**: Tight coupling, no team autonomy, "big ball of mud" risk, difficult to test in isolation, impossible to extract services later
- **Rejected because**: With 20+ engineers and 7 domains, architectural drift is inevitable without enforced boundaries. The modular approach gives us microservices-like discipline without the operational cost.

## Consequences

### Positive
- Single deployable unit — simple CI/CD, simple operations
- Fast inter-domain communication (in-process, no network)
- Easy debugging and end-to-end testing
- If a domain becomes a bottleneck, it can be extracted to a separate service (proven by profiling)
- TypeScript strict mode ensures compile-time safety across domain boundaries

### Negative
- All domains scale together — cannot independently scale hot domains
- Deployment requires full application restart — no per-domain deployments
- Team coordination required for shared kernel changes
- Risk of the monolith becoming tightly coupled if boundaries are not enforced

### Mitigations
- CI pipeline enforces no cross-domain imports (custom ESLint rule)
- Shared kernel (`shared/`) changes require review from all affected teams
- Each domain has its own MongoDB collection(s) — no shared collections
- Event schema registry in `shared/events/` for type-safe cross-domain events

## Trade-offs

| Concern | Modular Monolith | Microservices |
|---------|-----------------|---------------|
| Deployment complexity | Low (1 deployable) | High (7+ services) |
| Team autonomy | Medium (shared repo) | High (independent repos) |
| Inter-service latency | ~0ms (in-process) | 1-50ms (network) |
| Debugging | Easy (single process) | Hard (distributed) |
| Independent scaling | No | Yes |
| Technology diversity | Limited (same stack) | Full (per service) |
| Operational cost | Low | High |
| Extraction path | Clean (bounded contexts) | N/A (already extracted) |

## Migration Path

If profiling proves a specific domain (e.g., Orders) is a bottleneck:

1. Extract the domain's data into its own MongoDB replica set
2. Create a standalone Express service with its own API surface
3. Implement an API gateway to route requests to the new service
4. Replace the in-process event bus subscription with a message queue (RabbitMQ/Redis)
5. Update the shared kernel to define the service contract
6. Run load tests to verify the improvement

This migration is low-risk because domain boundaries are already strict — we're simply changing the deployment boundary from in-process to network.
