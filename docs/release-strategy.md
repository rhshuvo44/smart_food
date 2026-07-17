# Release Strategy

## Semantic Versioning

We follow [SemVer 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

| Increment | When | Example |
|-----------|------|---------|
| MAJOR | Breaking API changes, breaking DB schema changes | `v2.0.0 → v3.0.0` |
| MINOR | New features, non-breaking additions | `v2.0.0 → v2.1.0` |
| PATCH | Bug fixes, performance improvements | `v2.0.0 → v2.0.1` |

## Release Cadence

| Type | Frequency | Approval | Rollout |
|------|-----------|----------|---------|
| Major | Every 2–3 months | Architect + PM + CTO | Canary over 1 week |
| Minor | Every 2 weeks (end of sprint) | Architect + PM | Rolling over 2 hours |
| Patch | As needed (hotfix) | Architect | Immediate staged |
| Hotfix | Emergency | Architect (expedited) | Immediate |

## Release Process

### Step 1: Release Preparation (Day 8–9 of Sprint)

- [ ] All features for the release merged to `develop`
- [ ] CI passing on `develop`
- [ ] No outstanding blocking issues
- [ ] Release checklist prepared

### Step 2: Create Release Branch (Day 9)

```bash
git checkout develop
git pull origin develop
git checkout -b release/v2.1.0
```

### Step 3: Version Bump

Update version in:
- `backend/package.json`
- `apps/*/package.json`
- `apps/*/app.json`
- `backend/src/config/version.ts`

```bash
# Example for minor bump
npm version minor --no-git-tag-version
```

### Step 4: Changelog

Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [2.1.0] - 2026-07-27

### Added
- Scheduled ordering feature (SMART-456)
- Bulk order cancellation (SMART-455)

### Fixed
- Payment webhook timeout handling (FIX-123)
- Restaurant menu caching issue (FIX-124)

### Changed
- Upgrade Mongoose to 8.4.0
```

### Step 5: Staging Deployment

```bash
# Deploy release branch to staging
git push origin release/v2.1.0
# CI/CD pipeline deploys to staging automatically
```

### Step 6: Smoke Tests

- Automated smoke test suite runs
- Manual sanity check by QA
- Critical P0 journeys verified
- No regression in core functionality

### Step 7: Production Deployment

```bash
# Merge release to main
git checkout main
git pull origin main
git merge --no-ff release/v2.1.0
git tag v2.1.0
git push origin main --tags

# CI/CD deploys main to production
```

### Step 8: Post-Release

- Monitor error rates for 72 hours
- No regression from baseline
- If issues: rollback within 30 minutes

## Rollback Procedure

### When to Rollback

- Error rate increases > 1% above baseline
- p95 response time > 2x baseline
- Any P0 functionality broken
- Security vulnerability discovered

### Rollback Steps

1. Identify the rollback tag (previous release)
2. Create rollback branch from previous stable tag
3. Run database migration rollback (if applicable)
4. Deploy rollback branch
5. Verify health check
6. Monitor for 15 minutes
7. Notify team

**Target: Complete rollback within 30 minutes.**

## Release Checklist

### Pre-Release (24 hours before)

- [ ] All PRs merged to `develop` have passed CI
- [ ] Release branch cut from `develop`
- [ ] Version bumped in all relevant files
- [ ] CHANGELOG.md updated
- [ ] Database migration scripts tested (up + down)
- [ ] Environment variables configured
- [ ] SSL certificates verified
- [ ] Monitoring dashboards reviewed
- [ ] Security scan — zero critical/high

### Deployment Day

- [ ] Docker images built and pushed
- [ ] Staging smoke tests pass
- [ ] Database migrations run (backup taken)
- [ ] Production deployment (rolling update)
- [ ] Health check returns healthy
- [ ] Error rates monitored (first 15 min)
- [ ] Git tag created
- [ ] Release notes published

### Post-Release (48 hours)

- [ ] Error rate normal
- [ ] Response times within SLOs
- [ ] No slow queries
- [ ] Rollback plan documented
- [ ] Post-mortem scheduled (if incidents)
- [ ] Stakeholders notified
