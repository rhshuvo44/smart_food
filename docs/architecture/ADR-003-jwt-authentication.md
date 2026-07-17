---
title: "ADR-003: JWT Authentication Strategy"
status: accepted
date: 2026-07-13
deciders: Principal AI Architect, Security Engineer, Backend Lead
tags: [security, authentication, jwt, authorization]
---

# ADR-003: JWT Authentication Strategy

## Context

SmartFood serves three types of users — customers, restaurant staff, and administrators — across three mobile applications and a backend API. The authentication system must:

- Support three distinct user roles with different permission levels
- Work across mobile (React Native) and potential future web clients
- Be stateless (no server-side sessions) for horizontal scaling
- Support social login (Google OAuth, Apple Sign-In) for customer convenience
- Provide secure token rotation and revocation
- Meet enterprise security standards (OWASP ASVS Level 2)

## Decision

We will use a **JWT-based authentication system with RS256 asymmetric signing**, dual-token pattern (access + refresh), and role-based access control (RBAC).

### Token Architecture

```
Access Token (JWT RS256)
  - Expiry: 15 minutes
  - Storage: In-memory (mobile)
  - Claims: sub, role, restaurantId?, iat, exp, jti

Refresh Token (JWT RS256)
  - Expiry: 7 days
  - Storage: expo-secure-store (mobile)
  - Rotation: Each refresh invalidates previous token
  - Revocable: Server-side blocklist in MongoDB (TTL index)
```

### Authentication Flows

| User Type | Primary Auth | Secondary |
|-----------|-------------|-----------|
| Customer | Email/Password + Phone OTP | Google OAuth, Apple Sign-In |
| Restaurant | Email + Password + Invite Code | — |
| Admin | Email + Password + Admin SSO | TOTP 2FA required |

### Authorization Model

Roles (hierarchical):
```
CUSTOMER < RESTAURANT_STAFF < RESTAURANT_ADMIN < ADMIN < SUPER_ADMIN
```

Each role has a set of permissions (not hardcoded per-role, but assigned via permission matrix):
```
PERMISSIONS = {
  order: { read, create, update, cancel },
  restaurant: { read, update, manage_menu, manage_staff },
  user: { read, create, ban },
  payment: { read, refund },
  analytics: { read },
  system: { configure, audit }
}
```

### Password Policy

- Algorithm: bcrypt with cost factor 12
- Minimum length: 8 characters
- Complexity: uppercase, lowercase, number, special character
- Account lockout: 5 failed attempts → 15-minute lockout
- Rate limiting: 5 login attempts per IP per 15 minutes

## Alternatives Considered

### Alternative 1: Session-based auth (express-session + Redis/MongoDB store)
- **Pros**: Server-side revocation, simpler token management, no token size concerns
- **Cons**: Stateful — requires shared session store for horizontal scaling, more DB load on every request, mobile apps handle tokens poorly (cookie management is complex)
- **Rejected because**: The stateless nature of JWTs is better suited for mobile apps and horizontal scaling. Session stores introduce a single point of failure and require Redis (which contradicts our "no Redis" constraint for non-caching use cases).

### Alternative 2: OAuth 2.0 / OIDC with external provider (Auth0, Firebase Auth)
- **Pros**: No auth code to maintain, built-in social login, enterprise compliance, MFA support
- **Cons**: Vendor lock-in, cost scales with user count, dependency on third-party uptime, limited customization for restaurant/admin auth flows
- **Rejected because**: As an enterprise platform, we need full control over the authentication flow for restaurant and admin users. Vendor costs at 100K+ users would be significant. We can still integrate social login as an OAuth extension without delegating all auth.

## Consequences

### Positive
- Stateless authentication — any instance can verify any token (using public key)
- RS256 ensures tokens are signed by a private key that never leaves the auth service
- Dual-token pattern provides security (short-lived access tokens) with usability (refresh tokens)
- Token rotation limits the damage of compromised refresh tokens
- RBAC is simple to implement and audit
- Standard JWT libraries are mature and well-vetted

### Negative
- Token revocation is not built-in — requires a blocklist checked on every request
- JWT size can grow with claims (keep claims minimal — sub, role, iat, exp only)
- Refresh token storage is critical — must use expo-secure-store (mobile)
- Clock skew must be handled (allow 30-second tolerance)
- Key rotation requires coordination (grace period for old keys)

### Mitigations
- Blocklist with TTL index in MongoDB for revoked tokens (auto-cleanup)
- Key rotation: generate new key pair before old one expires, keep both valid during rotation window
- Access tokens contain minimal claims — user data fetched from service layer
- Clock skew tolerance of 30 seconds in JWT verification
- Rate limiting on auth endpoints (5 attempts/15min per IP + per user)

## Trade-offs

| Concern | JWT (RS256) | Session-based | OAuth Provider |
|---------|------------|---------------|----------------|
| Stateless | ✅ Yes | ❌ No | ✅ Yes |
| Mobile-friendly | ✅ Yes | ❌ Cookie issues | ✅ Yes |
| Self-managed | ✅ Full control | ✅ Full control | ❌ Vendor-dependent |
| Token revocation | ⚠️ Blocklist needed | ✅ Instant | ✅ Instant |
| Social login | ⚠️ Manual integration | ⚠️ Manual integration | ✅ Built-in |
| Enterprise cost | Low (self-hosted) | Low (self-hosted) | High (per-user pricing) |

## Migration Path

If authentication becomes a bottleneck or security requirements exceed in-house capability:
1. Implement OAuth 2.0 proxy layer (e.g., Ory Hydra or Keycloak) in front of our JWT service
2. Migrate user data and refresh tokens to the external provider
3. Keep our custom restaurant/admin auth flows as OAuth extensions
4. Replace JWT verification with the provider's introspection endpoint
