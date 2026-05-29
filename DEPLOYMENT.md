# InsightFacade Deployment Guide

The frontend and backend are now integrated to run on a single port (3000).

## 🚀 First Time Setup (For New Developers)

If you just cloned this repository:

1. **Install all dependencies** (root, frontend, and server):
   ```bash
   yarn install
   ```
   This installs everything you need across all three workspaces.

2. **Build TypeScript source code** (compiles src/ and server/):
   ```bash
   yarn build
   ```

3. **Build frontend React app** (required to run production server):
   ```bash
   yarn workspace frontend build
   ```

You're now ready to develop or deploy!

**Quick note**: `yarn build` compiles TypeScript but does NOT build the React frontend. You need both commands for a complete production build.

---

## Quick Start

### Option 1: Run Production Build (Recommended)

1. **Build everything** (frontend + server + TypeScript):
   ```bash
   # Build frontend React app
   yarn workspace frontend build

   # Build server TypeScript
   yarn workspace server build

   # Or build root TypeScript (for src/controller)
   yarn build
   ```

2. **Start the integrated server**:
   ```bash
   yarn workspace server start
   # Or: cd server && yarn start
   ```

3. **Access the application**:
   - Open your browser to: `http://localhost:3000`
   - The React frontend will load automatically
   - API endpoints are available at the same origin

---

### Option 2: Development Mode with Hot Reload

**Terminal 1** - Backend with auto-reload:
```bash
yarn workspace server dev
# Or: cd server && yarn dev
```

**Terminal 2** - Frontend with hot reload:
```bash
yarn workspace frontend start
# Or: cd frontend && yarn start
```

**Ports:**
- Frontend: `http://localhost:3001` (proxies API calls to port 3000)
- Backend API: `http://localhost:3000`

---

## Architecture

```
http://localhost:3000/
├── /                              → React Frontend (index.html)
├── /static/                       → React static assets
├── /api/v1/datasets/:id/:kind     → API: Add dataset (PUT)
├── /api/v1/datasets/:id           → API: Remove dataset (DELETE)
├── /api/v1/datasets               → API: List datasets (GET)
├── /api/v1/queries                → API: Perform query (POST)
└── /api/v1/insights/:id           → API: Generate insights (GET)
```

---

## How It Works

1. **Static Files**: Express serves the React build from `frontend/build/`
2. **API Routes**: Defined routes (`/api/v1/*`) handle API requests
3. **Catch-All**: Any unmatched route serves `index.html` (for React Router support)
4. **CORS**: Enabled for development (when frontend runs on different port)

---

## File Structure

```
InsightFacade/
├── package.json               # Root workspace config
├── yarn.lock                  # Single lock file for all packages
├── node_modules/              # Shared dependencies (hoisted)
├── src/
│   └── controller/            # InsightFacade business logic (TypeScript)
├── test/
│   ├── controller/            # Unit tests
│   └── rest/                  # REST API tests (Server.spec.ts)
├── frontend/
│   ├── package.json           # Frontend workspace
│   ├── build/                 # Production build (served by Express)
│   ├── src/
│   │   ├── components/        # React components
│   │   └── services/
│   │       └── api.ts         # API client (uses relative URLs)
│   └── node_modules/          # Frontend-specific dependencies (if any)
└── server/
    ├── package.json           # Server workspace
    ├── server.ts              # Express server + static file serving
    ├── dist/                  # Compiled server code
    └── node_modules/          # Server-specific dependencies (if any)
```

---

## Rebuilding

### When to rebuild frontend:
- After modifying any React components
- After changing API service configuration
- After updating styles

```bash
yarn workspace frontend build
```

### When to rebuild server:
- After modifying `server.ts`

```bash
yarn workspace server build
```

### When to rebuild root TypeScript:
- After changing any TypeScript in `src/controller/`

```bash
yarn build
```

---

## Running Tests

```bash
# Run all tests (including REST API tests)
yarn test

# Run only REST API tests
yarn test -- test/rest/Server.spec.ts
```

---

## Production Deployment

For production deployment (e.g., to a cloud service):

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd InsightFacade
   yarn install
   ```

2. **Build everything**:
   ```bash
   # Build TypeScript source (src/controller)
   yarn build

   # Build frontend React app
   yarn workspace frontend build

   # Build server TypeScript
   yarn workspace server build
   ```

3. **Set environment variables**:
   ```bash
   export PORT=3000
   export NODE_ENV=production
   ```

4. **Start the server**:
   ```bash
   yarn workspace server start
   ```

5. The server will:
   - Serve the React app at the root URL
   - Handle API requests at `/api/v1/*`
   - Serve all static assets

---

## Common Commands Reference

### Installation & Setup
```bash
yarn install                    # Install all dependencies
yarn build                      # Build root TypeScript (src/)
```

### Development
```bash
yarn workspace frontend start   # Start React dev server (port 3001)
yarn workspace server dev       # Start Express with hot reload (port 3000)
yarn test                       # Run all tests
```

### Building
```bash
yarn workspace frontend build   # Build React for production
yarn workspace server build     # Compile server TypeScript
yarn build                      # Compile root TypeScript (src/)
```

### Production
```bash
yarn workspace server start     # Run compiled server (serves frontend)
```

---

## Troubleshooting

### "Cannot find module" errors
**Fix**: Run `yarn install` from the root directory

### Frontend not loading
- Ensure `frontend/build/` directory exists
- Check that you ran `yarn workspace frontend build`
- Verify the path in `server.ts` is correct: `../../frontend/build`

### API calls failing
- Check that the backend server is running on port 3000
- Verify API routes are registered before the catch-all route
- Check browser console for CORS or network errors
- Ensure API URLs use `/api/v1/` prefix

### 404 on refresh
- This shouldn't happen! The catch-all route should serve index.html
- If it does, check the route order in server.ts

### Port already in use
- Change the PORT in server.ts or use environment variable:
  ```bash
  PORT=8080 yarn workspace server start
  ```

### Tests failing with module errors
- Ensure `tsconfig.json` includes `server/**/*.ts`
- Run `yarn install` to ensure all dependencies are linked
- Check that `test/rest/Server.spec.ts` imports are correct

---

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to 'production' for production builds

---

## Development Workflow Summary

### Starting a fresh clone:
1. `yarn install`
2. `yarn build`
3. `yarn workspace server dev` (Terminal 1)
4. `yarn workspace frontend start` (Terminal 2)

### After making changes:
- **Frontend changes**: Auto-reloads if dev server running
- **Server changes**: Auto-reloads if using `yarn workspace server dev`
- **src/controller changes**: Run `yarn build`, then restart server
- **Before committing**: Run `yarn test` to verify tests pass
