# OpenCrisis

Open-source crisis-management web app for Model UN delegates and backroom/crisis staff.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multi-tenant structure**: Conference → Committee hierarchy
- **Role-based access**: Admin, Staff, and Delegate roles with RBAC
- **Directives**: Submit, queue, adjudicate with status workflow
- **Crisis Updates**: Staff broadcasts to committee (public or private)
- **Crisis Notes**: Private delegate ↔ staff messaging
- **Real-time**: Socket.IO for live updates
- **Audit Log**: Track all actions and status changes

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB, Socket.IO
- **Frontend**: React, TypeScript, Vite, MUI, Zustand, TanStack Query
- **Validation**: Zod (shared between frontend and backend)
- **Auth**: JWT with refresh tokens, bcrypt password hashing

## Quick Start

### With Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/opencrisis.git
cd opencrisis

# Start all services
docker-compose up

# Access the app at http://localhost:3000
```

### Without Docker

**Prerequisites**: Node.js 18+, MongoDB 7+

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/opencrisis.git
cd opencrisis
npm install

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Build shared types
npm run build -w shared

# Start MongoDB (in separate terminal)
mongod

# Run development servers
npm run dev

# Server runs at http://localhost:5000
# Client runs at http://localhost:3000
```

### Seed Demo Data

```bash
npm run seed
```

Creates:
- Admin user: `admin@example.com` / `password123`
- Staff user: `staff@example.com` / `password123`
- Delegate user: `delegate@example.com` / `password123`
- Sample conference including the topic "Global Crisis Committee"

## Project Structure

```
opencrisis/
├── server/          # Express API + Socket.IO
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── middleware/  # Auth, RBAC, validation
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── socket/      # Socket.IO handlers
│   │   └── scripts/     # Seed scripts
│   └── tests/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom hooks
│   │   ├── stores/      # Zustand stores
│   │   ├── api/         # API client
│   │   └── socket/      # Socket.IO client
│   └── tests/
├── shared/          # Shared types and schemas
│   └── src/
│       ├── types.ts     # Entity types
│       ├── schemas.ts   # Zod validation
│       └── api.ts       # API response types
└── docker-compose.yml
```

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Core Resources
- `/api/conferences` - Conference management
- `/api/committees` - Committee management
- `/api/directives` - Directive submission and adjudication
- `/api/updates` - Crisis updates
- `/api/notes` - Crisis notes/messages
- `/api/audit` - Audit log (admin/staff)

See [API Documentation](./docs/api.md) for full details.

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:committee` | Client → Server | Join committee room |
| `directive:created` | Server → Client | New directive |
| `directive:updated` | Server → Client | Status change |
| `update:new` | Server → Client | New crisis update |
| `note:new` | Server → Client | New crisis note |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for security policy and vulnerability reporting.

## License

MIT License - see [LICENSE](./LICENSE) for details.
