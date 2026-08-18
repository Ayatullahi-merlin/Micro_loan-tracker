-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS repayments CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums if they exist
DROP TYPE IF EXISTS loan_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create ENUM for roles
CREATE TYPE user_role AS ENUM ('borrower', 'admin');

-- Create ENUM for loan status
CREATE TYPE loan_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED');

-- Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'borrower',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Loans Table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_amount NUMERIC(15, 2) NOT NULL CHECK (requested_amount > 0),
    purpose VARCHAR(255) NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    status loan_status NOT NULL DEFAULT 'PENDING',
    approved_amount NUMERIC(15, 2) CHECK (approved_amount >= 0),
    approved_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint to ensure consistent states
    CONSTRAINT check_approval_details CHECK (
        (status = 'PENDING' AND approved_amount IS NULL AND approved_at IS NULL AND due_date IS NULL) OR
        (status = 'REJECTED' AND approved_amount IS NULL) OR
        (status IN ('APPROVED', 'ACTIVE', 'COMPLETED') AND approved_amount IS NOT NULL AND approved_at IS NOT NULL AND due_date IS NOT NULL)
    )
);

-- Create Repayments Table
CREATE TABLE repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    recorded_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_repayments_loan ON repayments(loan_id);
