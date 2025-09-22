-- Initialize database for ElectroStock Pro
-- This script runs when the PostgreSQL container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE electrostock_pro'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'electrostock_pro')\gexec

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for multi-tenancy if needed
-- The Prisma migrations will handle the actual table creation
