# Performance Checklist

## Backend Performance

### API Response Times

- [ ] p50 < 100ms (moving average over 5 min)
- [ ] p95 < 300ms (moving average over 5 min)
- [ ] p99 < 1000ms (moving average over 5 min)
- [ ] No endpoint consistently exceeds p99 budget

### Database Performance

- [ ] All queries use indexes — verified with `explain('executionStats')`
- [ ] No COLLSCAN in any query pattern
- [ ] Simple reads: < 10ms
- [ ] Complex reads: < 100ms
- [ ] Writes: < 50ms
- [ ] Aggregations: < 500ms
- [ ] All queries use `.lean()` for read operations
- [ ] All queries use projections (limit fields returned)
- [ ] Pagination implemented on all list endpoints (cursor-based preferred)
- [ ] No N+1 query patterns
- [ ] At most 1 `$lookup` per aggregation (unless architect-approved)
- [ ] No unindexed sort operations
- [ ] Index utilization reviewed — no unused or missing indexes

### Memory & CPU

- [ ] Heap usage < 512MB per instance
- [ ] Heap limit < 1GB per instance
- [ ] No memory leaks detected
- [ ] CPU usage < 70% under normal load
- [ ] Connection pool size: CPU cores × 2 + 1

### Response Optimization

- [ ] Brotli compression enabled (quality: 4)
- [ ] Compress responses > 1KB
- [ ] Cache headers set on appropriate responses
- [ ] Response payload size minimized — no unnecessary fields

### External Calls

- [ ] Circuit breakers on all external API calls
- [ ] Timeouts configured (default: 5s, payment: 30s)
- [ ] Retry with exponential backoff (max 3 retries)
- [ ] Fallback responses for degraded mode

## Mobile Performance

### Startup Time

- [ ] Cold start: < 2 seconds
- [ ] Warm start: < 1 second
- [ ] Bundle size: < 2MB
- [ ] Lazy loaded screens — no eager loading of unused screens

### Rendering

- [ ] Initial render: < 500ms
- [ ] Subsequent navigation: < 300ms
- [ ] Scroll FPS: 60fps (no jank)
- [ ] FlatList for all lists > 10 items (never ScrollView for dynamic data)
- [ ] FlatList configured with: `getItemLayout`, `windowSize`, `maxToRenderPerBatch`
- [ ] `React.memo` on all list item components
- [ ] `useCallback` for event handlers passed to child components
- [ ] `useMemo` for expensive computations
- [ ] No anonymous functions in render props
- [ ] No inline styles — NativeWind classes preferred

### Network

- [ ] API response to display: < 200ms
- [ ] Image load: < 1 second
- [ ] Offline cached data: < 100ms to display
- [ ] Debounce search inputs (300ms)
- [ ] Throttle scroll events (100ms)
- [ ] Pre-fetch critical data on app launch

### Image Optimization

- [ ] `expo-image` used for all images (with blurhash)
- [ ] Maximum image resolution: 2048px
- [ ] WebP format used where supported
- [ ] All images CDN-hosted
- [ ] Responsive image sizes per device

## MongoDB Performance

### Indexing

- [ ] All foreign key fields indexed
- [ ] Compound indexes for common query patterns (equality → sort → range)
- [ ] Partial indexes for filtered queries
- [ ] TTL indexes for expiring data
- [ ] Maximum 5 indexes per collection
- [ ] Total index size < 50% of data size

### Query Patterns

- [ ] `$match` first in all aggregation pipelines
- [ ] `$lookup` has indexes on the foreign field
- [ ] No `$regex` with leading wildcards
- [ ] Text search uses text indexes (not `$regex`)
- [ ] `$group` with `allowDiskUse: true` for large datasets
- [ ] Covered queries preferred over in-memory sorts
- [ ] No unbounded queries — always limit or paginate

### Write Performance

- [ ] `bulkWrite` for batch operations (not loops of `save()`)
- [ ] Write concern: `majority` for critical data, `acknowledged` for logs
- [ ] Optimistic locking with version field
- [ ] `findOneAndUpdate` preferred over `find` + `save`

## Performance Review Process

### Pre-Merge

- [ ] New queries verified with `explain()`
- [ ] Performance impact assessed — no regression > 10%
- [ ] No N+1 query patterns
- [ ] New indexes created for new query patterns
- [ ] No blocking operations in request handlers

### Pre-Release

- [ ] Load test results meet SLOs
- [ ] All query patterns verified with `explain()`
- [ ] Index utilization reviewed
- [ ] Mobile bundle size < 2MB
- [ ] Mobile startup time < 2s
- [ ] All images optimized

### Post-Release

- [ ] Error rates within normal range (48h)
- [ ] Response times within SLOs (48h)
- [ ] No new slow queries (48h)
- [ ] Memory — no leaks detected (1 week)
- [ ] Performance benchmark report generated
