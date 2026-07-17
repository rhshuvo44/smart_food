---
title: "ADR-002: MongoDB with Mongoose ODM"
status: accepted
date: 2026-07-13
deciders: Principal AI Architect, Database Engineer, Backend Lead
tags: [database, mongodb, mongoose, schema-design]
---

# ADR-002: MongoDB with Mongoose ODM

## Context

SmartFood requires a database that can handle:
- Flexible document structures (menu items with varying modifiers, order items with customizations)
- Geospatial queries (find nearby restaurants, delivery zone containment)
- Real-time order tracking updates
- Horizontal scalability for 100K+ orders/day
- Schema validation at multiple levels

The main contenders are relational (PostgreSQL) and document (MongoDB) databases.

## Decision

We will use **MongoDB 7.x** with **Mongoose 8.x** as the ODM layer.

### Schema Design Principles

1. **Per-domain collections**: Each domain owns its collections. No cross-domain collection access.
2. **Embed vs Reference**: Embed sub-documents that are always accessed together and have bounded growth (< 16MB). Reference data that grows unboundedly or is accessed independently.
3. **Money in cents**: All monetary values stored as integers (cents). Convert to decimal only for display.
4. **Soft deletes**: Every document has `isDeleted: boolean` and `deletedAt: Date | null`.
5. **Timestamps**: Every schema has `createdAt` and `updatedAt` via Mongoose `timestamps: true`.
6. **Optimistic locking**: Every document has a `version` field incremented on each update.
7. **Lean reads**: All read queries use `.lean()` to return plain JavaScript objects instead of full Mongoose documents.

### Validation Levels

| Level | Tool | Scope |
|-------|------|-------|
| 1. Schema | Mongoose Schema | Types, defaults, enums, required fields |
| 2. Application | Zod | API boundary validation, business rules |
| 3. Database | MongoDB Schema Validation | Defense in depth |

### Index Strategy

- Every foreign key indexed
- Compound indexes: equality → sort → range
- Maximum 5 indexes per collection
- 1 text index per collection maximum
- Geospatial indexes (2dsphere) for location queries
- Partial indexes for filtered queries (e.g., `isDeleted: false`)
- TTL indexes for expiring data (sessions, temp tokens)

## Alternatives Considered

### Alternative 1: PostgreSQL with Prisma/TypeORM
- **Pros**: Strong relational integrity, mature ACID transactions, excellent geospatial support (PostGIS), rich query capabilities
- **Cons**: Rigid schema makes menu item variations difficult (JSON columns or EAV pattern needed), migration overhead for schema changes, less natural fit for the highly dynamic food domain
- **Rejected because**: The food domain has inherently flexible data (menu modifiers, order customizations, varying restaurant configurations). MongoDB's document model maps naturally to these structures without requiring JSON hacks in relational tables.

### Alternative 2: MongoDB with native driver (no ODM)
- **Pros**: Maximum performance, full control over queries, smaller dependency footprint
- **Cons**: No schema validation at the application level, no middleware (pre-save hooks, cascading), manual type casting, more boilerplate for CRUD operations
- **Rejected because**: Mongoose provides schema-level validation that catches data integrity issues early, middleware for soft deletes and optimistic locking, and TypeScript type generation. The performance overhead of Mongoose is negligible (< 5%) and justified by the type safety and developer productivity gains.

## Consequences

### Positive
- Flexible schema accommodates varying restaurant menu structures
- Excellent geospatial query support (2dsphere indexes for delivery zones)
- Mongoose provides schema validation, middleware, and TypeScript integration
- Horizontal scaling via sharding when needed
- Change streams enable real-time event propagation without additional infrastructure
- Rich aggregation pipeline for analytics and reporting

### Negative
- No built-in join operations (use `$lookup` in aggregation — limited to 1 per query without approval)
- Document size limit (16MB) requires careful embedding strategy
- No foreign key constraints — referential integrity is application-level
- Eventually consistent by default (can use `writeConcern: majority` for stronger guarantees)
- Migration scripts required for schema changes (no automatic migrations like Rails/Prisma)

### Mitigations
- Enforce referential integrity at the application layer (service-level validation)
- Run MongoDB schema validation rules on each collection for defense in depth
- All migration scripts include both `up` and `down` operations
- Use `writeConcern: majority` and `readConcern: majority` for critical operations (payments, orders)

## Trade-offs

| Concern | MongoDB | PostgreSQL |
|---------|---------|------------|
| Schema flexibility | High (document model) | Low (relational) |
| Geospatial | Excellent (2dsphere) | Excellent (PostGIS) |
| Joins | Limited ($lookup) | Native (JOIN) |
| ACID transactions | Yes (v4.0+, multi-document) | Yes (mature) |
| Scalability | Horizontal (sharding) | Vertical (read replicas) |
| Migration tooling | Custom scripts | Prisma/Alembic mature |
| Development speed | Fast (flexible schema) | Slower (schema changes) |

## Migration Path

If MongoDB becomes a bottleneck:
1. Evaluate sharding for the hottest collections (Orders, by restaurantId or customerId)
2. If relational integrity is needed, extract Payments domain to PostgreSQL
3. Use MongoDB's Connector for BI if SQL-based reporting is required

Each extraction maintains the same Mongoose repository pattern — only the underlying database connection changes.
