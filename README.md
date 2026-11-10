# Medical.com — Backend

Backend service for **Medical.com**, a full-stack web application in the healthcare domain. Built with Node.js, Express, and TypeScript, it provides the server-side foundation for the client application, including database access, data validation, and integration with supporting services.

## Tech Stack

| Technology                       | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| **Node.js & TypeScript**         | Server-side runtime and type-safe application development             |
| **Express 5**                    | HTTP server and API routing                                           |
| **PostgreSQL**                   | Relational database                                                   |
| **Knex.js**                      | SQL query building and database migrations                            |
| **Redis (ioredis)**              | Integration with an in-memory data store                              |
| **Zod**                          | Schema-based input validation                                         |
| **Resend**                       | Email service integration                                             |
| **Helmet, CORS & cookie-parser** | HTTP security headers, cross-origin configuration, and cookie parsing |
| **Docker Compose**               | Local service orchestration                                           |
| **Oxlint & TypeScript**          | Linting and static type checking                                      |

## Getting Started

### Requirements

- Node.js and npm
- Docker and Docker Compose
- Required environment variables configured for your local setup

### Installation

```bash
git clone https://github.com/medical-com/backend.git
cd backend
npm install
```

Copy `.env.example` to `.env` and configure the required values.

Start the required services using Docker Compose:

```bash
docker compose up -d
```

Run the database migrations:

```bash
npm run knex:migrate:latest
```

Finally, start the development server:

```bash
npm run dev
```

### Useful Commands

```bash
npm run dev                 # Start development server with file watching
npm run build               # Build the application
npm start                   # Run the compiled application
npm run typecheck           # Check TypeScript types
npm run lint                # Run lint checks
npm run knex:migrate:latest # Apply database migrations
```

## Frontend

The corresponding React application is available in the [Medical.com Client repository](https://github.com/medical-com/client).
