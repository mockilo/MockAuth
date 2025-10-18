# MockAuth API Documentation

## Overview
MockAuth is a developer-first authentication simulator for development, testing, and staging environments.

## Base URL
`http://localhost:3001`

## Authentication
MockAuth uses JWT tokens for authentication. Include the token in the Authorization header:
`Authorization: Bearer <token>`

## Endpoints

### Health Check
- **GET** `/health`
- Returns system health status

### Authentication
- **POST** `/auth/login`
- **POST** `/auth/register`
- **POST** `/auth/refresh`
- **POST** `/auth/logout`

### Users
- **GET** `/users`
- **GET** `/users/:id`
- **POST** `/users`
- **PUT** `/users/:id`
- **DELETE** `/users/:id`

### MFA
- **POST** `/auth/mfa/setup`
- **POST** `/auth/mfa/verify`
- **POST** `/auth/mfa/disable`

### Metrics
- **GET** `/metrics`
- Returns performance metrics

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting
- 100 requests per minute per IP
- 10 login attempts per minute per IP

## Examples

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Get Users
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/users
```
