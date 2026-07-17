# Security Checklist

## Authentication

- [ ] JWT access tokens: 15-minute expiry, RS256 algorithm
- [ ] JWT claims include: `sub`, `role`, `restaurantId`, `iat`, `exp`
- [ ] Refresh tokens: 7-day expiry, stored in `expo-secure-store` (mobile)
- [ ] Token rotation: each refresh invalidates previous refresh token
- [ ] Tokens blacklisted immediately on password change / account suspension
- [ ] Password hashing: bcrypt with cost factor 12
- [ ] Password complexity: min 8 chars, upper + lower + number + special
- [ ] Rate limiting: 5 login attempts per 15 min per IP

## Authorization

- [ ] Role-based access control on all endpoints
- [ ] Admin endpoints restricted to `admin` role
- [ ] Horizontal access control — users can't access other users' data
- [ ] No privilege escalation paths
- [ ] Service-to-service communication uses short-lived tokens

## Input Validation

- [ ] Zod schemas at every API boundary
- [ ] Mongoose schema validation as secondary defense
- [ ] File upload validation: type, size, content verification
- [ ] No `eval()`, `Function()`, or `setTimeout(string)` anywhere
- [ ] No MongoDB `$where` or `mapReduce`

## Data Protection

- [ ] PII fields encrypted at rest (AES-256-GCM)
- [ ] All API traffic over TLS 1.3 minimum
- [ ] MongoDB connections use TLS with certificate verification
- [ ] Database backups encrypted
- [ ] `.env` files never committed to version control
- [ ] Secrets rotated every 90 days

## API Security

- [ ] Rate limiting configured (100 req/min global, 5/15min auth)
- [ ] CORS whitelist — no wildcards in production
- [ ] Helmet.js configured (HSTS, CSP, X-Frame-Options)
- [ ] Body size limit: 1MB JSON, 10MB multipart
- [ ] No sensitive data in error responses (stack traces disabled)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Powered-By` header removed
- [ ] Correlation ID in all responses

## Network Security

- [ ] Internal network traffic encrypted
- [ ] MongoDB authentication enabled
- [ ] Database user least privilege: read-only for reporting, read-write for app
- [ ] Database admin user only for migrations

## Dependency Security

- [ ] All dependencies pinned to exact versions
- [ ] `npm audit` run in CI — zero critical/high vulnerabilities
- [ ] Dependencies reviewed before addition (maintenance, security, license)
- [ ] Snyk or Dependabot configured for automated scanning

## Mobile Security

- [ ] Secure storage for tokens (`expo-secure-store`)
- [ ] Certificate pinning for API calls in production builds
- [ ] Deep link validation — only registered schemes allowed
- [ ] Biometric authentication fallback to PIN/password
- [ ] No sensitive data in app crash logs

## Compliance

- [ ] GDPR right to erasure: `DELETE /api/v1/account` cascades deletion
- [ ] Data portability: `GET /api/v1/account/export` returns all user data
- [ ] Audit logs for data access and modification events
- [ ] Data retention policy documented
- [ ] PII inventory maintained and reviewed quarterly

## CI/CD Security

- [ ] SAST scan runs on every PR
- [ ] Dependency vulnerability scan in CI
- [ ] Secret detection scan in CI (pre-commit + CI)
- [ ] Docker image scan for vulnerabilities
- [ ] No secrets stored in CI variables — use vault or secrets manager

## Incident Response

- [ ] On-call rotation defined
- [ ] Escalation path documented
- [ ] Security incident response runbook exists
- [ ] Post-mortem template defined
- [ ] Security contacts current

## Regular Audits

- [ ] Quarterly security review
- [ ] Annual penetration test
- [ ] Monthly dependency audit
- [ ] Weekly secret scan
- [ ] Daily log review for anomalies
