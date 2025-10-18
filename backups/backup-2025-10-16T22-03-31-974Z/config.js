module.exports = {
  "port": 3001,
  "baseUrl": "http://localhost:3001",
  "jwtSecret": "7f6d1d84855b135bdaf26b4cee18136c77ec1627fcf2996dca445e35c5692ac1",
  "database": {
    "type": "memory"
  },
  "enableMFA": true,
  "enablePasswordReset": true,
  "enableAccountLockout": true,
  "logLevel": "info",
  "enableAuditLog": true,
  "maxLoginAttempts": 5,
  "lockoutDuration": "15m",
  "tokenExpiry": "24h",
  "refreshTokenExpiry": "7d",
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireNumbers": true,
    "requireSpecialChars": false
  },
  "cors": {
    "origin": true,
    "credentials": true,
    "methods": [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],
    "allowedHeaders": [
      "Content-Type",
      "Authorization"
    ]
  },
  "rateLimit": {
    "windowMs": 900000,
    "max": 1000,
    "message": "Too many requests from this IP, please try again later.",
    "standardHeaders": true,
    "legacyHeaders": false
  },
  "ecosystem": {
    "mocktail": {
      "enabled": false
    },
    "schemaghost": {
      "enabled": false
    }
  },
  "users": [
    {
      "email": "user1@example.com",
      "username": "user1",
      "password": "password123",
      "roles": [
        "admin"
      ],
      "permissions": [
        "read:users",
        "write:users"
      ]
    },
    {
      "email": "user2@example.com",
      "username": "user2",
      "password": "password123",
      "roles": [
        "user"
      ],
      "permissions": [
        "read:profile"
      ]
    }
  ]
};