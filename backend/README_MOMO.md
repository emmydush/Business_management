MoMo Integration (Mobile Money)
================================

Overview
--------
This project includes a basic Mobile Money (MoMo) integration scaffold. It creates a `Payment` model,
provides an endpoint to initiate payments and a webhook endpoint to receive provider notifications.

Files added/changed
- `app/models/payment.py` - Payment model
- `app/utils/momo.py` - Minimal initiation helper (placeholder; replace with real provider API calls)
- `app/routes/subscriptions.py` - `/subscription/<id>/initiate-momo` and `/payments/momo/webhook`
- `db_migrations/001_create_payments_table.sql` - SQL to create the `payments` table
- `.env.example` - environment variables required for MoMo

Required env variables
- `MOMO_PROVIDER` - provider identifier
- `MOMO_API_KEY` - provider API key (primary)
- `MOMO_SECRET_KEY` - provider secret/signing key (secondary)
- `MOMO_CALLBACK_URL` - public webhook URL the provider will call
- `MOMO_SANDBOX_URL` / `MOMO_PROD_URL` - provider endpoints

Local testing
-------------
1. Start backend: `python backend_server.py` (ensure DB is reachable and migrations applied).
2. Apply the migration `db_migrations/001_create_payments_table.sql` to create the `payments` table (using psql or your migration tool).
3. Set `MOMO_SECRET_KEY` in your environment for signature verification.
4. Use `backend/scripts/simulate_momo_webhook.py` to send a signed webhook to `POST /api/subscriptions/payments/momo/webhook`.

Next steps to production-grade
--------------------------------
- Replace `app/utils/momo.initiate_momo_payment` with real provider SDK/API calls (auth, create checkout, etc.).
- Implement retry and idempotency handling for webhook events.
- Add signature verification using the provider's recommended algorithm and header names.
- Add end-to-end tests with provider sandbox credentials and use ngrok for local webhook testing.
- Ensure webhook endpoint is HTTPS and protected by signature verification and rate limits.
