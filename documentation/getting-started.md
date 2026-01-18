# Getting Started

## Overview

This guide will help you set up and run the bookmarks application on your local machine. The application consists of a Vue 3 frontend and a NestJS backend, both of which can be run independently or together using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.19.0 or >=22.12.0 (for frontend)
- **npm**: Comes with Node.js
- **Docker** (optional): For containerized deployment
- **Docker Compose** (optional): For running both services together

### Verify Installation

```bash
node --version    # Should be 20.19.0+ or 22.12.0+
npm --version     # Should be 8.0.0+
docker --version  # Optional, for Docker setup
```

## Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose, which sets up both frontend and backend automatically.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bookmarks-server
```

### 2. Start with Docker Compose

**Development Environment**:
```bash
cd backend/deploy
./deploy-dev.sh
```

Or manually:
```bash
docker-compose -f docker-compose.yml up
```

**Production Environment**:
```bash
cd backend/deploy
./deploy-prod.sh
```

Or manually:
```bash
docker-compose -f docker-compose.prod.yml up
```

### 3. Access the Application

- **Frontend**: http://localhost:5173 (dev) or http://localhost:8080 (prod)
- **Backend API**: http://localhost:3000

### 4. Stop the Services

```bash
docker-compose down
```

## Manual Setup (Without Docker)

### Backend Setup

#### 1. Navigate to Backend Directory

```bash
cd backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory (optional, defaults are provided):

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=bookmarks.db
```

#### 4. Start the Backend

**Development Mode** (with hot-reload):
```bash
npm run start:dev
```

**Production Mode**:
```bash
npm run build
npm run start:prod
```

The backend will start on `http://localhost:3000`

#### 5. Verify Backend is Running

```bash
curl http://localhost:3000
```

Or open `http://localhost:3000` in your browser.

### Frontend Setup

#### 1. Navigate to Frontend Directory

```bash
cd frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK_API=false
```

**Note**: If `VITE_API_BASE_URL` is not set, the frontend will use the mock API.

#### 4. Start the Frontend

**Development Mode**:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

#### 5. Build for Production

```bash
npm run build
npm run preview
```

## Running Both Services

### Option 1: Two Terminal Windows

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### Option 2: Using npm-run-all (if installed globally)

```bash
# From project root
npm install -g npm-run-all

# Run both (requires scripts in root package.json)
npm-run-all --parallel backend:dev frontend:dev
```

## Environment Variables

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `FRONTEND_URL` | `*` | Allowed CORS origin |
| `DATABASE_PATH` | `bookmarks.db` | SQLite database file path |

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API URL |
| `VITE_USE_MOCK_API` | `false` | Force mock API mode |

## Database Setup

The application uses SQLite, which requires no additional setup. The database file is automatically created on first run.

### Database Location

- **Development**: `backend/bookmarks.db` (or path specified in `DATABASE_PATH`)
- **Docker**: `backend/deploy/data/bookmarks.db`

### Database Initialization

The database schema is automatically created by TypeORM on first run (when `synchronize: true` is enabled in development).

**Note**: In production, you should use migrations instead of `synchronize: true`.

## Testing the Setup

### 1. Test Backend API

```bash
# Get all tabs
curl http://localhost:3000/tabs

# Create a tab
curl -X POST http://localhost:3000/tabs \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tab","color":"#3b82f6"}'
```

### 2. Test Frontend

1. Open http://localhost:5173 in your browser
2. You should see the bookmarks interface
3. Try creating a bookmark or tab

### 3. Test API Integration

1. Open browser developer tools (F12)
2. Check the Network tab
3. Perform actions in the UI
4. Verify API calls are being made to `http://localhost:3000`

## Development Workflow

### Backend Development

1. **Start in watch mode**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Make changes** to files in `backend/src/`

3. **Server automatically restarts** on file changes

4. **Run tests**:
   ```bash
   npm run test              # Unit tests
   npm run test:e2e          # E2E tests
   npm run test:cov          # With coverage
   ```

### Frontend Development

1. **Start development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Make changes** to files in `frontend/src/`

3. **Hot Module Replacement (HMR)** automatically updates the browser

4. **Run tests**:
   ```bash
   npm run test:unit         # Unit tests
   npm run test:e2e          # E2E tests
   npm run storybook         # Component catalog
   ```

## Common Issues and Solutions

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run start:dev
```

### Issue: Frontend Can't Connect to Backend

**Symptoms**: Network errors in browser console, mock API being used

**Solutions**:
1. Verify backend is running on port 3000
2. Check `VITE_API_BASE_URL` in frontend `.env`
3. Verify CORS is configured correctly in backend
4. Check browser console for CORS errors

### Issue: Database Not Found

**Error**: `SQLITE_CANTOPEN: unable to open database file`

**Solution**:
```bash
# Create data directory
mkdir -p backend/deploy/data

# Or set DATABASE_PATH to an existing directory
export DATABASE_PATH=/path/to/database.db
```

### Issue: Dependencies Installation Fails

**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install`
4. Try using a different Node.js version

### Issue: TypeScript Errors

**Solutions**:
1. Run type check: `npm run type-check`
2. Ensure TypeScript version matches project requirements
3. Clear build cache and rebuild

## Project Structure Overview

```
bookmarks-server/
├── backend/              # NestJS backend
│   ├── src/             # Source code
│   ├── test/            # E2E tests
│   ├── deploy/          # Docker configs
│   └── package.json
├── frontend/            # Vue 3 frontend
│   ├── src/             # Source code
│   ├── e2e/             # E2E tests
│   ├── deploy/          # Docker configs
│   └── package.json
├── documentation/       # Documentation files
└── docker-compose.yml   # Root Docker Compose
```

## Next Steps

1. **Read the Documentation**:
   - [Frontend Documentation](frontend.md)
   - [Backend Documentation](backend.md)
   - [API Documentation](api.md)
   - [Use Cases](use-cases.md)

2. **Explore the Codebase**:
   - Start with `frontend/src/App.vue` and `backend/src/main.ts`
   - Review component structure in `frontend/src/components/`
   - Check API endpoints in `backend/src/*/controllers.ts`

3. **Run Tests**:
   - Backend: `cd backend && npm run test`
   - Frontend: `cd frontend && npm run test:unit`

4. **Start Developing**:
   - Create a new feature branch
   - Make your changes
   - Test thoroughly
   - Submit a pull request

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com
- **Vue 3 Documentation**: https://vuejs.org
- **TypeORM Documentation**: https://typeorm.io
- **Pinia Documentation**: https://pinia.vuejs.org
- **Tailwind CSS Documentation**: https://tailwindcss.com

## Getting Help

If you encounter issues:

1. Check the [Common Issues](#common-issues-and-solutions) section
2. Review the application logs
3. Check browser console for frontend errors
4. Review backend logs for API errors
5. Consult the relevant documentation files

## Production Deployment

For production deployment, see the deployment scripts:

- **Backend**: `backend/deploy/deploy-prod.sh`
- **Frontend**: `frontend/deploy/deploy-prod.sh`

Or use the root Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Important**: 
- Set proper environment variables
- Use a production database (not SQLite for high-traffic scenarios)
- Enable HTTPS
- Configure proper CORS origins
- Set up authentication if needed
