# API Standards

## Design Principles

1. **RESTful** — Resources, not actions. HTTP verbs map to CRUD operations
2. **Consistent** — Every endpoint follows the same patterns and conventions
3. **Versioned** — URL-prefixed versioning (`/api/v1/`)
4. **Idempotent** — Mutation endpoints support idempotency keys
5. **Self-Descriptive** — Responses include all information needed to understand the result
6. **Secure** — Every endpoint enforces authentication and authorization

## Base URL

```
Development:  http://localhost:3000/api/v1
Staging:      https://staging-api.smartfood.com/api/v1
Production:   https://api.smartfood.com/api/v1
```

## Standard Response Envelope

All API responses use a standardized JSON envelope:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  },
  "correlationId": "corr_abc123def456"
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
      "password": ["Minimum 8 characters required"]
    }
  },
  "correlationId": "corr_abc123def456"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true,
    "nextCursor": "cursor_abc123",
    "prevCursor": "cursor_def456"
  },
  "correlationId": "corr_abc123def456"
}
```

## HTTP Methods and Resource Patterns

| Method | Pattern | Description | Status Codes |
|--------|---------|-------------|-------------|
| `GET` | `/api/v1/orders` | List resources | 200 |
| `GET` | `/api/v1/orders/:id` | Get single resource | 200, 404 |
| `POST` | `/api/v1/orders` | Create resource | 201, 422 |
| `PUT` | `/api/v1/orders/:id` | Full replacement | 200, 404, 409 |
| `PATCH` | `/api/v1/orders/:id` | Partial update | 200, 404, 409, 422 |
| `DELETE` | `/api/v1/orders/:id` | Delete resource | 204, 404 |

## Standard Endpoint Pattern

### Route Definition

```typescript
import { Router } from 'express';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import { createOrderSchema, updateOrderSchema } from '@/validators/order.validator';
import * as orderController from '@/controllers/order.controller';

const router = Router();

router.use(authenticate);

router.get('/', orderController.list);
router.get('/:id', orderController.getById);
router.post('/', validate(createOrderSchema), orderController.create);
router.patch('/:id', validate(updateOrderSchema), orderController.update);
router.delete('/:id', orderController.remove);

export default router;
```

### Controller Pattern

```typescript
import { Request, Response, NextFunction } from 'express';
import { orderService } from '@/domains/orders/order.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = req.body;
    const order = await orderService.createOrder(dto, req.user!.id, req.correlationId);
    res.status(201).json({
      success: true,
      data: order,
      correlationId: req.correlationId,
    });
  } catch (error) {
    next(error);
  }
};
```

## Error Codes

| HTTP Status | Code | Description | When |
|-------------|------|-------------|------|
| 400 | `BAD_REQUEST` | Malformed request | Invalid JSON, missing required headers |
| 401 | `AUTH_ERROR` | Authentication required | Missing/invalid JWT |
| 403 | `FORBIDDEN` | Insufficient permissions | Valid JWT but wrong role |
| 404 | `NOT_FOUND` | Resource not found | Resource ID doesn't exist |
| 409 | `CONFLICT` | Resource conflict | Duplicate, stale version, state conflict |
| 422 | `VALIDATION_ERROR` | Validation failed | Zod validation failure |
| 429 | `RATE_LIMIT` | Too many requests | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected error | Unhandled exception (no details exposed) |

## Validation Standards

### Zod Schema Pattern

```typescript
import { z } from 'zod';

// Create
export const createOrderSchema = z.object({
  restaurantId: z.string().length(24),
  items: z.array(z.object({
    menuItemId: z.string().length(24),
    quantity: z.number().int().min(1).max(99),
    modifiers: z.array(z.string()).max(10).optional(),
  })).min(1).max(50),
  deliveryAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
});

// Update (all fields optional)
export const updateOrderSchema = createOrderSchema.partial();

// Query parameters
export const listOrdersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

### Validation Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.flatten().fieldErrors,
          },
          correlationId: req.correlationId,
        });
      }
      next(error);
    }
  };
};
```

## Pagination Standards

All list endpoints use cursor-based pagination:

```typescript
// Request
GET /api/v1/orders?cursor=abc123&limit=20

// Response
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "limit": 20,
    "total": 156,
    "nextCursor": "def456",
    "hasNextPage": true
  }
}
```

**Rules:**
- Default limit: 20
- Maximum limit: 100
- Cursor is an opaque string (base64-encoded last item ID)
- Page-based pagination allowed only for small, stable datasets

## Rate Limiting

```typescript
// Global limit
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
}));

// Auth endpoints (stricter)
authRouter.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
}));

// Mutation endpoints
orderRouter.use(rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user!.id,
}));
```

## Idempotency

All mutation endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) must support idempotency:

```typescript
// Client sends:
POST /api/v1/orders
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

// First request: processes normally, caches response
// Duplicate request: returns cached response without processing
// Response includes: Idempotency-Key in header
```

**Rules:**
- Idempotency key is a UUID v4
- Cache duration: 24 hours
- Cache key: `idempotency:{key}` stored in MongoDB
- Response includes `X-Idempotency-Key` header
- Idempotency is scoped per user (different users can use same key)
