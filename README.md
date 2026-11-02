# Smart IT Helpdesk

Full-stack IT helpdesk project built with React, TypeScript, Express, Prisma, PostgreSQL and Docker.

## Local setup

### 1. Start PostgreSQL

```powershell
docker compose up -d
```

### 2. Backend

```powershell
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend: `http://localhost:4000`

### 3. Frontend

Open another terminal:

```powershell
cd client
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Environment

Local `.env` files are ignored by Git. Use `.env.example` as the template when setting up a new machine.
