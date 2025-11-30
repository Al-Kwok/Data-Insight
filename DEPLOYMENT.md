# InsightFacade Deployment Guide

The frontend and backend are now integrated to run on a single port (3000).

## Quick Start

### Option 1: Run Production Build (Recommended)

1. **Build the frontend** (only needed after frontend code changes):
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. **Build the server** (only needed after server/src code changes):
   ```bash
   cd server
   npm run build
   cd ..
   ```

3. **Start the integrated server**:
   ```bash
   cd server
   npm start
   ```

4. **Access the application**:
   - Open your browser to: `http://localhost:3000`
   - The React frontend will load automatically
   - API endpoints are available at the same origin

### Option 2: Development Mode with Hot Reload

**Terminal 1** - Backend with auto-reload:
```bash
cd server
npm run dev
```

**Terminal 2** - Frontend with hot reload:
```bash
cd frontend
npm start
```
- Frontend: `http://localhost:3001` (proxies API calls to port 3000)
- Backend API: `http://localhost:3000`

## Architecture

```
http://localhost:3000/
├── /                          → React Frontend (index.html)
├── /static/                   → React static assets
├── /dataset/:id/:kind         → API: Add dataset (PUT)
├── /dataset/:id               → API: Remove dataset (DELETE)
├── /datasets                  → API: List datasets (GET)
└── /query                     → API: Perform query (POST)
```

## How It Works

1. **Static Files**: Express serves the React build from `frontend/build/`
2. **API Routes**: Defined routes (`/dataset/*`, `/datasets`, `/query`) handle API requests
3. **Catch-All**: Any unmatched route serves `index.html` (for React Router support)
4. **CORS**: Enabled for development (when frontend runs on different port)

## File Structure

```
InsightFacade/
├── frontend/
│   ├── build/                 # Production build (served by Express)
│   ├── src/
│   │   ├── components/        # React components
│   │   └── services/
│   │       └── api.ts         # API client (uses relative URLs)
│   └── package.json
├── server/
│   ├── server.ts              # Express server + static file serving
│   ├── dist/                  # Compiled server code
│   └── package.json
└── src/
    └── controller/            # InsightFacade business logic
```

## Rebuilding

### When to rebuild frontend:
- After modifying any React components
- After changing API service configuration
- After updating styles

```bash
cd frontend && npm run build
```

### When to rebuild server:
- After modifying `server.ts`
- After changing any TypeScript in `src/controller/`

```bash
cd server && npm run build
```

## Production Deployment

For production deployment (e.g., to a cloud service):

1. Build both frontend and server:
   ```bash
   npm run build:all  # If you create this script
   ```

2. Set environment variables:
   ```bash
   export PORT=3000
   export NODE_ENV=production
   ```

3. Start the server:
   ```bash
   cd server && npm start
   ```

4. The server will:
   - Serve the React app at the root URL
   - Handle API requests
   - Serve all static assets

## Troubleshooting

### Frontend not loading
- Ensure `frontend/build/` directory exists
- Check that you ran `npm run build` in the frontend directory
- Verify the path in `server.ts` is correct: `../../frontend/build`

### API calls failing
- Check that the backend server is running
- Verify API routes are registered before the catch-all route
- Check browser console for CORS or network errors

### 404 on refresh
- This shouldn't happen! The catch-all route should serve index.html
- If it does, check the route order in server.ts

### Port already in use
- Change the PORT in server.ts or use environment variable:
  ```bash
  PORT=8080 npm start
  ```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to 'production' for production builds
