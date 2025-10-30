# Secure Authentication App

A modern, secure authentication system built with Next.js, Prisma, and shadcn/ui components.

## Features

- JWT-based authentication
- Secure password hashing with bcrypt
- Login and registration in one seamless interface
- Protected dashboard route
- Clean, modern UI with shadcn components
- PostgreSQL database with Prisma ORM

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/authdb"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-this"
```

### 3. Database Setup

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── login/             # Login/Register page
│   └── layout.tsx         # Root layout with auth provider
├── components/            # UI components
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── auth-context.tsx  # Auth context provider
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts         # Route protection middleware
```

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiration
- HTTP-only cookies for token storage
- Protected routes with middleware
- Secure API endpoints

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create migration
- `npm run db:studio` - Open Prisma Studio
