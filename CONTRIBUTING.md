# Contributing to OpenCrisis

Thank you for your interest in contributing to OpenCrisis! This document provides guidelines for contributing.

## Development Setup

### Prerequisites

- Node.js 18+
- MongoDB 7+ (or use Docker)
- npm 9+

### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/UnneededHere/opencrisis.git
   cd opencrisis
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Start MongoDB** (choose one):

   ```bash
   # With Docker
   docker-compose up mongodb -d
   
   # Or use local MongoDB
   mongod
   ```

5. **Build shared package**

   ```bash
   npm run build -w shared
   ```

6. **Run development servers**

   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions/fixes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add directive status filtering
fix: resolve socket reconnection issue
docs: update API documentation
test: add auth middleware tests
chore: update dependencies
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Open a PR with a clear description
6. Wait for review and address any feedback

## Code Style

- TypeScript for all code
- ESLint + Prettier for formatting
- Run `npm run lint:fix` before committing

## Testing

- Jest + Supertest for backend
- React Testing Library for frontend
- Aim for meaningful coverage on business logic

## Questions?

Open an issue for any questions or suggestions.
