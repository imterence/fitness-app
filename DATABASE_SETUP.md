# Database Setup Guide - PostgreSQL + Prisma

## Prerequisites

1. **PostgreSQL** installed and running on your system
2. **Node.js** 18+ and npm
3. **Git** for version control

## Step 1: Install PostgreSQL

### Windows
1. Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Remember your password for the `postgres` user
4. Default port: 5432

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database

1. **Open PostgreSQL command prompt** (Windows) or **psql** (macOS/Linux)
2. **Create database:**
   ```sql
   CREATE DATABASE hyroxfit_db;
   ```
3. **Create user** (optional but recommended):
   ```sql
   CREATE USER hyroxfit_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE hyroxfit_db TO hyroxfit_user;
   ```

## Step 3: Configure Environment

1. **Copy the example environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file** with your actual database credentials:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/hyroxfit_db"
   
   # NextAuth Configuration
   NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   **Replace:**
   - `username`: Your PostgreSQL username (default: `postgres`)
   - `password`: Your PostgreSQL password
   - `localhost`: Database host (use `localhost` for local development)
   - `5432`: PostgreSQL port (default: 5432)
   - `hyroxfit_db`: Database name

## Step 4: Generate Prisma Client

```bash
npm run db:generate
```

## Step 5: Push Database Schema

```bash
npm run db:push
```

This will create all the tables in your PostgreSQL database.

## Step 6: Seed the Database

```bash
npm run db:seed
```

This will create:
- Admin user: `admin@hyroxfit.com` / `admin123`
- Trainer user: `trainer@hyroxfit.com` / `trainer123`
- Client user: `client@hyroxfit.com` / `client123`
- 6 exercises (Burpee Box Jump Over, Wall Ball, Sled Push, etc.)
- 1 workout template (Hyrox Competition Prep)

## Step 7: Verify Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open Prisma Studio** (optional):
   ```bash
   npm run db:studio
   ```
   This opens a web interface to view/edit your database.

3. **Test login** with the seeded accounts

## Database Schema Overview

### Core Models

- **User**: Trainers, clients, and admins with role-based access
- **Client**: Extended profile for client users
- **Exercise**: Library of exercises with categories and difficulty
- **WorkoutTemplate**: Pre-built workout programs
- **Workout**: Custom workouts created by trainers
- **ClientWorkout**: Workout assignments and scheduling
- **WorkoutProgress**: Progress tracking for completed workouts

### Key Relationships

- Trainers can have multiple clients
- Clients belong to one trainer
- Workout templates and workouts can be assigned to clients
- Progress is tracked per exercise per workout session

## Troubleshooting

### Common Issues

1. **Connection refused:**
   - Ensure PostgreSQL is running
   - Check port number in connection string
   - Verify firewall settings

2. **Authentication failed:**
   - Double-check username/password
   - Ensure user has access to database

3. **Database doesn't exist:**
   - Run `CREATE DATABASE hyroxfit_db;` in PostgreSQL

4. **Permission denied:**
   - Grant proper privileges to your user
   - Check if user exists and has correct permissions

### Reset Database

If you need to start fresh:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS hyroxfit_db;"
psql -U postgres -c "CREATE DATABASE hyroxfit_db;"

# Regenerate and push schema
npm run db:generate
npm run db:push
npm run db:seed
```

## Next Steps

1. **Update NextAuth configuration** to use the database
2. **Replace mock data** in components with real database queries
3. **Add API routes** for CRUD operations
4. **Implement real-time updates** for workout progress
5. **Add data validation** and error handling

## Production Considerations

1. **Use environment variables** for all sensitive data
2. **Set up proper database backups**
3. **Configure connection pooling** for high traffic
4. **Use migrations** instead of `db:push` for production
5. **Set up monitoring** and logging
6. **Implement proper security** measures


