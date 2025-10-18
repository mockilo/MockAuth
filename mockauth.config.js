module.exports = {
  "port": 3001,
  "baseUrl": "http://localhost:3001",
  "jwtSecret": "14df29d82623fc9ae71253b6e372305d4288d178e051721177b8187a1d9109bf",
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
      "enabled": true,
      "outputPath": "./mock-data",
      "seedCount": 100
    },
    "schemaghost": {
      "enabled": true,
      "port": 3002
    }
  },
  "users": [
    {
      "email": "admin@example.com",
      "username": "admin",
      "password": "admin123",
      "roles": [
        "admin"
      ],
      "permissions": [
        "read:users",
        "write:users",
        "delete:users"
      ]
    },
    {
      "email": "user@example.com",
      "username": "user",
      "password": "user123",
      "roles": [
        "user"
      ],
      "permissions": [
        "read:profile"
      ]
    }
  ]
};