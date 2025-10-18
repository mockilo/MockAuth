# Changelog

All notable changes to MockAuth will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-12-19

### Added
- **🔗 Framework Integrations** - Generate complete projects with popular frameworks
  - React integration with TypeScript, Context API, and modern UI
  - Vue.js integration with Composition API and TypeScript
  - Angular, Next.js, Nuxt.js, Svelte, SvelteKit, Solid.js support
  - Complete project scaffolding with authentication
  - Beautiful UI components with gradients and animations
  - MockAuth configuration and demo users included
  - README files with setup instructions
- Enhanced CLI menu with better navigation
- Improved project generation with full file structure

### Changed
- Updated CLI menu to show all options without pagination
- Enhanced Framework Integration templates with production-ready code

## [Unreleased]

### Added
- Visual Builder for drag-and-drop configuration
- Debug Console with real-time monitoring
- Advanced Commands suite (9 enterprise features)
- Plugin Management system
- Migration tools for production auth providers
- Performance Benchmarking
- Health Check system
- Dynamic port management
- Comprehensive documentation generation

### Changed
- Enhanced CLI with 12+ commands
- Improved developer experience
- Better error handling and debugging
- Optimized performance and memory usage

### Fixed
- Port conflict resolution
- Auto-refresh loop issues
- Authentication flow improvements
- Configuration validation

## [1.1.0] - 2024-11-15

### Added
- **Visual Builder** - Web-based configuration interface
- **Debug Console** - Real-time debugging and monitoring
- **Advanced Commands** - Enterprise-grade features
  - Web Dashboard
  - Deploy to Cloud (AWS, GCP, Azure, Docker)
  - Real-time Monitoring
  - Backup & Restore
  - Configuration Validation
  - Performance Benchmarking
  - Documentation Generation
  - Plugin Management
- **Migration Tools** - Easy transition to production auth providers
  - Better-Auth migration
  - Clerk migration
  - Auth0 migration
  - Firebase migration
  - Supabase migration
- **Plugin Ecosystem** - Extensible architecture
- **Health Check System** - System diagnostics
- **Dynamic Port Management** - Automatic port conflict resolution
- **Performance Monitoring** - Live metrics and dashboards
- **Comprehensive Documentation** - Auto-generated docs

### Enhanced
- **CLI Experience** - 12+ powerful commands
- **Developer Experience** - Visual tools and debugging
- **Error Handling** - Graceful failure management
- **Security Features** - Enhanced RBAC and MFA
- **Framework Integrations** - React, Vue, Angular components
- **Testing Utilities** - Jest, Cypress, Playwright integration

### Fixed
- Port conflicts (EADDRINUSE errors)
- Auto-refresh loops in Visual Builder
- Authentication flow issues
- Configuration validation problems
- Memory leaks and performance issues

### Security
- Enhanced JWT token validation
- Improved password hashing
- Better session management
- Audit logging improvements

## [1.0.0] - 2024-10-01

### Added
- **Core Authentication** - JWT-based authentication system
- **User Management** - Complete user lifecycle
- **Role-Based Access Control (RBAC)** - Hierarchical permissions
- **Multi-Factor Authentication (MFA)** - TOTP and backup codes
- **Single Sign-On (SSO)** - OAuth2, SAML, OpenID Connect
- **Database Support** - PostgreSQL, MySQL, SQLite, In-Memory
- **Security Features** - Rate limiting, account lockout, audit logging
- **Framework Integrations** - React, Vue, Angular components
- **CLI Tools** - Command-line interface
- **Testing Utilities** - Comprehensive test suite
- **TypeScript Support** - Full type definitions
- **Documentation** - Complete API reference

### Features
- JWT Token Management
- User Registration & Login
- Password Reset Flow
- Account Lockout Protection
- Session Management
- Rate Limiting
- Security Headers
- Audit Logging
- Database Integration
- Performance Monitoring
- Hot Reload
- Auto-completion
- Migration Tools

### Supported Providers
- Better-Auth
- Clerk
- Auth0
- Firebase Auth
- Supabase Auth
- AWS Cognito
- Okta

## [0.9.0] - 2024-09-01

### Added
- Initial release
- Basic authentication functionality
- JWT token support
- User management
- Database integration
- CLI interface

### Features
- Core authentication
- User CRUD operations
- JWT token generation
- Basic security features
- Database adapters
- Express.js integration

---

## Migration Guide

### From 1.0.x to 1.1.x

#### Breaking Changes
- None - fully backward compatible

#### New Features
- Visual Builder available at `/builder`
- Debug Console available at `/debug`
- Advanced Commands via CLI
- Plugin Management system
- Migration tools for production providers

#### Upgrade Steps
1. Update to latest version: `npm update mockauth`
2. Rebuild your project: `npm run build`
3. Explore new features: `npx mockauth --help`
4. Try Visual Builder: `npx mockauth builder`
5. Test Debug Console: `npx mockauth debug`

### From 0.9.x to 1.0.x

#### Breaking Changes
- Configuration format updated
- CLI commands restructured
- Database schema changes

#### Migration Steps
1. Backup your configuration
2. Update to 1.0.0: `npm install mockauth@^1.0.0`
3. Run migration: `npx mockauth migrate`
4. Update configuration format
5. Test all functionality

---

## Support

- 📖 [Documentation](https://mockauth.dev/docs)
- 🐛 [Issue Tracker](https://github.com/mockilo/mockilo/issues)
- 💬 [Discussions](https://github.com/mockilo/mockilo/discussions)
- 📧 [Email Support](mailto:support@mockauth.dev)

---

**Made with ❤️ by developers, for developers**