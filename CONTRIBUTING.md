# Contributing to MockAuth

Thank you for your interest in contributing to MockAuth! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mockauth.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/mockauth/mockauth.git
cd mockauth

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run docs:build` - Build API documentation
- `npm run docs:serve` - Serve documentation locally

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Fix issues and improve stability
- **Features**: Add new functionality
- **Documentation**: Improve docs and examples
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Examples**: Add integration examples

### Before You Start

1. Check existing issues and pull requests
2. Discuss major changes in an issue first
3. Ensure your changes align with the project goals
4. Follow the coding standards

## Pull Request Process

### 1. Prepare Your Changes

- Make sure your code follows the coding standards
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Run linting and formatting

### 2. Create a Pull Request

- Use a clear, descriptive title
- Provide a detailed description
- Reference any related issues
- Include screenshots for UI changes
- Add test instructions if applicable

### 3. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)

## Related Issues
Fixes #(issue number)
```

### 4. Review Process

- Maintainers will review your PR
- Address any feedback promptly
- Keep your branch up to date
- Respond to review comments

## Issue Reporting

### Before Creating an Issue

1. Search existing issues
2. Check if it's already fixed in the latest version
3. Gather relevant information

### Issue Template

```markdown
## Bug Report / Feature Request

### Description
Clear description of the issue or feature request

### Steps to Reproduce (for bugs)
1. Step one
2. Step two
3. Step three

### Expected Behavior
What you expected to happen

### Actual Behavior
What actually happened

### Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Node.js version: [e.g., 16.14.0]
- MockAuth version: [e.g., 1.0.0]

### Additional Context
Any other relevant information
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing type definitions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Follow ESLint configuration
- Use Prettier for formatting

### File Organization

```
src/
├── types/           # Type definitions
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── index.ts         # Main entry point
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IUser`)

## Testing

### Test Structure

```
tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
├── e2e/            # End-to-end tests
└── fixtures/       # Test data
```

### Writing Tests

- Write tests for all new functionality
- Aim for high test coverage (>80%)
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

### Test Example

```typescript
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      await userService.createUser(userData);
      
      await expect(userService.createUser(userData))
        .rejects.toThrow('User with this email already exists');
    });
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include parameter types and return types
- Provide usage examples
- Document any side effects

### README Updates

- Update README for new features
- Add new examples
- Update installation instructions
- Keep the feature list current

### API Documentation

- Update API reference for new endpoints
- Include request/response examples
- Document error codes and messages
- Add integration examples

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Release notes prepared
- [ ] Tag created

## Community

### Getting Help

- GitHub Discussions for questions
- GitHub Issues for bugs and features
- Discord community for real-time chat
- Stack Overflow with `mockauth` tag

### Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community highlights

## License

By contributing to MockAuth, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MockAuth! Your contributions help make authentication testing easier for developers worldwide.
