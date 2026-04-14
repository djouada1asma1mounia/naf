# PFE NAFTAL

Integrated web platform for NAFTAL operational workflows.

## Overview

This project is split into two main applications:

- backend: NestJS API for authentication, business logic, and database access
- frontend: React web interface for users and operations teams

Implemented business areas include users, roles, permissions, departments, categories, materials, interventions, decharges, statistics, and exports.

## Tech Stack

- Backend: NestJS, TypeORM, MySQL, JWT
- Frontend: React, MUI, Axios, React Router

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+

## Project Structure

```text
Naftal_PFE/
├─ backend/
│  ├─ src/
│  └─ test/
├─ frontend/
│  ├─ src/
│  └─ public/
└─ reamde.md
```

## Setup

### 1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure backend environment

Create a file named `.env` inside `backend/` with the following values:

```env
PORT=3001

HOST=localhost
DB_PORT=3306
USERNAMEDB=root
PASSWORD=your_password
DATABASE=naftal_db

JWT_ACCESS_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_another_strong_secret
```

### 3) Run migrations

```bash
cd backend
npm run migration:run
```

## Run the project

### Backend

```bash
cd backend
npm run start:dev
```

Backend default URL: http://localhost:3001

### Frontend

```bash
cd frontend
npm start
```

Frontend default URL: http://localhost:3000

In development, frontend API requests are proxied to backend.

## Useful Commands

Backend:

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Frontend:

```bash
npm start
npm run build
npm test
```

## Authentication Notes

- Login endpoint returns an access token
- Refresh token is stored as an HTTP-only cookie
- Protected API routes require Authorization: Bearer <token>

## Suggested Next Improvements

- Add API documentation with Swagger
- Add CI pipeline for lint and tests
- Add deployment guide for production
- Increase automated test coverage