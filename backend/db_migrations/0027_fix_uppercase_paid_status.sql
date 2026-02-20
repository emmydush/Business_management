-- Migration to convert any uppercase 'PAID' status values to lowercase 'paid'
UPDATE invoices SET status = 'paid' WHERE status = 'PAID';
