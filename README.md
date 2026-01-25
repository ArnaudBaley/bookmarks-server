# Bookmarks Server

A modern, full-stack bookmark management application with a Vue 3 frontend and NestJS backend. Organize your bookmarks with tabs and groups, search quickly, and import from browser bookmarks.

## Overview

Bookmarks Server is a self-hosted alternative to browser bookmarks and bookmark extensions. It provides a clean, organized interface for managing your URLs with features like:

- **Tab-based organization**: Organize bookmarks into different tabs (e.g., Work, Personal, Projects)
- **Group categorization**: Further organize bookmarks within tabs using color-coded groups
- **Quick search**: Find tabs and bookmarks instantly with Ctrl+K keyboard shortcut
- **Drag & drop**: Create bookmarks by dragging URLs from your browser
- **Import/Export**: Import browser bookmarks or export your data as JSON
- **Theme support**: Light and dark themes with system preference detection
- **Multi-tab assignment**: Assign bookmarks to multiple tabs and groups

## Technology Stack

### Frontend
- **Vue 3** (Composition API) - Modern reactive framework
- **TypeScript** - Type-safe development
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS 4** - Utility-first styling
- **Vite 7** - Fast build tool and dev server
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Storybook** - Component catalog

### Backend
- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **TypeORM 0.3** - Object-Relational Mapping
- **SQLite** - Lightweight database
- **class-validator** - DTO validation
- **Jest** - Testing framework

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd bookmarks-server
   ```

2. **Start development environment**:
   ```bash
   cd deploy
   ./deploy-dev.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Manual Setup

See the [Getting Started Guide](documentation/getting-started.md) for detailed instructions on setting up the frontend and backend manually.

## Project Structure

```
bookmarks-server/
├── backend/              # NestJS backend application
│   ├── src/             # Source code
│   │   ├── bookmarks/   # Bookmark module
│   │   ├── groups/      # Group module
│   │   ├── tabs/        # Tab module
│   │   ├── entities/    # TypeORM entities
│   │   └── common/      # Shared utilities
│   ├── test/            # E2E tests
│   └── package.json
├── frontend/            # Vue 3 frontend application
│   ├── src/             # Source code
│   │   ├── components/  # Vue components
│   │   ├── stores/      # Pinia stores
│   │   ├── services/    # API services
│   │   ├── views/       # Page components
│   │   └── router/      # Vue Router config
│   ├── e2e/             # E2E tests
│   └── package.json
├── deploy/              # Deployment configurations
│   ├── docker-compose.yml          # Development Docker Compose
│   ├── docker-compose.prod.yml     # Production Docker Compose
│   ├── deploy-dev.sh               # Development deployment script
│   ├── deploy-prod.sh               # Production deployment script
│   ├── backend/         # Backend Dockerfiles
│   └── frontend/        # Frontend Dockerfiles
├── documentation/       # Comprehensive documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── api.md
│   ├── backend.md
│   ├── frontend.md
│   ├── database-schema.md
│   ├── use-cases.md
│   └── E2E_COVERAGE.md
└── README.md           # This file
```

## Features

### Core Functionality
- ✅ Create, edit, and delete bookmarks
- ✅ Organize bookmarks with tabs and groups
- ✅ Assign bookmarks to multiple tabs and groups
- ✅ Drag and drop URLs to create bookmarks
- ✅ Move bookmarks between groups via drag & drop
- ✅ Quick search with Ctrl+K (Cmd+K on Mac)
- ✅ Light and dark theme support
- ✅ Import browser bookmarks (HTML format)
- ✅ Export/Import data as JSON
- ✅ Duplicate bookmarks, groups, and tabs

### User Experience
- ✅ Responsive design
- ✅ Keyboard navigation
- ✅ Real-time search
- ✅ Color-coded organization
- ✅ Collapsible groups
- ✅ Empty state messages
- ✅ Loading indicators

## Documentation

Comprehensive documentation is available in the `documentation/` directory:

- **[Getting Started](documentation/getting-started.md)** - Setup and installation guide
- **[Architecture](documentation/architecture.md)** - System architecture and design decisions
- **[API Documentation](documentation/api.md)** - Complete REST API reference
- **[Backend Documentation](documentation/backend.md)** - Backend implementation details
- **[Frontend Documentation](documentation/frontend.md)** - Frontend implementation details
- **[Database Schema](documentation/database-schema.md)** - Database structure and relationships
- **[Use Cases](documentation/use-cases.md)** - User-facing features and workflows
- **[E2E Test Coverage](documentation/E2E_COVERAGE.md)** - End-to-end test coverage report

## Development

### Prerequisites
- **Node.js**: Version 20.19.0 or >=22.12.0 (for frontend)
- **npm**: Comes with Node.js
- **Docker** (optional): For containerized deployment

### Running Locally

**Backend**:
```bash
cd backend
npm install
npm run start:dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### Testing

**Backend Tests**:
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov            # Coverage report
```

**Frontend Tests**:
```bash
cd frontend
npm run test:unit         # Unit tests
npm run test:e2e          # E2E tests
npm run storybook         # Component catalog
```

## Deployment

### Development Environment
```bash
cd deploy
./deploy-dev.sh
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Production Environment
```bash
cd deploy
./deploy-prod.sh
```

Access:
- Frontend: http://localhost:8080 (default)
- Backend: http://localhost:3001 (default)

Ports can be customized via environment variables:
- `FRONTEND_PORT`: Frontend port (default: 8080)
- `BACKEND_PORT`: Backend port (default: 3001)

## Environment Variables

### Backend
- `PORT`: Server port (default: 3000)
- `FRONTEND_URL`: Allowed CORS origin (default: `*`)
- `DATABASE_PATH`: SQLite database file path (default: `bookmarks.db`)

### Frontend
- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:3000`)
- `VITE_USE_MOCK_API`: Force mock API mode (default: `false`)

## Database

The application uses SQLite for data persistence. The database file is automatically created on first run.

- **Development**: `backend/bookmarks.db` (or path specified in `DATABASE_PATH`)
- **Docker**: `deploy/data/bookmarks.db` (mounted volume)

## API

The backend provides a RESTful API for managing bookmarks, groups, and tabs.

**Base URL**: `http://localhost:3000`

See [API Documentation](documentation/api.md) for complete endpoint reference.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows the project's style guidelines
2. Tests are added/updated for new features
3. Documentation is updated as needed
4. All tests pass before submitting

## License

This project is private and unlicensed.

## Support

For issues, questions, or contributions, please refer to the documentation or open an issue in the repository.

---

**Built with** ❤️ **using Vue 3, NestJS, and TypeScript**
