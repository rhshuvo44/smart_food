# Release Strategy

## Versioning Scheme

Follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Increment | When | Example |
|-----------|------|---------|
| MAJOR | Breaking API changes, breaking DB schema changes | `2.0.0` → `3.0.0` |
| MINOR | New features, non-breaking additions | `2.0.0` → `2.1.0` |
| PATCH | Bug fixes, performance improvements, non-breaking changes | `2.1.0` → `2.1.1` |

Pre-release identifiers: `2.1.0-alpha.1`, `2.1.0-beta.1`, `2.1.0-rc.1`

## Release Cadence

| Type | Frequency | Lead Time | Approval | Rollout |
|------|-----------|-----------|----------|---------|
| Major | Every 2-3 months | 4 weeks | Architect + PM + CTO | Canary over 1 week |
| Minor | Every 2 weeks (end of sprint) | 1 week | Architect + PM | Rolling over 2 hours |
| Patch | As needed | 24 hours | Architect | Immediate staged |
| Hotfix | Emergency | Immediate | Architect + on-call | Immediate |

## Release Lifecycle

### 1. Preparation (2 days before release)

```yaml
actions:
  - "Freeze develop branch — no new features"
  - "Only bug fixes and documentation updates"
  - "Verify all sprint tickets meet Definition of Done"
  - "Run full regression test suite"
  - "Draft release notes"
```

### 2. Release Branch Creation

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v2.1.0

# Version bump
# Update package.json, app.json (all apps), version.ts
npm version minor

# Push release branch
git push origin release/v2.1.0
```

### 3. Release Stabilization (1-2 days)

```yaml
actions:
  - "CI builds and tests the release branch"
  - "QA executes full regression suite"
  - "Performance benchmarks run"
  - "Security scan completes"
  - "Bug fixes committed directly to release branch"
  - "Bug fixes are cherry-picked back to develop"
```

### 4. Staging Deployment

```bash
# Deploy to staging
# GitHub Actions auto-deploys release/* branches to staging

# Verify health
curl https://staging-api.smartfood.com/health

# Run smoke tests
npm run test:smoke

# Manual QA sanity check
```

### 5. Production Deployment

```bash
# Manual approval in GitHub Actions
# Production deployment triggered after approval

# Rolling update (zero-downtime)
# Database migrations run first
# Then application containers are updated one by one
```

### 6. Post-Release

```yaml
actions:
  - "Git tag: git tag v2.1.0 && git push origin v2.1.0"
  - "GitHub Release created with changelog"
  - "Merge release branch to main"
  - "Merge release branch back to develop"
  - "Delete release branch"
  - "Notify stakeholders"
  - "Monitor for 48 hours"
```

## Changelog Standards

Follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [2.1.0] - 2026-07-27

### Added
- Scheduled ordering for future delivery times (#456)
- Bulk order cancellation for restaurant admin (#455)
- Real-time order tracking with map view (#432)

### Changed
- Upgraded MongoDB driver to 8.4.0
- Optimized order list query with compound index (p95 reduced 40%)

### Fixed
- Payment webhook timeout handling with retry logic (#789)
- Edge case: order cancellation after delivery completed (#790)
- Push notification delivery for iOS background state (#791)

### Security
- Updated JWT signing algorithm from RS256 to ES256
- Added rate limiting to password reset endpoint
```

## Release Checklist

### Pre-Release
- [ ] All sprint tickets meet Definition of Done
- [ ] Release branch created from develop
- [ ] Version bumped in all files
- [ ] CHANGELOG.md updated
- [ ] Database migrations written and tested
- [ ] Full regression suite passes
- [ ] Performance benchmarks within threshold
- [ ] Security scan clean (zero critical/high)
- [ ] Rollback plan documented
- [ ] Release notes drafted

### Release Day
- [ ] Staging deployment successful
- [ ] Smoke tests passed
- [ ] Database migrations run
- [ ] Production deployment successful
- [ ] Health check endpoint returns healthy
- [ ] Error rates normal (first 15 minutes)
- [ ] Feature flags verified
- [ ] Git tag created
- [ ] Release notes published

### Post-Release (48 hours)
- [ ] Error rate monitoring — no regression
- [ ] Response time monitoring — within SLOs
- [ ] No critical incidents
- [ ] Rollback plan archived
- [ ] Post-mortem scheduled (if any incidents)
