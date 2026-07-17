# Performance Checklist

## API Performance

### Response Time Budgets

| Percentile | Target | Alert Threshold |
|------------|--------|----------------|
| p50 | < 100ms | > 150ms |
| p95 | < 300ms | > 500ms |
| p99 | < 1000ms | > 2000ms |

### Checklist
- [ ] Response compression enabled (Brotli, threshold 1KB)
- [ ] Connection pooling configured (pool size = CPU × 2 + 1)
- [ ] No blocking operations in request handlers
- [ ] Async/await for all I/O operations
- [ ] CPU-intensive tasks offloaded to worker threads
- [ ] Response size minimized (projections, not full documents)
- [ ] Caching headers set for static/slow-changing data
- [ ] Idempotency caching for duplicate requests

## Database Performance

### Query Budgets

| Operation | Target | Alert Threshold |
|-----------|--------|----------------|
| Simple read | < 10ms | > 50ms |
| Complex read | < 100ms | > 200ms |
| Write operation | < 50ms | > 100ms |
| Aggregation | < 500ms | > 1000ms |

### Checklist
- [ ] All queries use `.lean()` for read operations
- [ ] Every query pattern has a supporting index
- [ ] Indexes verified with `explain('executionStats')`
- [ ] No COLLSCAN in query plans
- [ ] Compound indexes for frequent query patterns
- [ ] Projection limits fields returned
- [ ] Pagination for all list endpoints (cursor-based)
- [ ] No N+1 query patterns
- [ ] Batch operations (bulkWrite) over loops
- [ ] $lookup uses indexed foreign fields
- [ ] Aggregation pipelines start with $match
- [ ] Partial indexes for filtered queries (isDeleted: false)

### Index Management
- [ ] Maximum 5 indexes per collection
- [ ] Total index size < 50% of data size
- [ ] Covered queries preferred over in-memory sorts
- [ ] TTL indexes for expiring data (OTP, sessions, logs)
- [ ] Text indexes limited to 1 per collection
- [ ] Index usage monitored (unused indexes identified)

## Mobile Performance

### Startup Budgets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Cold start | < 2s | > 3s |
| Warm start | < 1s | > 1.5s |
| Bundle size (JS) | < 2MB | > 2.5MB |

### Rendering Budgets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Initial screen render | < 500ms | > 1000ms |
| Subsequent navigation | < 300ms | > 500ms |
| Scroll FPS | 60fps | < 30fps |

### Network Budgets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API response display | < 200ms from receipt | > 500ms |
| Image load (menu) | < 1s | > 3s |
| Offline cached data | < 100ms | > 500ms |

### Checklist
- [ ] FlatList with `getItemLayout`, `windowSize`, `maxToRenderPerBatch`
- [ ] `React.memo` on all list items
- [ ] `useCallback` for event handlers passed to children
- [ ] `useMemo` for expensive computations
- [ ] Images: `expo-image` with blurhash, max 2048px, WebP, CDN
- [ ] Lazy loading with `Suspense` for heavy screens
- [ ] Debounce search (300ms), throttle scroll (100ms)
- [ ] Hermes engine enabled (Android)
- [ ] No inline styles — NativeWind classes preferred
- [ ] Tree-shaking enabled — prune unused imports
- [ ] Dynamic imports for heavy dependencies

## Memory Management

### Budgets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Heap usage | < 512MB per instance | > 700MB |
| Heap limit | < 1GB per instance | > 900MB |
| Memory leak check | Every deployment | - |

### Checklist
- [ ] No unbounded array growth
- [ ] Stream large datasets (no loading entire collection into memory)
- [ ] `batchSize` for cursors
- [ ] No closures holding large object references
- [ ] Event listeners cleaned up (removeListener)
- [ ] Interval/timeout cleanup in component unmount
- [ ] removeClippedSubviews on FlatList
- [ ] Image cache limits configured

## Error Rate Budgets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API error rate | < 0.1% | > 0.5% |
| Database error rate | < 0.01% | > 0.1% |
| External API error rate | < 1% | > 3% |

## Monitoring & Observability

### Checklist
- [ ] API response time metrics (p50, p95, p99)
- [ ] Database query performance metrics
- [ ] Error rate tracking by endpoint
- [ ] Memory and CPU monitoring
- [ ] External API latency and error tracking
- [ ] Mobile app crash reporting
- [ ] Mobile app startup time tracking
- [ ] Custom dashboards for key metrics
- [ ] Alerts configured for threshold breaches
- [ ] Weekly performance review meetings
