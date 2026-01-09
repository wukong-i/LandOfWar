# Flavortown

A fullstack browser game project with Node backend, built with pnpm workspaces.

## Project Structure

```
flavortown/
├── client/          # Browser game client (Vite + TypeScript)
├── server/          # Node.js backend (Express + TypeScript)
├── shared/          # Shared types and utilities
├── package.json     # Root workspace configuration
└── pnpm-workspace.yaml
```

## Prerequisites

- [Node.js](https://node.js.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

Install pnpm globally if you haven't:
```bash
npm install -g pnpm
```

## Getting Started

### 1. Install Dependencies

From the root directory, install all workspace dependencies:

```bash
pnpm install
```

This will install dependencies for all three packages (client, server, and shared).

### 2. Development Mode

Run both client and server in development mode:

```bash
pnpm dev
```

This will start:
- **Client** on `http://localhost:3000`
- **Server** on `http://localhost:3001`

Or run them individually:

```bash
# Client only
pnpm --filter @flavortown/client dev

# Server only
pnpm --filter @flavortown/server dev
```

### 3. Build for Production

Build all packages:

```bash
pnpm build
```

Then start the production server:

```bash
pnpm --filter @flavortown/server start
```

## Workspace Packages

### @flavortown/client
- **Tech**: React, PixiJS, Socket.io-client, Vite, TypeScript
- **Port**: 3000
- **Description**: Real-time multiplayer browser game client with canvas rendering

### @flavortown/server
- **Tech**: Express, Socket.io, TypeScript
- **Port**: 3001
- **Description**: Real-time backend with WebSocket support

### @flavortown/shared
- **Tech**: TypeScript, Zod
- **Description**: Shared types, schemas, and validation logic used by both client and server

## Available Scripts

- `pnpm dev` - Run all packages in development mode
- `pnpm build` - Build all packages
- `pnpm clean` - Clean all build artifacts and node_modules

## API Endpoints

- `GET /api/health` - Health check endpoint

## Next Steps

1. Add game logic using PixiJS for rendering
2. Implement Socket.io real-time communication:
   - Client-side connection in React components
   - Server-side Socket.io setup with Express
3. Define shared types and Zod schemas in the shared package
4. Implement game state synchronization across clients
5. Add player authentication and game rooms

## License

ISC
