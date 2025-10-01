# MockAuth API Reference

Complete API documentation for MockAuth authentication simulator.

## Base URL

```
http://localhost:3001
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Authentication Endpoints

### POST /auth/login

Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "username": "john_doe",
    "roles": ["user"],
    "permissions": ["read:profile"],
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": "24h"
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newuser",
  "profile": {
    "firstName": "New",
    "lastName": "User"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "user-2",
    "email": "newuser@example.com",
    "username": "newuser",
    "roles": ["user"],
    "permissions": ["read:profile"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout

Logout the current user and invalidate their token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/refresh

Refresh an expired token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### GET /auth/me

Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "username": "john_doe",
    "roles": ["user"],
    "permissions": ["read:profile"],
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### POST /auth/verify

Verify a JWT token and return user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "username": "john_doe",
    "roles": ["user"],
    "permissions": ["read:profile"]
  }
}
```

## User Management Endpoints

### GET /users

Get all users (requires admin role).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of users per page
- `role` (optional): Filter by role
- `search` (optional): Search by email or username

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-1",
      "email": "user@example.com",
      "username": "john_doe",
      "roles": ["user"],
      "permissions": ["read:profile"],
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLoginAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### GET /users/:id

Get a specific user by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "username": "john_doe",
    "roles": ["user"],
    "permissions": ["read:profile"],
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-01T12:00:00Z"
  }
}
```

### POST /users

Create a new user (requires admin role).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "roles": ["user"],
  "permissions": ["read:profile"],
  "profile": {
    "firstName": "New",
    "lastName": "User"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "user-2",
    "email": "newuser@example.com",
    "username": "newuser",
    "roles": ["user"],
    "permissions": ["read:profile"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /users/:id

Update a user (requires admin role or own profile).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "updated_username",
  "profile": {
    "firstName": "Updated",
    "lastName": "Name"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "username": "updated_username",
    "roles": ["user"],
    "permissions": ["read:profile"],
    "profile": {
      "firstName": "Updated",
      "lastName": "Name"
    }
  }
}
```

### DELETE /users/:id

Delete a user (requires admin role).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Role Management Endpoints

### GET /roles

Get all available roles.

**Response (200):**
```json
{
  "success": true,
  "roles": [
    {
      "name": "admin",
      "description": "Administrator with full access",
      "permissions": ["read:users", "write:users", "delete:users"]
    },
    {
      "name": "user",
      "description": "Regular user",
      "permissions": ["read:profile"]
    }
  ]
}
```

### POST /roles

Create a new role (requires admin role).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "moderator",
  "description": "Content moderator",
  "permissions": ["read:users", "write:content"]
}
```

**Response (201):**
```json
{
  "success": true,
  "role": {
    "name": "moderator",
    "description": "Content moderator",
    "permissions": ["read:users", "write:content"]
  }
}
```

## Permission Management Endpoints

### GET /permissions

Get all available permissions.

**Response (200):**
```json
{
  "success": true,
  "permissions": [
    "read:users",
    "write:users",
    "delete:users",
    "read:profile",
    "write:profile"
  ]
}
```

## Session Management Endpoints

### GET /sessions

Get active sessions for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-1",
      "device": "Chrome on Windows",
      "ipAddress": "192.168.1.100",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastActivityAt": "2024-01-01T12:00:00Z",
      "isCurrent": true
    }
  ]
}
```

### DELETE /sessions/:id

Revoke a specific session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many login attempts. Account locked for 15 minutes"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

MockAuth implements rate limiting to prevent abuse:

- **Login attempts**: 5 attempts per 15 minutes per IP
- **API calls**: 1000 requests per hour per user
- **Registration**: 10 registrations per hour per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

MockAuth can send webhooks for important events:

### Webhook Events

- `user.created` - New user registered
- `user.updated` - User profile updated
- `user.deleted` - User account deleted
- `user.login` - User logged in
- `user.logout` - User logged out
- `session.created` - New session created
- `session.revoked` - Session revoked

### Webhook Configuration

```javascript
const auth = new MockAuth({
  webhooks: {
    url: 'https://your-app.com/webhooks/mockauth',
    secret: 'webhook-secret-key',
    events: ['user.created', 'user.login', 'user.logout']
  }
});
```

### Webhook Payload Example

```json
{
  "event": "user.login",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "user": {
      "id": "user-1",
      "email": "user@example.com",
      "username": "john_doe"
    },
    "session": {
      "id": "session-1",
      "device": "Chrome on Windows",
      "ipAddress": "192.168.1.100"
    }
  }
}
```

## Multi-Factor Authentication (MFA) Endpoints

### POST /auth/mfa/setup

Setup MFA for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "secret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    "qrCode": "otpauth://totp/MockAuth:user@example.com?secret=ABCDEFGHIJKLMNOPQRSTUVWXYZ234567&issuer=MockAuth",
    "backupCodes": [
      "ABC12345",
      "DEF67890",
      "GHI11111"
    ]
  }
}
```

### POST /auth/mfa/verify-setup

Verify MFA setup code and enable MFA.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "backupCodes": [
      "ABC12345",
      "DEF67890",
      "GHI11111"
    ]
  }
}
```

### POST /auth/mfa/verify

Verify MFA code during login.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "backupCodes": [
      "ABC12345",
      "DEF67890"
    ]
  }
}
```

### DELETE /auth/mfa/disable

Disable MFA for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

### GET /auth/mfa/status

Get MFA status for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "backupCodesCount": 8,
    "lastUsed": "2024-01-01T12:00:00Z"
  }
}
```

### POST /auth/mfa/backup-codes/regenerate

Regenerate backup codes for MFA.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "backupCodes": [
      "NEW12345",
      "NEW67890",
      "NEW11111"
    ]
  }
}
```
