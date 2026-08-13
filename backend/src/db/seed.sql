-- Seed Users (Bcrypt hash of 'password123' is '$2a$10$l2G.CUgly63EsxvLzSoe4eEduOOJxL4luY.M5PQqigXhAw9rzaZBe')
INSERT INTO users (id, name, email, password_hash, role) VALUES
('a1111111-1111-1111-1111-111111111111', 'Admin Officer', 'admin@microloan.com', '$2a$10$l2G.CUgly63EsxvLzSoe4eEduOOJxL4luY.M5PQqigXhAw9rzaZBe', 'admin'),
('b2222222-2222-2222-2222-222222222222', 'John Doe', 'john@gmail.com', '$2a$10$l2G.CUgly63EsxvLzSoe4eEduOOJxL4luY.M5PQqigXhAw9rzaZBe', 'borrower'),
('c3333333-3333-3333-3333-333333333333', 'Jane Smith', 'jane@gmail.com', '$2a$10$l2G.CUgly63EsxvLzSoe4eEduOOJxL4luY.M5PQqigXhAw9rzaZBe', 'borrower')
ON CONFLICT (email) DO NOTHING;

-- Seed Loans
-- John Doe's Loans
INSERT INTO loans (id, borrower_id, requested_amount, purpose, duration_months, status, approved_amount, approved_at, due_date, officer_notes, created_at) VALUES
-- Pending Loan
('d4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 50000.00, 'Shop Inventory restock', 3, 'PENDING', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Active Loan (Disbursed & partially repaid)
('e5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 100000.00, 'Agricultural feed purchases', 6, 'ACTIVE', 100000.00, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '150 days', 'Approved based on good credit history.', CURRENT_TIMESTAMP - INTERVAL '32 days'),
-- Completed Loan (Fully repaid)
('f6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', 30000.00, 'Emergency medical bill payment', 2, 'COMPLETED', 30000.00, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '1 days', 'Approved for emergency assistance.', CURRENT_TIMESTAMP - INTERVAL '62 days')
ON CONFLICT (id) DO NOTHING;

-- Jane Smith's Loans
INSERT INTO loans (id, borrower_id, requested_amount, purpose, duration_months, status, approved_amount, approved_at, due_date, officer_notes, created_at) VALUES
-- Rejected Loan
('07777777-7777-7777-7777-777777777777', 'c3333333-3333-3333-3333-333333333333', 200000.00, 'Purchase second-hand vehicle', 12, 'REJECTED', NULL, NULL, NULL, 'Vehicle purchase is outside micro-loan criteria.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
-- Active Loan (Disbursed but not yet repaid)
('08888888-8888-8888-8888-888888888888', 'c3333333-3333-3333-3333-333333333333', 80000.00, 'University school fees payment', 4, 'ACTIVE', 80000.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '110 days', 'Direct disbursement to school validated.', CURRENT_TIMESTAMP - INTERVAL '11 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Repayments
-- For John's Active Loan (ID: e5555555-5555-5555-5555-555555555555) - paid 40,000 in total
INSERT INTO repayments (id, loan_id, amount, payment_date, payment_reference, recorded_by_id) VALUES
('11111111-1111-1111-1111-111111111111', 'e5555555-5555-5555-5555-555555555555', 20000.00, CURRENT_TIMESTAMP - INTERVAL '15 days', 'PAY-REF-001', 'a1111111-1111-1111-1111-111111111111'),
('12222222-2222-2222-2222-222222222222', 'e5555555-5555-5555-5555-555555555555', 20000.00, CURRENT_TIMESTAMP - INTERVAL '5 days', 'PAY-REF-002', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- For John's Completed Loan (ID: f6666666-6666-6666-6666-666666666666) - fully paid 30,000
INSERT INTO repayments (id, loan_id, amount, payment_date, payment_reference, recorded_by_id) VALUES
('13333333-3333-3333-3333-333333333333', 'f6666666-6666-6666-6666-666666666666', 15000.00, CURRENT_TIMESTAMP - INTERVAL '40 days', 'PAY-REF-COMP-1', 'a1111111-1111-1111-1111-111111111111'),
('14444444-4444-4444-4444-444444444444', 'f6666666-6666-6666-6666-666666666666', 15000.00, CURRENT_TIMESTAMP - INTERVAL '20 days', 'PAY-REF-COMP-2', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
