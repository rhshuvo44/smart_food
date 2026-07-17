# Security Checklist

## Authentication & Authorization

### JWT Token Security
- [ ] Access tokens use RS256 or ES256 algorithm
- [ ] Access tokens expire in 15 minutes
- [ ] Refresh tokens expire in 7 days with rotation
- [ ] Tokens include claims: `sub`, `role`, `restaurantId`, `iat`, `exp`
- [ ] Refresh token rotation invalidates previous token
- [ ] Token blacklist on password change or account suspension
- [ ] Secure storage on mobile: `expo-secure-store`
- [ ] HttpOnly, Secure, SameSite=Strict cookies for web

### Password Security
- [ ] Minimum 8 characters with complexity requirements (upper, lower, number, special)
- [ ] Hashed with bcrypt, cost factor 12
- [ ] No plaintext storage or logging
- [ ] Rate limited: 5 attempts per 15 minutes per IP
- [ ] Account lockout after 10 failed attempts

### Authorization
- [ ] Role-based access control (RBAC) implemented
- [ ] Admin-only endpoints check `req.user.role`
- [ ] Permission checks at endpoint level
- [ ] Principle of least privilege applied
- [ ] Service-to-service authentication with short-lived tokens

## Input Validation

### API Boundary
- [ ] All user-facing endpoints validate input with Zod
- [ ] Zod schemas defined for: body, params, query
- [ ] Input sanitization for user-generated content
- [ ] File upload: type, size, content verification
- [ ] No `eval()`, `Function()`, or `setTimeout(string)`

### Database
- [ ] Mongoose schema validation on all models
- [ ] No raw queries — typed Mongoose API only
- [ ] No `$where` operator usage
- [ ] No `mapReduce` usage
- [ ] Parameterized queries prevent injection

## Data Protection

### Encryption at Rest
- [ ] PII fields encrypted with AES-256-GCM
- [ ] Encryption keys via environment variables or KMS
- [ ] Database backups encrypted
- [ ] Secrets rotated every 90 days
- [ ] Immediate rotation on compromise

### Encryption in Transit
- [ ] TLS 1.3 minimum for all API traffic
- [ ] MongoDB connections use TLS with cert verification
- [ ] Internal network traffic encrypted

## API Security

### HTTP Security Headers
- [ ] `helmet` middleware configured
- [ ] HSTS: `max-age=31536000; includeSubDomains`
- [ ] CSP: restrict script sources, no inline scripts
- [ ] X-Content-Type-Options: `nosniff`
- [ ] X-Frame-Options: `DENY`
- [ ] X-Powered-By header removed

### Rate Limiting
- [ ] Global: 100 requests/minute
- [ ] Auth: 5 requests/15 minutes
- [ ] Mutation endpoints: 10 requests/minute per user
- [ ] Rate limit headers returned (RateLimit-*)
- [ ] 429 response with Retry-After header

### CORS
- [ ] Production origins whitelisted
- [ ] No wildcard (`*`) origin in production
- [ ] Credentials: true only when needed
- [ ] Allowed methods restricted to required set

## Infrastructure Security

### Container Security
- [ ] Docker images scanned for vulnerabilities
- [ ] No secrets in Docker images
- [ ] Non-root user in containers
- [ ] Read-only filesystem where possible
- [ ] Resource limits configured

### Network Security
- [ ] Firewall restricts access to necessary ports
- [ ] VPN required for internal tool access
- [ ] Database accessible only from application tier
- [ ] WAF configured in production

## Monitoring & Incident Response

### Logging
- [ ] All auth events logged (login, logout, failed attempts)
- [ ] All data modification events logged
- [ ] Correlation ID on every request
- [ ] No sensitive data in logs (PII, tokens, passwords)
- [ ] Centralized log aggregation

### Alerting
- [ ] Error rate spikes > 1% trigger alert
- [ ] Auth failure rate > 10% triggers alert
- [ ] Suspicious IP patterns trigger alert
- [ ] Database connection failures trigger alert
- [ ] Certificate expiry < 30 days triggers alert

### Incident Response
- [ ] Incident severity levels defined (Critical/High/Medium/Low)
- [ ] Response SLAs defined per severity
- [ ] On-call rotation established
- [ ] Post-mortem process documented
- [ ] Security contacts documented

## Vulnerability Management

### Dependency Scanning
- [ ] `npm audit` runs in CI
- [ ] Dependencies scanned for known vulnerabilities
- [ ] Critical vulnerabilities blocked in CI
- [ ] Dependencies updated within SLA per severity
- [ ] Software Bill of Materials (SBOM) generated

### Security Testing
- [ ] SAST (Static Application Security Testing) in CI
- [ ] Dependency vulnerability scan in CI
- [ ] Secret detection scan in CI
- [ ] Container image scan in CI
- [ ] Quarterly penetration testing

## Compliance

### GDPR
- [ ] Right to erasure: DELETE /api/v1/account
- [ ] Data portability: GET /api/v1/account/export
- [ ] PII encryption at rest
- [ ] Data retention policies documented
- [ ] Consent management for marketing communications

### Data Retention
- [ ] Active data in MongoDB
- [ ] Archived data in cold storage after 90 days inactivity
- [ ] Audit logs retained for 1 year
- [ ] Payment data retained per PCI requirements
- [ ] User data deleted on account erasure within 30 days
