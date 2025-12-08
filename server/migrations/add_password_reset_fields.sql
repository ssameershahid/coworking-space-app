-- Add password reset fields to users table
-- Run this migration on the production database to enable forgot password functionality

-- Add password_reset_token column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;

-- Add password_reset_expires column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Create index on password_reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

