-- Database setup script for Hostinger VPS
-- Run this as the postgres user

-- Create database
CREATE DATABASE hyroxfit_db;

-- Create user with password
CREATE USER hyroxfit_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hyroxfit_db TO hyroxfit_user;

-- Connect to the database and grant schema privileges
\c hyroxfit_db;
GRANT ALL ON SCHEMA public TO hyroxfit_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hyroxfit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hyroxfit_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hyroxfit_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hyroxfit_user;

-- Exit
\q
