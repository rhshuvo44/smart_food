# API Standards

## Base URL

All API endpoints are versioned:

```
/api/v1/{resource}
/api/v2/{resource}  (future)
```

## Standard Response Envelope

Every API response follows this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  correlationId: string;
}
```

### Success Response

```json
{
  "success": true,
  "data": { "id": "abc123", "status": "pending" },
  "correlationId": "req-abc-123"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Minimum 8 characters"]
    }
  },
  "correlationId": "req-abc-123"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  },
  "correlationId": "req-abc-123"
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (malformed syntax) |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (version conflict, duplicate) |
| 422 | Validation error (field-level) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| VALIDATION_ERROR | 422 | Input validation failed |
| AUTH_ERROR | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource does not exist |
| CONFLICT | 409 | State conflict (optimistic locking) |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

## HTTP Methods

| Method | Action | Idempotent | Safe |
|--------|--------|-----------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create resource | No (use Idempotency-Key) | No |
| PUT | Full replacement | Yes | No |
| PATCH | Partial update | No (use Idempotency-Key) | No |
| DELETE | Remove resource | Yes | No |

## Idempotency

All POST, PUT, PATCH, DELETE endpoints must honor the `Idempotency-Key` header:

```http
Idempotency-Key: 123e4567-e89b-12d3-a456-426614174000
```

- Duplicate requests with the same key return the cached response
- Keys expire after 24 hours
- Keys are UUID v4 format

## Pagination

- Default page size: 20 items
- Maximum page size: 100 items
- Cursor-based pagination preferred for large datasets
- Page-based pagination acceptable for small datasets (< 1000 items)

```http
GET /api/v1/orders?page=1&limit=20
GET /api/v1/orders?cursor=abc123&limit=20
```

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global | 100 requests | per minute per IP |
| Auth endpoints | 5 requests | per 15 minutes per IP |
| Order creation | 10 requests | per minute per user |
| Search | 30 requests | per minute per user |

Rate limit headers in every response:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1626180000
```

## Authentication

- All endpoints except health, login, register, forgot-password require authentication
- Auth header: `Authorization: Bearer <access_token>`
- Access tokens: JWT RS256, 15-minute expiry
- Refresh tokens: 7-day expiry, rotation on each refresh

## Endpoint Naming Conventions

| Pattern | Example |
|---------|---------|
| Plural nouns for resources | `/api/v1/orders` |
| Nested for sub-resources | `/api/v1/restaurants/:id/menu-items` |
| Kebab-case for multi-word | `/api/v1/delivery-zones` |
| Snake_case for query params | `?order_status=pending` |
| CamelCase for JSON fields | `{ "restaurantId": "abc" }` |

## Standard Endpoint Patterns

```
GET    /api/v1/{resource}          → List (paginated)
POST   /api/v1/{resource}          → Create
GET    /api/v1/{resource}/:id      → Read
PATCH  /api/v1/{resource}/:id      → Update
DELETE /api/v1/{resource}/:id      → Delete
```

## Request Validation

- Zod schemas required at every API boundary
- Validation errors return 422 with field-level details
- All inputs validated: body, params, query, headers

## Response Compression

- Brotli compression enabled (quality: 4)
- Compress responses > 1KB
- Skip compression if `x-no-compression` header present

## OpenAPI Spec

- Specification-first approach — write spec before implementation
- All endpoints documented in `docs/api/openapi/`
- OpenAPI 3.0 format (YAML)
- Spec verified in CI against implementation
