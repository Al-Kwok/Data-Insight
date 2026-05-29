# Yarn Workspaces Guide

## Overview

This project now uses **Yarn Workspaces** to manage dependencies across three packages:
- **Root**: Main project (src/, test/, TypeScript compilation, testing)
- **Frontend**: React application
- **Server**: Express REST API server

## Structure

```
InsightFacade/
├── package.json          (Root - includes workspaces config)
├── yarn.lock            (Single lock file for all packages)
├── node_modules/        (Shared dependencies hoisted here)
├── frontend/
│   └── package.json     (Frontend dependencies)
├── server/
│   └── package.json     (Server dependencies)
└── test/
    └── rest/
        └── Server.spec.ts (REST API tests)
```

## Installation

```bash
# Install all dependencies for all three packages
yarn install

# That's it! No need to cd into frontend/ or server/
```

## Running Commands

### Root Project (Testing, Building, Linting)

```bash
# Run tests (includes Server.spec.ts)
yarn test

# Build TypeScript
yarn build

# Lint & format
yarn lint:check
yarn prettier:fix
```

### Frontend

```bash
# From root directory
yarn workspace frontend start      # Start React dev server
yarn workspace frontend build      # Build for production
yarn workspace frontend test       # Run React tests

# Or cd into directory
cd frontend
yarn start
yarn build
yarn test
```

### Server

```bash
# From root directory
yarn workspace server dev          # Start server in dev mode
yarn workspace server build        # Compile TypeScript
yarn workspace server start        # Run compiled server

# Or cd into directory
cd server
yarn dev
yarn build
yarn start
```

## Benefits

✅ **Single install**: `yarn install` installs everything
✅ **Shared dependencies**: express, typescript, etc. installed once
✅ **Single lock file**: `yarn.lock` tracks all dependencies
✅ **Faster installs**: Yarn deduplicates packages
✅ **Cleaner**: No more multiple `node_modules/` directories

## REST API Tests Still Work!

The tests in `test/rest/Server.spec.ts` continue to work as before:

```bash
yarn test                           # Runs all tests including Server.spec.ts
yarn test -- test/rest/Server.spec.ts  # Run only REST API tests
```

**Status**: ✅ 116 passing, 10 failing (same as before migration)

## Migration Completed

- ✅ Added `workspaces` to root package.json
- ✅ Removed `frontend/node_modules` and `package-lock.json`
- ✅ Removed `server/node_modules` and `package-lock.json`
- ✅ Removed root `package-lock.json`
- ✅ Ran `yarn install` to set up workspaces
- ✅ Verified tests still work

## Troubleshooting

**Issue**: "Cannot find module"
**Fix**: Run `yarn install` from root

**Issue**: Want to add a package to frontend
**Solution**:
```bash
yarn workspace frontend add react-router-dom
```

**Issue**: Want to add a package to server
**Solution**:
```bash
yarn workspace server add dotenv
```

**Issue**: Want to add a dev dependency to root
**Solution**:
```bash
yarn add -D eslint --ignore-workspace-root-check
```
