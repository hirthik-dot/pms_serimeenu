# Dental Practice Management System — Backend API Specification

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Status:** Official Backend Blueprint  
**Last Updated:** 2026-06-27

> This document is the single source of truth for all backend endpoints, frontend integrations, middleware, services, repositories, and controllers. Every implementation MUST conform to this specification.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Standard Response Format](#2-standard-response-format)
3. [Standard Error Format](#3-standard-error-format)
4. [Pagination Standards](#4-pagination-standards)
5. [Filtering & Sorting Standards](#5-filtering--sorting-standards)
6. [Security Standards](#6-security-standards)
7. [Performance Recommendations](#7-performance-recommendations)
8. [Documentation Standards](#8-documentation-standards)
9. [Permission Matrix](#9-permission-matrix)
10. [Endpoint Catalog](#10-endpoint-catalog)
11. [Authentication](#11-authentication)
12. [User Management](#12-user-management)
13. [Patient Module](#13-patient-module)
14. [Visits](#14-visits)
15. [Consultation](#15-consultation)
16. [Tooth Chart](#16-tooth-chart)
17. [Prescriptions](#17-prescriptions)
18. [Appointments](#18-appointments)
19. [Queue](#19-queue)
20. [X-Rays](#20-x-rays)
21. [Files](#21-files)
22. [Billing](#22-billing)
23. [Payments](#23-payments)
24. [Reports](#24-reports)
25. [Export](#25-export)
26. [Settings](#26-settings)
27. [Audit Logs](#27-audit-logs)
28. [Search](#28-search)
29. [Health & Utility](#29-health--utility)

---

## 1. Overview

### 1.1 Design Principles

| Principle | Rule |
|-----------|------|
| RESTful | Resources are nouns; HTTP verbs express actions |
| Versioning | All routes prefixed with `/api/v1` |
| Consistency | Every endpoint returns `ApiResponse<T>` |
| Idempotency | `PUT`, `PATCH`, `DELETE` use idempotency keys where noted |
| Audit | All mutating operations emit audit log events |
| Validation | Request validated before business logic; response shape validated before send |
| Rate Limiting | Applied per IP and per authenticated user |

### 1.2 HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Read single resource or list |
| `POST` | Create resource or trigger action |
| `PUT` | Full replace of resource |
| `PATCH` | Partial update |
| `DELETE` | Soft delete (default) or hard delete where specified |

### 1.3 Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Conditional | `Bearer <accessToken>` |
| `Content-Type` | POST/PATCH/PUT | `application/json` (default) |
| `X-Idempotency-Key` | Optional | UUID v4 for idempotent writes |
| `X-Request-Id` | Optional | Client trace ID; echoed in audit logs |

### 1.4 Roles

| Role | Code | Description |
|------|------|-------------|
| Admin | `admin` | Full system access |
| Doctor | `doctor` | Clinical and assigned patient access |
| Receptionist | `receptionist` | Front-desk operations |

### 1.5 Domain Enums (Reference)

All enum values MUST match `src/types/enums.ts`. Key enums:

- **UserStatus:** `active`, `inactive`, `suspended`
- **Gender:** `male`, `female`, `other`, `prefer_not_to_say`
- **AppointmentStatus:** `scheduled`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show`
- **VisitStatus:** `waiting_room`, `with_doctor`, `treatment_in_progress`, `completed`, `billing_pending`
- **BillStatus:** `draft`, `finalized`, `partially_paid`, `paid`, `refunded`, `cancelled`
- **PaymentMethod:** `cash`, `card`, `upi`, `bank_transfer`, `cheque`, `other`

---

## 2. Standard Response Format

Every endpoint returns this envelope:

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": {},
  "meta": {},
  "errors": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | `true` on success, `false` on error |
| `message` | string | Yes | User-facing summary |
| `data` | T \| null | Yes | Payload; `null` on error |
| `meta` | object | No | Pagination, timestamps, request metadata |
| `errors` | array | No | Field-level validation errors |

### 2.1 Success Examples

**Single resource (200):**
```json
{
  "success": true,
  "message": "Patient fetched successfully",
  "data": { "id": "665a1b2c3d4e5f6789012345", "patientId": "SMDH-000042" }
}
```

**Created (201):**
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": { "id": "665a1b2c3d4e5f6789012345" }
}
```

**Paginated list (200):**
```json
{
  "success": true,
  "message": "Patients fetched successfully",
  "data": [ { "id": "...", "firstName": "Raj" } ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**No content action (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

---

## 3. Standard Error Format

### 3.1 Error Response Shape

```json
{
  "success": false,
  "message": "Primary error message",
  "data": null,
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 3.2 Error Catalog

| Error Type | HTTP | Message Pattern | `errors` Field |
|------------|------|-----------------|----------------|
| Validation Error | 400 | `Validation failed` | Populated |
| Unauthorized | 401 | `Authentication required` | Empty |
| Forbidden | 403 | `Insufficient permissions` | Empty |
| Not Found | 404 | `{Resource} not found` | Empty |
| Conflict | 409 | `Resource already exists` | Optional |
| Duplicate | 409 | `{Field} already in use` | Optional field ref |
| Business Rule Error | 422 | Specific rule violation | Optional |
| Rate Limit | 429 | `Too many requests` | Empty |
| Server Error | 500 | `An unexpected error occurred` | Empty (prod) |

### 3.3 Error Examples

**Validation (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    { "field": "phone", "message": "Phone must be 10 digits" },
    { "field": "dateOfBirth", "message": "Date of birth cannot be in the future" }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "data": null
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Patient not found",
  "data": null
}
```

**Conflict / Duplicate (409):**
```json
{
  "success": false,
  "message": "Phone number already registered to another patient",
  "data": null,
  "errors": [{ "field": "phone", "message": "Duplicate phone number" }]
}
```

**Business Rule (422):**
```json
{
  "success": false,
  "message": "Cannot complete visit with pending billing items",
  "data": null
}
```

**Rate Limit (429):**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "data": null,
  "meta": { "retryAfter": 60 }
}
```

---

## 4. Pagination Standards

### 4.1 Query Parameters

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `page` | integer | 1 | — | 1-indexed page number |
| `limit` | integer | 20 | 100 | Items per page |

### 4.2 Meta Object

```json
{
  "page": 1,
  "limit": 20,
  "total": 156,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### 4.3 Business Rules

- Invalid `page` (< 1) → default to 1
- Invalid `limit` (< 1 or > 100) → clamp to valid range
- Empty result sets return `data: []` with correct `meta.total: 0`

---

## 5. Filtering & Sorting Standards

### 5.1 Standard Query Parameters

| Param | Type | Applies To | Description |
|-------|------|------------|-------------|
| `sort` | string | Lists | Field name to sort by |
| `order` | `asc` \| `desc` | Lists | Sort direction; default `desc` |
| `search` | string | Lists | Full-text or prefix search |
| `dateFrom` | ISO 8601 date | Date-filtered lists | Inclusive start |
| `dateTo` | ISO 8601 date | Date-filtered lists | Inclusive end |
| `status` | enum | Status-bearing resources | Filter by status |
| `doctorId` | ObjectId | Clinical resources | Filter by doctor |
| `patientId` | ObjectId | Patient-scoped resources | Filter by patient |

### 5.2 Date Range Alias

`dateRange` query param accepted as `dateFrom,dateTo` (comma-separated ISO dates).

### 5.3 Allowed Sort Fields (by module)

| Module | Allowed `sort` values |
|--------|----------------------|
| Patients | `createdAt`, `lastName`, `patientId`, `updatedAt` |
| Appointments | `date`, `startTime`, `createdAt`, `status` |
| Visits | `date`, `visitNumber`, `createdAt`, `status` |
| Bills | `createdAt`, `totalAmount`, `dueDate`, `status` |
| Payments | `createdAt`, `amount` |
| Audit Logs | `createdAt` |

---

## 6. Security Standards

### 6.1 JWT Authentication

| Token | Lifetime | Storage | Payload Claims |
|-------|----------|---------|----------------|
| Access Token | 15 minutes | HTTP-only cookie + optional Bearer header | `sub`, `email`, `role`, `permissions[]`, `tokenVersion` |
| Refresh Token | 7 days | HTTP-only cookie | `sub`, `tokenVersion` |

**Business Rules:**
- Token version incremented on password change → invalidates all sessions
- Refresh token rotation: new refresh token issued on each refresh
- Logout clears both cookies and invalidates refresh token server-side

### 6.2 Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Login | 5 attempts | 15 min per IP |
| Password reset | 3 requests | 1 hour per email |
| General API (authenticated) | 300 requests | 1 min per user |
| General API (unauthenticated) | 60 requests | 1 min per IP |
| File upload | 20 requests | 1 min per user |
| Export | 10 requests | 1 hour per user |

### 6.3 Middleware Chain (Conceptual)

```
Request → Rate Limiter → JWT Verify → Role Check → Permission Check → Ownership Check → Handler
```

### 6.4 Ownership Checks

| Resource | Rule |
|----------|------|
| Visit, Prescription, Tooth Chart | Doctor may access own visits; Admin all |
| Patient | All authenticated staff with `patients:read` |
| Bill, Payment | `billing:*` permission required |
| Settings | `settings:manage` only |
| Audit Logs | `audit:read` only |

### 6.5 Input Sanitization

- Strip HTML from all string inputs except rich-text clinical notes (allowlist tags)
- Normalize phone to E.164 or national 10-digit format
- Trim whitespace; reject null bytes
- Max string lengths enforced per field (see validation rules)
- File uploads: MIME type whitelist, max size 10 MB (images), 25 MB (documents)

### 6.6 Idempotency

Endpoints accepting `X-Idempotency-Key`:
- `POST /payments`
- `POST /bills`
- `POST /appointments`
- `POST /patients`

Duplicate key within 24h returns cached response with `200` or original status.

---

## 7. Performance Recommendations

### 7.1 Caching Strategy

| Data | Strategy | TTL |
|------|----------|-----|
| Clinic settings | In-memory + Redis | 5 min |
| Role/permission map | In-memory | 10 min |
| Medicine catalog | In-memory | 15 min |
| Treatment catalog | In-memory | 15 min |
| Patient list (search) | No cache | — |
| Reports | Cache by query hash | 5 min |

Invalidate cache on corresponding `settings:*`, `medicines:*`, `treatments:*` mutations.

### 7.2 MongoDB Indexes (Required)

| Collection | Index |
|------------|-------|
| users | `{ email: 1 }` unique |
| patients | `{ patientId: 1 }` unique, `{ phone: 1 }`, `{ lastName: 1, firstName: 1 }`, `{ isDeleted: 1 }` |
| appointments | `{ patientId: 1, date: 1 }`, `{ doctorId: 1, date: 1 }`, `{ status: 1, date: 1 }` |
| visits | `{ patientId: 1, visitNumber: 1 }`, `{ doctorId: 1, date: 1 }`, `{ appointmentId: 1 }` |
| bills | `{ billNumber: 1 }` unique, `{ patientId: 1 }`, `{ status: 1 }` |
| payments | `{ billId: 1 }`, `{ patientId: 1 }` |
| audit_logs | `{ createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`, `{ resource: 1, resourceId: 1 }` |
| queue_tokens | `{ doctorId: 1, date: 1, tokenNumber: 1 }` |

### 7.3 Projection & Population

- List endpoints: project only fields needed for table display
- Detail endpoints: populate `doctorId` → `{ firstName, lastName }`, `patientId` → `{ patientId, firstName, lastName, phone }`
- Never populate `passwordHash`, `tokenVersion` in responses

### 7.4 Aggregation Usage

Use aggregation pipelines for:
- Revenue reports (group by date, doctor, payment method)
- Dashboard KPIs
- Outstanding balance summaries
- GST reports

---

## 8. Documentation Standards

Every endpoint entry in this spec includes:

1. **Endpoint** — Full path and method
2. **Purpose** — One-line description
3. **Authentication** — Required or public
4. **Roles Allowed** — Role codes or permission codes
5. **Request** — Body, query, path params with types
6. **Response** — Success shape with example
7. **Validation** — Field rules
8. **Business Rules** — Domain constraints
9. **Errors** — Possible error responses
10. **HTTP Status Codes** — Expected codes
11. **Audit Event** — Action logged

OpenAPI 3.1 export SHOULD be generated from this spec in CI.

---

## 9. Permission Matrix

Permissions use `{resource}:{action}` format.

| Permission | Admin | Doctor | Receptionist |
|------------|-------|--------|--------------|
| `patients:read` | ✓ | ✓ | ✓ |
| `patients:create` | ✓ | ✓ | ✓ |
| `patients:update` | ✓ | ✓ | ✓ |
| `patients:delete` | ✓ | — | — |
| `appointments:*` | ✓ | ✓ | ✓ |
| `visits:*` | ✓ | ✓ | read/create |
| `consultation:*` | ✓ | ✓ | — |
| `prescriptions:*` | ✓ | ✓ | read |
| `tooth-chart:*` | ✓ | ✓ | — |
| `xrays:*` | ✓ | ✓ | read |
| `billing:*` | ✓ | read | ✓ |
| `payments:*` | ✓ | — | ✓ |
| `queue:*` | ✓ | ✓ | ✓ |
| `reports:read` | ✓ | ✓ | — |
| `export:*` | ✓ | — | — |
| `settings:manage` | ✓ | — | — |
| `users:manage` | ✓ | — | — |
| `audit:read` | ✓ | — | — |
| `files:*` | ✓ | ✓ | ✓ |

`*` = all actions (`read`, `create`, `update`, `delete`).

---

## 10. Endpoint Catalog

| # | Method | Endpoint | Module |
|---|--------|----------|--------|
| 1 | GET | `/health` | Utility |
| 2 | POST | `/auth/login` | Auth |
| 3 | POST | `/auth/logout` | Auth |
| 4 | POST | `/auth/refresh` | Auth |
| 5 | GET | `/auth/me` | Auth |
| 6 | POST | `/auth/forgot-password` | Auth |
| 7 | POST | `/auth/reset-password` | Auth |
| 8 | PATCH | `/auth/change-password` | Auth |
| 9 | GET | `/users` | Users |
| 10 | POST | `/users` | Users |
| 11 | GET | `/users/:id` | Users |
| 12 | PATCH | `/users/:id` | Users |
| 13 | DELETE | `/users/:id` | Users |
| 14 | GET | `/doctors` | Users |
| 15 | GET | `/roles` | Users |
| 16 | POST | `/roles` | Users |
| 17 | GET | `/roles/:id` | Users |
| 18 | PATCH | `/roles/:id` | Users |
| 19 | DELETE | `/roles/:id` | Users |
| 20 | GET | `/permissions` | Users |
| 21 | GET | `/profile` | Users |
| 22 | PATCH | `/profile` | Users |
| 23 | POST | `/profile/avatar` | Users |
| 24 | GET | `/patients` | Patients |
| 25 | POST | `/patients` | Patients |
| 26 | GET | `/patients/:id` | Patients |
| 27 | PATCH | `/patients/:id` | Patients |
| 28 | DELETE | `/patients/:id` | Patients |
| 29 | GET | `/patients/search` | Patients |
| 30 | GET | `/patients/:id/timeline` | Patients |
| 31 | GET | `/patients/:id/history` | Patients |
| 32 | GET | `/patients/:id/medical-history` | Patients |
| 33 | PUT | `/patients/:id/medical-history` | Patients |
| 34 | PATCH | `/patients/:id/emergency-contact` | Patients |
| 35 | POST | `/patients/:id/profile-photo` | Patients |
| 36 | DELETE | `/patients/:id/profile-photo` | Patients |
| 37 | GET | `/visits` | Visits |
| 38 | POST | `/visits` | Visits |
| 39 | GET | `/visits/:id` | Visits |
| 40 | POST | `/visits/:id/start` | Visits |
| 41 | PATCH | `/visits/:id/draft` | Visits |
| 42 | POST | `/visits/:id/complete` | Visits |
| 43 | POST | `/visits/:id/cancel` | Visits |
| 44 | GET | `/visits/:id/timeline` | Visits |
| 45 | GET | `/patients/:patientId/visits` | Visits |
| 46 | GET | `/visits/:visitId/consultation` | Consultation |
| 47 | PUT | `/visits/:visitId/consultation/diagnosis` | Consultation |
| 48 | PUT | `/visits/:visitId/consultation/findings` | Consultation |
| 49 | PUT | `/visits/:visitId/consultation/notes` | Consultation |
| 50 | GET | `/visits/:visitId/treatment-plan` | Consultation |
| 51 | POST | `/visits/:visitId/treatment-plan` | Consultation |
| 52 | PATCH | `/visits/:visitId/treatment-plan` | Consultation |
| 53 | PUT | `/visits/:visitId/consultation/advice` | Consultation |
| 54 | PUT | `/visits/:visitId/consultation/follow-up` | Consultation |
| 55 | GET | `/visits/:visitId/tooth-chart` | Tooth Chart |
| 56 | POST | `/visits/:visitId/tooth-chart` | Tooth Chart |
| 57 | PATCH | `/visits/:visitId/tooth-chart/:toothNumber` | Tooth Chart |
| 58 | PATCH | `/visits/:visitId/tooth-chart/bulk` | Tooth Chart |
| 59 | GET | `/patients/:patientId/tooth-chart/history` | Tooth Chart |
| 60 | POST | `/visits/:visitId/tooth-chart/treatment-mapping` | Tooth Chart |
| 61 | GET | `/medicines/search` | Prescriptions |
| 62 | GET | `/visits/:visitId/prescriptions` | Prescriptions |
| 63 | POST | `/visits/:visitId/prescriptions` | Prescriptions |
| 64 | GET | `/prescriptions/:id` | Prescriptions |
| 65 | PATCH | `/prescriptions/:id` | Prescriptions |
| 66 | DELETE | `/prescriptions/:id` | Prescriptions |
| 67 | GET | `/prescriptions/:id/print` | Prescriptions |
| 68 | GET | `/patients/:patientId/prescriptions` | Prescriptions |
| 69 | GET | `/appointments` | Appointments |
| 70 | POST | `/appointments` | Appointments |
| 71 | GET | `/appointments/:id` | Appointments |
| 72 | PATCH | `/appointments/:id` | Appointments |
| 73 | POST | `/appointments/:id/reschedule` | Appointments |
| 74 | POST | `/appointments/:id/cancel` | Appointments |
| 75 | POST | `/appointments/:id/complete` | Appointments |
| 76 | POST | `/appointments/:id/no-show` | Appointments |
| 77 | GET | `/appointments/upcoming` | Appointments |
| 78 | GET | `/appointments/calendar` | Appointments |
| 79 | POST | `/queue/token` | Queue |
| 80 | POST | `/queue/call` | Queue |
| 81 | POST | `/queue/skip` | Queue |
| 82 | POST | `/queue/recall` | Queue |
| 83 | POST | `/queue/complete` | Queue |
| 84 | GET | `/queue/waiting-list` | Queue |
| 85 | POST | `/xrays/upload-url` | X-Rays |
| 86 | POST | `/visits/:visitId/xrays` | X-Rays |
| 87 | GET | `/visits/:visitId/xrays` | X-Rays |
| 88 | GET | `/xrays/:id` | X-Rays |
| 89 | DELETE | `/xrays/:id` | X-Rays |
| 90 | GET | `/xrays/:id/preview` | X-Rays |
| 91 | GET | `/patients/:patientId/xrays` | X-Rays |
| 92 | POST | `/files/upload` | Files |
| 93 | DELETE | `/files/:id` | Files |
| 94 | GET | `/files/:id/preview` | Files |
| 95 | GET | `/files/:id/download` | Files |
| 96 | GET | `/bills` | Billing |
| 97 | POST | `/bills` | Billing |
| 98 | GET | `/bills/:id` | Billing |
| 99 | PATCH | `/bills/:id` | Billing |
| 100 | GET | `/bills/:id/invoice` | Billing |
| 101 | GET | `/bills/outstanding` | Billing |
| 102 | POST | `/payments` | Payments |
| 103 | GET | `/payments` | Payments |
| 104 | GET | `/payments/:id` | Payments |
| 105 | POST | `/payments/split` | Payments |
| 106 | POST | `/payments/:id/refund` | Payments |
| 107 | GET | `/payments/:id/receipt` | Payments |
| 108 | GET | `/patients/:patientId/payments` | Payments |
| 109 | GET | `/reports/revenue` | Reports |
| 110 | GET | `/reports/appointments` | Reports |
| 111 | GET | `/reports/doctors` | Reports |
| 112 | GET | `/reports/patients` | Reports |
| 113 | GET | `/reports/gst` | Reports |
| 114 | GET | `/reports/payments` | Reports |
| 115 | GET | `/reports/treatments` | Reports |
| 116 | POST | `/export/excel` | Export |
| 117 | POST | `/export/csv` | Export |
| 118 | POST | `/export/pdf` | Export |
| 119 | GET | `/settings/clinic` | Settings |
| 120 | PATCH | `/settings/clinic` | Settings |
| 121 | PATCH | `/settings/branding` | Settings |
| 122 | GET | `/settings/doctors` | Settings |
| 123 | GET | `/settings/treatments` | Settings |
| 124 | POST | `/settings/treatments` | Settings |
| 125 | PATCH | `/settings/treatments/:id` | Settings |
| 126 | DELETE | `/settings/treatments/:id` | Settings |
| 127 | GET | `/settings/medicines` | Settings |
| 128 | POST | `/settings/medicines` | Settings |
| 129 | PATCH | `/settings/medicines/:id` | Settings |
| 130 | DELETE | `/settings/medicines/:id` | Settings |
| 131 | GET | `/settings/departments` | Settings |
| 132 | PATCH | `/settings/gst` | Settings |
| 133 | PATCH | `/settings/patient-id-prefix` | Settings |
| 134 | GET | `/audit-logs` | Audit |
| 135 | GET | `/audit-logs/search` | Audit |
| 136 | POST | `/audit-logs/export` | Audit |
| 137 | GET | `/search` | Search |
| 138 | GET | `/search/patients` | Search |
| 139 | GET | `/search/doctors` | Search |
| 140 | GET | `/search/medicines` | Search |
| 141 | GET | `/search/treatments` | Search |
| 142 | GET | `/search/invoices` | Search |

---

## 11. Authentication

### 11.1 POST `/auth/login`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Authenticate user and issue JWT tokens |
| **Auth Required** | No |
| **Roles** | Public |

**Request Body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "SecurePass123!"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `email` | Required, valid email, max 255 |
| `password` | Required, min 1 char |

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "665a1b2c3d4e5f6789012345",
      "firstName": "Anita",
      "lastName": "Sharma",
      "email": "doctor@clinic.com",
      "role": "doctor",
      "permissions": ["patients:read", "visits:create"]
    }
  }
}
```

**Business Rules:**
- Sets HTTP-only `accessToken` (15 min) and `refreshToken` (7 days) cookies
- User must have `status: active`
- Failed login increments attempt counter; lock after 5 failures (15 min)
- Updates `lastLoginAt`

**Errors:** 400 Validation, 401 Invalid credentials, 403 Account suspended, 429 Rate limit

**Audit Event:** `login` — success or failure with IP

---

### 11.2 POST `/auth/logout`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Invalidate session and clear cookies |
| **Auth Required** | Yes |
| **Roles** | All authenticated |

**Request Body:** None

**Response (200):**
```json
{ "success": true, "message": "Logout successful", "data": null }
```

**Business Rules:**
- Clears auth cookies
- Invalidates refresh token
- Increments token version if full logout from all devices requested via `{ "allDevices": true }`

**Audit Event:** `logout`

---

### 11.3 POST `/auth/refresh`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Issue new access token using refresh token |
| **Auth Required** | Refresh token cookie only |
| **Roles** | Public (with valid refresh token) |

**Request Body:** None (refresh token from cookie)

**Response (200):**
```json
{ "success": true, "message": "Token refreshed", "data": null }
```

**Business Rules:**
- Rotates refresh token
- Validates `tokenVersion` matches user record

**Errors:** 401 Invalid/expired refresh token

**Audit Event:** None

---

### 11.4 GET `/auth/me`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Return current authenticated user profile |
| **Auth Required** | Yes |
| **Roles** | All authenticated |

**Response (200):**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "id": "665a1b2c3d4e5f6789012345",
    "firstName": "Anita",
    "lastName": "Sharma",
    "email": "doctor@clinic.com",
    "phone": "9876543210",
    "role": "doctor",
    "permissions": ["patients:read"],
    "avatar": "https://res.cloudinary.com/...",
    "lastLoginAt": "2026-06-27T10:30:00.000Z"
  }
}
```

**Business Rules:**
- Never return `passwordHash` or `tokenVersion`

**Audit Event:** None (read-only session check)

---

### 11.5 POST `/auth/forgot-password`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Send password reset email |
| **Auth Required** | No |
| **Roles** | Public |

**Request Body:**
```json
{ "email": "doctor@clinic.com" }
```

**Response (200):** Always returns success message (prevent email enumeration)
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent",
  "data": null
}
```

**Business Rules:**
- Reset token expires in 1 hour
- Rate limit: 3 per email per hour

**Audit Event:** `update` on user — password reset requested

---

### 11.6 POST `/auth/reset-password`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Reset password using token from email |
| **Auth Required** | No |
| **Roles** | Public |

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `token` | Required |
| `password` | Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special |
| `confirmPassword` | Must match `password` |

**Response (200):**
```json
{ "success": true, "message": "Password reset successfully", "data": null }
```

**Business Rules:**
- Invalidates all existing sessions (increment `tokenVersion`)

**Errors:** 400 Validation, 404 Invalid/expired token

**Audit Event:** `update` — password reset completed

---

### 11.7 PATCH `/auth/change-password`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Change password for authenticated user |
| **Auth Required** | Yes |
| **Roles** | All authenticated |

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Validation:** Same as reset-password plus `currentPassword` required

**Business Rules:**
- Verify `currentPassword` before change
- Increment `tokenVersion`; force re-login

**Errors:** 400 Validation, 401 Wrong current password

**Audit Event:** `update` — password changed

---

## 12. User Management

### 12.1 GET `/users`

| Attribute | Value |
|-----------|-------|
| **Purpose** | List all staff users |
| **Auth Required** | Yes |
| **Permissions** | `users:manage` |

**Query Params:** `page`, `limit`, `sort`, `order`, `search`, `status`, `role`

**Response (200):**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "...",
      "firstName": "Anita",
      "lastName": "Sharma",
      "email": "doctor@clinic.com",
      "phone": "9876543210",
      "role": "doctor",
      "status": "active",
      "createdAt": "2026-01-15T08:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}
```

**Audit Event:** None

---

### 12.2 POST `/users`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Create staff user (doctor, receptionist, admin) |
| **Auth Required** | Yes |
| **Permissions** | `users:manage` |

**Request Body:**
```json
{
  "firstName": "Anita",
  "lastName": "Sharma",
  "email": "doctor@clinic.com",
  "phone": "9876543210",
  "password": "TempPass123!",
  "role": "doctor",
  "roleId": "665a1b2c3d4e5f6789012345"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `firstName`, `lastName` | Required, 1–100 chars |
| `email` | Required, unique, valid email |
| `phone` | Required, 10 digits |
| `password` | Required on create, complexity rules |
| `role` | Enum: `admin`, `doctor`, `receptionist` |
| `roleId` | Valid role ObjectId |

**Response (201):** Created user (no password)

**Business Rules:**
- Email must be unique
- Only Admin can create Admin users
- Default status: `active`

**Errors:** 400, 409 Duplicate email

**Audit Event:** `create` — users

---

### 12.3 GET `/users/:id`

**Purpose:** Get user by ID  
**Permissions:** `users:manage`  
**Response:** Single user object  
**Errors:** 404  
**Audit Event:** None

---

### 12.4 PATCH `/users/:id`

**Purpose:** Update user details (not role escalation without admin)  
**Permissions:** `users:manage`  
**Request:** Partial user fields; `password` excluded (use change-password)  
**Business Rules:** Cannot deactivate self; cannot demote last admin  
**Audit Event:** `update` — users

---

### 12.5 DELETE `/users/:id`

**Purpose:** Soft delete user  
**Permissions:** `users:manage`  
**Business Rules:** Soft delete sets `isDeleted: true`, `status: inactive`; cannot delete self or last admin  
**Response (200):** `{ "success": true, "message": "User deactivated", "data": null }`  
**Audit Event:** `delete` — users

---

### 12.6 GET `/doctors`

| Attribute | Value |
|-----------|-------|
| **Purpose** | List active doctors (for dropdowns, scheduling) |
| **Auth Required** | Yes |
| **Permissions** | Any authenticated |

**Query Params:** `search`, `status` (default `active`)

**Response (200):**
```json
{
  "success": true,
  "message": "Doctors fetched successfully",
  "data": [
    { "id": "...", "firstName": "Anita", "lastName": "Sharma", "email": "doctor@clinic.com" }
  ]
}
```

---

### 12.7 Roles & Permissions

#### GET `/roles` — List roles (`users:manage`)
#### POST `/roles` — Create custom role (`users:manage`)
#### GET `/roles/:id` — Get role with permissions
#### PATCH `/roles/:id` — Update role (cannot modify `isSystem: true` name/permissions core)
#### DELETE `/roles/:id` — Delete non-system role with no assigned users
#### GET `/permissions` — List all available permissions (`users:manage`)

**Role Request Body (create/update):**
```json
{
  "name": "senior_doctor",
  "displayName": "Senior Doctor",
  "description": "Full clinical access",
  "permissions": ["patients:read", "visits:create", "prescriptions:create"]
}
```

**Business Rules:**
- System roles (`admin`, `doctor`, `receptionist`) cannot be deleted
- Permission codes must exist in permissions catalog

---

### 12.8 GET `/profile` & PATCH `/profile`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Get/update own profile |
| **Auth Required** | Yes |
| **Roles** | All authenticated |

**PATCH Request (allowed fields only):**
```json
{
  "firstName": "Anita",
  "lastName": "Sharma",
  "phone": "9876543210"
}
```

**Business Rules:** Cannot change own role, email, or status via profile

---

### 12.9 POST `/profile/avatar`

**Purpose:** Upload profile photo via Cloudinary  
**Content-Type:** `multipart/form-data`  
**Field:** `file` — image/jpeg, image/png, max 5 MB  
**Response:** `{ "avatar": "https://..." }`  
**Audit Event:** `upload`

---

## 13. Patient Module

### 13.1 POST `/patients`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Register new patient |
| **Auth Required** | Yes |
| **Permissions** | `patients:create` |

**Request Body:**
```json
{
  "firstName": "Raj",
  "lastName": "Kumar",
  "dateOfBirth": "1985-03-15",
  "gender": "male",
  "phone": "9876543210",
  "email": "raj@email.com",
  "address": {
    "street": "123 MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "bloodGroup": "O+",
  "maritalStatus": "married",
  "occupation": "Engineer",
  "emergencyContact": {
    "name": "Priya Kumar",
    "relationship": "spouse",
    "phone": "9876543211"
  },
  "allergies": ["Penicillin"],
  "notes": "Anxious patient"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `firstName`, `lastName` | Required, 1–100 chars |
| `dateOfBirth` | Required, valid date, not future, age 0–120 |
| `gender` | Required, enum |
| `phone` | Required, 10 digits, unique among active patients |
| `email` | Optional, valid email |
| `address` | All sub-fields required |
| `emergencyContact` | All sub-fields required |
| `allergies` | Array of strings, max 50 items |

**Response (201):**
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "id": "665a1b2c3d4e5f6789012345",
    "patientId": "SMDH-000042",
    "firstName": "Raj",
    "lastName": "Kumar"
  }
}
```

**Business Rules:**
- Auto-generate `patientId` from clinic prefix + sequence (e.g., SMDH-000042)
- Phone uniqueness enforced among non-deleted patients
- Idempotency key supported

**Audit Event:** `create` — patients

---

### 13.2 GET `/patients`

**Purpose:** Paginated patient list  
**Permissions:** `patients:read`  
**Query:** `page`, `limit`, `sort`, `order`, `search` (name, phone, patientId), `status`  
**Audit Event:** None

---

### 13.3 GET `/patients/search`

**Purpose:** Fast typeahead search  
**Query:** `q` (min 2 chars), `limit` (default 10, max 25)  
**Response:** `[{ id, patientId, firstName, lastName, phone, profileImage }]`

---

### 13.4 GET `/patients/:id`

**Purpose:** Full patient details  
**Permissions:** `patients:read`  
**Business Rules:** Exclude soft-deleted unless admin with `?includeDeleted=true`  
**Errors:** 404

---

### 13.5 PATCH `/patients/:id`

**Purpose:** Update patient  
**Permissions:** `patients:update`  
**Request:** Partial patient fields  
**Business Rules:** Phone uniqueness on change; audit before/after  
**Audit Event:** `update` — patients

---

### 13.6 DELETE `/patients/:id`

**Purpose:** Soft delete patient  
**Permissions:** `patients:delete`  
**Business Rules:**
- Sets `isDeleted: true`, `deletedAt: now`
- Does NOT hard delete; preserves clinical records
- Cannot delete if active visit in progress

**Audit Event:** `delete` — patients

---

### 13.7 GET `/patients/:id/timeline`

**Purpose:** Chronological activity feed  
**Permissions:** `patients:read`  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "visit",
      "id": "...",
      "date": "2026-06-20T10:00:00.000Z",
      "summary": "Consultation — Dr. Sharma",
      "status": "completed"
    },
    {
      "type": "appointment",
      "id": "...",
      "date": "2026-06-25T14:00:00.000Z",
      "summary": "Follow-up scheduled"
    }
  ]
}
```

**Query:** `page`, `limit`, `dateFrom`, `dateTo`, `type` (visit|appointment|bill|prescription)

---

### 13.8 GET `/patients/:id/history`

**Purpose:** Clinical history summary (visits, treatments, diagnoses)  
**Permissions:** `patients:read`

---

### 13.9 GET/PUT `/patients/:id/medical-history`

**GET Purpose:** Current medical history record  
**PUT Purpose:** Create or update medical history (versioned)

**PUT Request:**
```json
{
  "conditions": [
    { "name": "Hypertension", "diagnosedDate": "2020-01-01", "isActive": true }
  ],
  "pastSurgeries": ["Appendectomy 2015"],
  "currentMedications": ["Amlodipine 5mg"],
  "allergies": ["Penicillin"],
  "familyHistory": "Father — diabetes",
  "habits": { "smoking": false, "alcohol": false, "tobacco": false },
  "notes": "Diabetic, monitor blood sugar"
}
```

**Business Rules:** PUT increments `version`; previous version retained for audit

**Audit Event:** `update` — medical_history

---

### 13.10 PATCH `/patients/:id/emergency-contact`

**Request:**
```json
{
  "name": "Priya Kumar",
  "relationship": "spouse",
  "phone": "9876543211"
}
```

---

### 13.11 POST/DELETE `/patients/:id/profile-photo`

**POST:** Multipart upload to Cloudinary; updates `profileImage`  
**DELETE:** Removes photo from Cloudinary and clears field  
**Validation:** JPEG/PNG, max 5 MB  
**Audit Event:** `upload` / `delete`

---

## 14. Visits

### 14.1 POST `/visits`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Create visit (walk-in or from appointment) |
| **Permissions** | `visits:create` |

**Request Body:**
```json
{
  "patientId": "665a1b2c3d4e5f6789012345",
  "doctorId": "665a1b2c3d4e5f6789012346",
  "appointmentId": "665a1b2c3d4e5f6789012347",
  "chiefComplaint": "Tooth pain lower left"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `patientId` | Required, exists, not deleted |
| `doctorId` | Required, active doctor |
| `appointmentId` | Optional, must belong to patient |
| `chiefComplaint` | Required, 1–500 chars |

**Response (201):**
```json
{
  "success": true,
  "message": "Visit created successfully",
  "data": {
    "id": "...",
    "visitNumber": 5,
    "status": "waiting_room",
    "date": "2026-06-27T10:00:00.000Z"
  }
}
```

**Business Rules:**
- Auto-increment `visitNumber` per patient
- If `appointmentId` provided, update appointment status to `checked_in`
- Initial status: `waiting_room`

**Audit Event:** `create` — visits

---

### 14.2 POST `/visits/:id/start`

**Purpose:** Begin consultation (doctor sees patient)  
**Permissions:** `visits:update`  
**Business Rules:**
- Status must be `waiting_room` or `with_doctor`
- Sets status to `with_doctor`
- Records start timestamp

**Audit Event:** `update` — visits (status change)

---

### 14.3 PATCH `/visits/:id/draft`

**Purpose:** Save in-progress consultation draft  
**Permissions:** `consultation:update`  
**Request:** Partial consultation fields (notes, diagnosis, findings)  
**Business Rules:** Only assigned doctor or admin can save

---

### 14.4 POST `/visits/:id/complete`

**Purpose:** Complete clinical portion of visit  
**Permissions:** `visits:update`  
**Business Rules:**
- Requires diagnosis or clinical notes
- Sets status to `billing_pending` if bill not finalized, else `completed`
- Cannot complete if status is `cancelled`

**Errors:** 422 Missing required clinical data

**Audit Event:** `update` — visits

---

### 14.5 POST `/visits/:id/cancel`

**Purpose:** Cancel visit  
**Permissions:** `visits:update`  
**Request:** `{ "reason": "Patient left" }` — reason required  
**Business Rules:** Cannot cancel completed visit with finalized bill

---

### 14.6 GET `/visits/:id/timeline`

**Purpose:** Visit-specific event timeline (status changes, notes saved, prescriptions added)

---

### 14.7 GET `/patients/:patientId/visits`

**Purpose:** Patient visit history  
**Query:** `page`, `limit`, `status`, `dateFrom`, `dateTo`, `doctorId`

---

## 15. Consultation

All consultation endpoints scoped to `/visits/:visitId/consultation/*`.

### 15.1 GET `/visits/:visitId/consultation`

**Purpose:** Get full consultation record  
**Permissions:** `consultation:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "visitId": "...",
    "chiefComplaint": "Tooth pain",
    "clinicalFindings": "Caries on tooth 36 MOD",
    "diagnosis": "Dental caries #36",
    "clinicalNotes": "Patient reports sensitivity...",
    "advice": "Soft diet for 24 hours",
    "followUpDate": "2026-07-04",
    "followUpNotes": "Review filling"
  }
}
```

---

### 15.2 PUT `/visits/:visitId/consultation/diagnosis`

**Request:** `{ "diagnosis": "Dental caries #36" }`  
**Validation:** Required, 1–1000 chars  
**Audit Event:** `update`

---

### 15.3 PUT `/visits/:visitId/consultation/findings`

**Request:** `{ "clinicalFindings": "..." }`  
**Validation:** Max 5000 chars

---

### 15.4 PUT `/visits/:visitId/consultation/notes`

**Request:** `{ "clinicalNotes": "..." }`  
**Validation:** Max 10000 chars; sanitized HTML allowed (limited tags)

---

### 15.5 Treatment Plan

#### GET `/visits/:visitId/treatment-plan`
#### POST `/visits/:visitId/treatment-plan`
#### PATCH `/visits/:visitId/treatment-plan`

**POST Request:**
```json
{
  "name": "Full mouth rehabilitation",
  "description": "Phase 1 — urgent care",
  "treatments": [
    {
      "procedureName": "Composite filling",
      "procedureCode": "D2391",
      "toothNumbers": [36],
      "estimatedCost": 2500,
      "notes": "MOD surface"
    }
  ],
  "validUntil": "2026-12-31"
}
```

**Business Rules:**
- `totalEstimatedCost` auto-calculated
- Status: `proposed` → `accepted` | `rejected` | `completed`

---

### 15.6 PUT `/visits/:visitId/consultation/advice`

**Request:** `{ "advice": "Avoid hard foods" }`

---

### 15.7 PUT `/visits/:visitId/consultation/follow-up`

**Request:**
```json
{
  "followUpDate": "2026-07-04",
  "followUpNotes": "Check healing"
}
```

**Validation:** `followUpDate` must be today or future

---

## 16. Tooth Chart

Uses FDI numbering (1–32 adult, 51–85 pediatric) or configured system.

### 16.1 GET `/visits/:visitId/tooth-chart`

**Response:**
```json
{
  "success": true,
  "data": {
    "visitId": "...",
    "patientId": "...",
    "numberingSystem": "fdi",
    "teeth": [
      {
        "toothNumber": 36,
        "status": "decayed",
        "surfaces": { "occlusal": "decayed", "mesial": "filled" },
        "notes": "Deep caries"
      }
    ]
  }
}
```

---

### 16.2 POST `/visits/:visitId/tooth-chart`

**Purpose:** Initialize tooth chart for visit (copy from previous visit if exists)  
**Request:** `{ "numberingSystem": "fdi" }`

---

### 16.3 PATCH `/visits/:visitId/tooth-chart/:toothNumber`

**Request:**
```json
{
  "status": "filled",
  "surfaces": { "occlusal": "filled" },
  "notes": "Composite restoration"
}
```

**Validation:** `toothNumber` valid for numbering system; `status` enum ToothStatus

---

### 16.4 PATCH `/visits/:visitId/tooth-chart/bulk`

**Purpose:** Update multiple teeth in one request  
**Request:**
```json
{
  "teeth": [
    { "toothNumber": 36, "status": "filled" },
    { "toothNumber": 37, "status": "healthy" }
  ]
}
```

**Business Rules:** Max 32 teeth per request

---

### 16.5 GET `/patients/:patientId/tooth-chart/history`

**Purpose:** Historical tooth chart snapshots across visits  
**Query:** `page`, `limit`, `dateFrom`, `dateTo`

---

### 16.6 POST `/visits/:visitId/tooth-chart/treatment-mapping`

**Purpose:** Link tooth conditions to treatment line items  
**Request:**
```json
{
  "mappings": [
    { "toothNumber": 36, "treatmentId": "...", "surfaces": ["occlusal", "mesial"] }
  ]
}
```

---

## 17. Prescriptions

### 17.1 GET `/medicines/search`

**Query:** `q` (min 2 chars), `limit` (default 20)  
**Permissions:** `prescriptions:read`  
**Response:** `[{ id, name, genericName, defaultDosage, defaultFrequency }]`

---

### 17.2 POST `/visits/:visitId/prescriptions`

**Request:**
```json
{
  "medications": [
    {
      "name": "Amoxicillin 500mg",
      "dosage": "500mg",
      "frequency": "thrice_daily",
      "duration": 5,
      "durationUnit": "days",
      "route": "oral",
      "instructions": "After meals"
    }
  ],
  "generalInstructions": "Complete full course",
  "followUpDate": "2026-07-04"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `medications` | Required, min 1, max 20 items |
| `medications[].name` | Required |
| `medications[].frequency` | Enum MedicationFrequency |
| `medications[].durationUnit` | Enum MedicationDuration |

**Business Rules:**
- Visit must be in progress or billing_pending
- Only assigned doctor can prescribe

**Audit Event:** `create` — prescriptions

---

### 17.3 PATCH `/prescriptions/:id`

**Purpose:** Update prescription before visit completion  
**Business Rules:** Cannot edit after visit `completed` + 24 hours (admin override)

---

### 17.4 DELETE `/prescriptions/:id`

**Purpose:** Soft delete prescription  
**Permissions:** `prescriptions:delete` or prescribing doctor

---

### 17.5 GET `/prescriptions/:id/print`

**Purpose:** Return print-ready prescription data (clinic header, patient info, medications)  
**Response:** Structured JSON for PDF renderer; includes clinic branding from settings

---

### 17.6 GET `/patients/:patientId/prescriptions`

**Purpose:** Prescription history for patient  
**Query:** Standard pagination + date range

---

## 18. Appointments

### 18.1 POST `/appointments`

**Request:**
```json
{
  "patientId": "...",
  "doctorId": "...",
  "date": "2026-07-01",
  "startTime": "10:00",
  "endTime": "10:30",
  "type": "consultation",
  "chiefComplaint": "Routine checkup",
  "notes": "First visit"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `date` | Required, not in past (same-day allowed) |
| `startTime`, `endTime` | HH:mm, end > start |
| `type` | Enum AppointmentType |
| Doctor availability | No overlapping appointments for same doctor |

**Business Rules:**
- Duration defaults from clinic settings if endTime omitted
- Working hours and working days enforced
- Initial status: `scheduled`

**Errors:** 409 Doctor unavailable, 422 Outside working hours

**Audit Event:** `create` — appointments

---

### 18.2 POST `/appointments/:id/reschedule`

**Request:**
```json
{
  "date": "2026-07-02",
  "startTime": "11:00",
  "endTime": "11:30",
  "reason": "Patient request"
}
```

**Business Rules:** Cannot reschedule cancelled/completed appointments

---

### 18.3 POST `/appointments/:id/cancel`

**Request:** `{ "reason": "Patient cancelled" }`  
**Business Rules:** Sets status to `cancelled`; reason required

---

### 18.4 POST `/appointments/:id/complete`

**Business Rules:** Sets status to `completed`; typically called after visit completion

---

### 18.5 POST `/appointments/:id/no-show`

**Business Rules:** Sets status to `no_show`; only for past appointments still `scheduled` or `confirmed`

---

### 18.6 GET `/appointments/upcoming`

**Query:** `days` (default 7), `doctorId`, `patientId`  
**Response:** Appointments sorted by date/time ascending

---

### 18.7 GET `/appointments/calendar`

**Query:** `dateFrom`, `dateTo` (max 31-day range), `doctorId`  
**Response:** Appointments grouped by date for calendar UI

---

## 19. Queue

Daily queue scoped by `doctorId` + `date` (YYYY-MM-DD).

### 19.1 POST `/queue/token`

**Purpose:** Generate queue token for patient  
**Permissions:** `queue:create`

**Request:**
```json
{
  "patientId": "...",
  "doctorId": "...",
  "priority": "normal"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tokenNumber": 12,
    "estimatedWaitTime": 45,
    "status": "waiting_room"
  }
}
```

**Business Rules:**
- Token number resets daily per doctor
- `priority: emergency` inserts at front of queue
- Patient must have active visit or appointment today

**Audit Event:** `create` — queue_tokens

---

### 19.2 POST `/queue/call`

**Request:** `{ "tokenId": "...", "doctorId": "..." }`  
**Purpose:** Call next or specific patient  
**Business Rules:** Updates token and visit status to `with_doctor`

---

### 19.3 POST `/queue/skip`

**Request:** `{ "tokenId": "...", "reason": "..." }`  
**Business Rules:** Moves token to end of queue

---

### 19.4 POST `/queue/recall`

**Request:** `{ "tokenId": "..." }`  
**Purpose:** Re-call skipped patient

---

### 19.5 POST `/queue/complete`

**Request:** `{ "tokenId": "..." }`  
**Business Rules:** Marks queue entry complete; links to visit completion flow

---

### 19.6 GET `/queue/waiting-list`

**Query:** `doctorId` (required), `date` (default today)  
**Response:** Ordered list of tokens with patient name, token number, wait time, status

---

## 20. X-Rays

### 20.1 POST `/xrays/upload-url`

**Purpose:** Get Cloudinary signed upload parameters  
**Permissions:** `xrays:create`

**Request:**
```json
{
  "visitId": "...",
  "type": "periapical",
  "fileName": "xray-36.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://api.cloudinary.com/v1_1/.../upload",
    "publicId": "pms/xrays/...",
    "signature": "...",
    "timestamp": 1719493200,
    "apiKey": "..."
  }
}
```

**Validation:** `contentType` — image/jpeg, image/png, application/dicom (if supported)

---

### 20.2 POST `/visits/:visitId/xrays`

**Purpose:** Register uploaded x-ray metadata after Cloudinary upload  
**Request:**
```json
{
  "type": "periapical",
  "imageUrl": "https://res.cloudinary.com/...",
  "cloudinaryPublicId": "pms/xrays/abc123",
  "toothNumbers": [36],
  "findings": "Periapical radiolucency",
  "notes": "Pre-op"
}
```

**Audit Event:** `create` — xrays

---

### 20.3 GET `/xrays/:id/preview`

**Purpose:** Return secure preview URL (signed, 15 min expiry)

---

### 20.4 DELETE `/xrays/:id`

**Business Rules:** Soft delete; remove from Cloudinary; retain audit record

---

### 20.5 GET `/patients/:patientId/xrays`

**Purpose:** X-ray history across all visits

---

## 21. Files

Generic file attachments (consent forms, referrals, insurance documents).

### 21.1 POST `/files/upload`

**Content-Type:** `multipart/form-data`  
**Fields:** `file`, `patientId`, `visitId` (optional), `category`  
**Validation:** Max 25 MB; allowed MIME: PDF, JPEG, PNG, DOCX  
**Response:** `{ id, fileName, url, mimeType, size }`  
**Audit Event:** `upload`

---

### 21.2 DELETE `/files/:id`

**Permissions:** `files:delete` or uploader within 24h

---

### 21.3 GET `/files/:id/preview` & `/files/:id/download`

**Preview:** Inline display URL (signed)  
**Download:** Content-Disposition attachment with original filename  
**Business Rules:** Access logged in audit for PHI files

---

## 22. Billing

### 22.1 POST `/bills`

**Purpose:** Generate bill for visit  
**Permissions:** `billing:create`

**Request:**
```json
{
  "visitId": "...",
  "lineItems": [
    {
      "treatmentId": "...",
      "description": "Composite filling #36",
      "quantity": 1,
      "unitPrice": 2500,
      "discount": 0
    }
  ],
  "discountPercentage": 0,
  "notes": "GST included",
  "dueDate": "2026-07-15"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "billNumber": "INV-2026-0042",
    "subtotal": 2500,
    "taxRate": 18,
    "taxAmount": 450,
    "totalAmount": 2950,
    "paidAmount": 0,
    "balanceAmount": 2950,
    "status": "draft"
  }
}
```

**Business Rules:**
- Auto-generate `billNumber` from sequence
- GST calculated if `gstEnabled` in clinic settings
- Line item totals: `(quantity * unitPrice) - discount`
- Initial status: `draft`

**Audit Event:** `create` — bills

---

### 22.2 PATCH `/bills/:id`

**Purpose:** Update draft bill  
**Business Rules:** Only `draft` bills editable; finalized bills require admin void + new bill

---

### 22.3 GET `/bills/:id/invoice`

**Purpose:** Print-ready invoice JSON with clinic branding, line items, GST breakdown

---

### 22.4 GET `/bills/outstanding`

**Query:** `patientId`, `dateFrom`, `dateTo`, `page`, `limit`  
**Purpose:** List bills with `balanceAmount > 0`

---

## 23. Payments

### 23.1 POST `/payments`

**Request:**
```json
{
  "billId": "...",
  "amount": 2950,
  "method": "upi",
  "referenceNumber": "UPI123456",
  "notes": "Full payment"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| `amount` | Required, > 0, <= bill balance |
| `method` | Enum PaymentMethod |
| `referenceNumber` | Required for card, upi, bank_transfer |

**Business Rules:**
- Updates bill `paidAmount`, `balanceAmount`, status (`partially_paid` | `paid`)
- Idempotency key supported
- `receivedBy` set from session user

**Audit Event:** `create` — payments

---

### 23.2 POST `/payments/split`

**Purpose:** Split single bill payment across methods  
**Request:**
```json
{
  "billId": "...",
  "payments": [
    { "amount": 1500, "method": "cash" },
    { "amount": 1450, "method": "upi", "referenceNumber": "UPI789" }
  ]
}
```

**Business Rules:** Sum of payments must equal bill balance (or specified partial amount)

---

### 23.3 POST `/payments/:id/refund`

**Permissions:** `billing:update` (admin)  
**Request:** `{ "amount": 500, "reason": "Overpayment" }`  
**Business Rules:**
- Creates refund payment record with negative amount
- Updates bill balance
- Cannot refund more than paid amount

**Audit Event:** `update` — payments

---

### 23.4 GET `/payments/:id/receipt`

**Purpose:** Print-ready receipt JSON

---

## 24. Reports

All report endpoints: **Permissions** `reports:read`  
**Common Query:** `dateFrom`, `dateTo` (required), `doctorId` (optional)

| Endpoint | Purpose | Key Response Fields |
|----------|---------|---------------------|
| `GET /reports/revenue` | Revenue by period | `totalRevenue`, `byDate[]`, `byDoctor[]` |
| `GET /reports/appointments` | Appointment stats | `total`, `byStatus`, `noShowRate` |
| `GET /reports/doctors` | Doctor productivity | `visits`, `revenue`, `patientsSeen` per doctor |
| `GET /reports/patients` | Patient demographics | `newPatients`, `byGender`, `byAgeGroup` |
| `GET /reports/gst` | GST summary | `taxableAmount`, `taxCollected`, `byRate` |
| `GET /reports/payments` | Payment breakdown | `byMethod`, `totalCollected` |
| `GET /reports/treatments` | Treatment analytics | `byCategory`, `topProcedures` |

**Business Rules:**
- Date range max 366 days
- Results cached 5 minutes
- All monetary values in clinic currency

**Audit Event:** `read` — reports (logged for compliance)

---

## 25. Export

**Permissions:** `export:create` (Admin only)

### 25.1 POST `/export/excel` | `/export/csv` | `/export/pdf`

**Request:**
```json
{
  "resource": "patients",
  "format": "excel",
  "filters": {
    "dateFrom": "2026-01-01",
    "dateTo": "2026-06-30",
    "status": "active"
  },
  "columns": ["patientId", "firstName", "lastName", "phone"],
  "fileName": "patients-export"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Export queued",
  "data": {
    "jobId": "...",
    "estimatedCompletion": "2026-06-27T10:05:00.000Z"
  }
}
```

**Supported Resources:** `patients`, `appointments`, `bills`, `payments`, `visits`, `audit_logs`

**Business Rules:**
- Async job for > 1000 rows
- Max export 50,000 rows
- Rate limit: 10/hour per user
- PHI exports require `export:create` and are audit logged

**Audit Event:** `export`

---

## 26. Settings

All settings endpoints require `settings:manage` except read-only doctor/treatment lists for authenticated users.

### 26.1 GET/PATCH `/settings/clinic`

**PATCH Request:**
```json
{
  "clinicName": "Smile Dental Hospital",
  "phone": "02212345678",
  "email": "info@smiledental.com",
  "address": { "street": "...", "city": "...", "state": "...", "pincode": "...", "country": "..." },
  "workingHours": { "start": "09:00", "end": "18:00" },
  "workingDays": [1, 2, 3, 4, 5, 6],
  "appointmentDuration": 30,
  "currency": "INR",
  "currencySymbol": "₹"
}
```

---

### 26.2 PATCH `/settings/branding`

**Request:**
```json
{
  "logo": "https://...",
  "theme": { "primaryColor": "#0066CC", "secondaryColor": "#FFFFFF", "accentColor": "#FF6600" },
  "invoiceHeader": "...",
  "invoiceFooter": "...",
  "prescriptionHeader": "...",
  "prescriptionFooter": "..."
}
```

---

### 26.3 Treatments CRUD — `/settings/treatments`

**POST Request:**
```json
{
  "procedureName": "Composite filling",
  "procedureCode": "D2391",
  "category": "restorative",
  "defaultCost": 2500,
  "duration": 45,
  "isActive": true
}
```

---

### 26.4 Medicines CRUD — `/settings/medicines`

Same shape as `IMedicine` model.

---

### 26.5 GET `/settings/departments`

**Response:** List of clinical departments (configurable master data)

---

### 26.6 PATCH `/settings/gst`

**Request:**
```json
{
  "gstEnabled": true,
  "gstNumber": "27AAAAA0000A1Z5",
  "gstRate": 18
}
```

**Validation:** GST number format validated when enabled

---

### 26.7 PATCH `/settings/patient-id-prefix`

**Request:** `{ "patientIdPrefix": "SMDH" }`  
**Business Rules:** Prefix change does not retroactively update existing patient IDs; affects new IDs only

---

## 27. Audit Logs

### 27.1 GET `/audit-logs`

**Permissions:** `audit:read`  
**Query:** `page`, `limit`, `userId`, `action`, `resource`, `dateFrom`, `dateTo`, `search`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "userEmail": "admin@clinic.com",
      "action": "create",
      "resource": "patients",
      "resourceId": "...",
      "description": "Created patient SMDH-000042",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-06-27T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 500, "totalPages": 25, "hasNextPage": true, "hasPrevPage": false }
}
```

**Business Rules:** Audit logs are append-only; no delete API

---

### 27.2 GET `/audit-logs/search`

**Query:** `q` — searches description, userEmail, resourceId

---

### 27.3 POST `/audit-logs/export`

**Request:** Same filter params as list + `format` (csv|excel)  
**Permissions:** `audit:read` + `export:create`

---

## 28. Search

### 28.1 GET `/search`

**Purpose:** Global search across patients, invoices, appointments  
**Query:** `q` (min 2 chars), `types` (comma-separated: patients,invoices,appointments), `limit` (default 10 per type)

**Response:**
```json
{
  "success": true,
  "data": {
    "patients": [{ "id": "...", "label": "Raj Kumar", "subtitle": "SMDH-000042" }],
    "invoices": [{ "id": "...", "label": "INV-2026-0042", "subtitle": "₹2,950" }],
    "appointments": [{ "id": "...", "label": "Raj Kumar — Jul 1 10:00" }]
  }
}
```

---

### 28.2 Module-Specific Search

| Endpoint | Index | Key Fields |
|----------|-------|------------|
| `GET /search/patients` | patients | name, phone, patientId, email |
| `GET /search/doctors` | users (role=doctor) | name, email |
| `GET /search/medicines` | medicines | name, genericName |
| `GET /search/treatments` | treatments | procedureName, procedureCode |
| `GET /search/invoices` | bills | billNumber, patient name |

---

## 29. Health & Utility

### 29.1 GET `/health`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Service health check |
| **Auth Required** | No |

**Response (200):**
```json
{
  "success": true,
  "message": "Service healthy",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-27T10:00:00.000Z",
    "version": "1.0.0",
    "database": "connected"
  }
}
```

---

## Appendix A: Request/Response Contract Types

### A.1 Address
```typescript
{ street: string; city: string; state: string; pincode: string; country: string; }
```

### A.2 EmergencyContact
```typescript
{ name: string; relationship: string; phone: string; }
```

### A.3 PaginationParams
```typescript
{ page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc'; search?: string; }
```

### A.4 ApiResponse
```typescript
{ success: boolean; message: string; data: T | null; meta?: PaginationMeta; errors?: ValidationError[]; }
```

---

## Appendix B: Audit Event Registry

| Event | Resource | Trigger Endpoints |
|-------|----------|-------------------|
| `login` | auth | POST /auth/login |
| `logout` | auth | POST /auth/logout |
| `create` | * | All POST create endpoints |
| `update` | * | PATCH, PUT endpoints |
| `delete` | * | DELETE endpoints |
| `upload` | files, xrays | Upload endpoints |
| `export` | various | Export endpoints |
| `read` | reports | Report endpoints (compliance) |

Every audit record includes: `userId`, `userEmail`, `action`, `resource`, `resourceId`, `description`, `before`, `after`, `ipAddress`, `userAgent`, `createdAt`.

---

## Appendix C: Implementation Notes

1. **Route path:** Existing routes use `/api/auth/*`; migration to `/api/v1/*` SHOULD be done via rewrite or parallel mount during transition.
2. **Alignment:** Domain models in `src/types/models.ts` and enums in `src/types/enums.ts` are authoritative for field names and enum values.
3. **Response helpers:** Use `successResponse`, `createdResponse`, `paginatedResponse`, `errorResponse` from `src/lib/api-response.ts`.
4. **Error classes:** Use typed errors from `src/lib/errors.ts`.
5. **OpenAPI:** Generate from this spec; validate in CI that all route handlers match catalog entries.

---

*End of API Specification v1.0.0*
