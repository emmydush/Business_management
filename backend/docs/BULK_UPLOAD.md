Bulk upload products (CSV)

Endpoint: POST /api/inventory/products/bulk-upload
Auth: JWT required. User must have inventory module access and at least manager role.

Request: multipart/form-data with `file` field containing a .csv file.

CSV fields (headers):
- Required: name, unit_price (selling price), category (category name) or category_id
- Optional: product_id, sku, barcode, cost_price, stock_quantity, reorder_level, description

Behavior:
- Each row is processed independently; successful rows are created and committed, errors are reported per-row.
- Returns JSON: { created: [product...], errors: [{row, error}], created_count }

Notes:
- Only CSV is supported currently.
- Categories must exist for the business (category name must match or provide category_id).
- Ensure SKU/barcode/product_id uniqueness per business.
