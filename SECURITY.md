# Security Policy

## Reporting a Vulnerability

We take the security of MockAuth seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: [security@mockauth.dev](mailto:security@mockauth.dev)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity
  - **Critical**: Within 7 days
  - **High**: Within 14 days
  - **Medium**: Within 30 days
  - **Low**: Next release cycle

## Security Best Practices

### For Users

MockAuth is designed as a **development and testing tool**, not for production use. However, if you choose to use it:

#### ✅ DO:
- Use strong, unique JWT secrets
- Enable HTTPS in production
- Implement rate limiting
- Use environment variables for secrets
- Enable audit logging
- Regularly update dependencies

#### ❌ DON'T:
- Use default secrets in production
- Expose MockAuth directly to the internet
- Store sensitive production data
- Use in production without security review
- Ignore vulnerability warnings

### Security Features

MockAuth includes several security features:

- **bcryptjs** password hashing (10 rounds)
- **JWT** token-based authentication
- **Helmet.js** security headers
- **Rate limiting** (configurable)
- **CORS** protection
- **Account lockout** after failed attempts
- **Session management** with expiry
- **Audit logging** for compliance

## Known Limitations

As a mock/development tool, MockAuth has some limitations:

1. **Not Battle-Tested**: Unlike production auth systems (Auth0, Firebase, Better-Auth), MockAuth hasn't been battle-tested at scale
2. **Email/SMS Mocked**: Email and SMS verification are simulated
3. **In-Memory Default**: Default storage is in-memory (use database for persistence)
4. **No Professional Security Audit**: Has not undergone professional security auditing

## Vulnerability Disclosure

### Current Vulnerabilities

Check our [GitHub Security Advisories](https://github.com/mockilo/mockauth/security/advisories) for current vulnerabilities.

### Past Vulnerabilities

None reported to date (as of v1.1.0)

## Security Updates

Subscribe to security updates:
- Watch this repository on GitHub
- Follow [@mockauth](https://twitter.com/mockilo_) on Twitter
- Check CHANGELOG.md for security fixes

## Compliance

MockAuth includes features for compliance with:
- **GDPR** (General Data Protection Regulation)
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **SOX** (Sarbanes-Oxley Act)
- **PCI-DSS** (Payment Card Industry Data Security Standard)

However, using MockAuth does NOT guarantee compliance. Consult with compliance experts for production systems.

## Dependencies

We regularly monitor dependencies for vulnerabilities using:
- `npm audit`
- GitHub Dependabot
- Snyk (planned)

### Dependency Security

Run security audit:
```bash
npm audit
```

Update dependencies:
```bash
npm update
npm audit fix
```

## Secure Configuration Example

```javascript
const { MockAuth } = require('mockauth');

const auth = new MockAuth({
  port: 3001,
  
  // ✅ Use strong, unique secrets
  jwtSecret: process.env.JWT_SECRET, // From environment
  
  // ✅ Enable security features
  enableAccountLockout: true,
  maxLoginAttempts: 5,
  lockoutDuration: '15m',
  
  // ✅ Strong password policy
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // ✅ Strict CORS
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  },
  
  // ✅ Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  
  // ✅ Audit logging
  enableAuditLog: true,
  logLevel: 'info',
});
```

## Contact

For security concerns:
- Email: [security@mockauth.dev](mailto:security@mockauth.dev)
- GitHub: [@mockauth](https://github.com/mockilo/mockauth)

## License

See [LICENSE](LICENSE) for license information.

---

**Last Updated**: 2025-10-14
**Version**: 1.1.0

