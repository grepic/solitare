# Contributing to Solitaire Smash

Thank you for considering contributing to Solitaire Smash! This document outlines the process and guidelines.

## Code of Conduct

- Be respectful and professional
- Provide constructive feedback
- Focus on the problem, not the person
- Welcome newcomers

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has already been requested
2. Create a new issue with:
   - Clear use case
   - Proposed solution
   - Alternatives considered
   - Impact on existing features

### Pull Requests

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting
   - `refactor:` - Code restructuring
   - `test:` - Adding tests
   - `chore:` - Maintenance

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Link related issues
   - Describe your changes
   - Add screenshots for UI changes

## Development Setup

See [README.md](./README.md) for setup instructions.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types
- Use interfaces over types (when possible)
- Use `const` over `let`
- Use arrow functions for callbacks

### Formatting

```bash
# Format code
yarn format

# Lint code
yarn lint
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase (`User`, `AuthResponse`)

### File Structure

```typescript
// 1. Imports (external first, then internal)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 2. Interfaces/Types
interface UserData {
  email: string;
  nickname: string;
}

// 3. Class/Component
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Methods
}

// 4. Exports
export { UserService };
```

## Testing

### Writing Tests

```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    // Setup
  });

  it('should create a user', async () => {
    // Arrange
    const userData = { email: 'test@test.com', nickname: 'Test' };

    // Act
    const user = await service.createUser(userData);

    // Assert
    expect(user.email).toBe(userData.email);
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test
yarn test user.service.spec.ts

# Watch mode
yarn test:watch

# Coverage
yarn test:cov
```

## Documentation

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for architectural changes
- Add JSDoc comments for public APIs
- Update API documentation (if applicable)

## Review Process

1. Automated checks must pass (CI)
2. Code review by maintainer
3. Address feedback
4. Approval and merge

## Questions?

Open an issue or contact the maintainers.

Thank you for contributing! 🎉
