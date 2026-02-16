// Invoice status constants and labels
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  UNPAID: 'unpaid',
  PARTIALLY_PAID: 'partially_paid'
};

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.DRAFT]: 'Draft',
  [INVOICE_STATUSES.SENT]: 'Sent',
  [INVOICE_STATUSES.VIEWED]: 'Viewed',
  [INVOICE_STATUSES.PAID]: 'Paid',
  [INVOICE_STATUSES.OVERDUE]: 'Overdue',
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.UNPAID]: 'Unpaid',
  [INVOICE_STATUSES.PARTIALLY_PAID]: 'Partially Paid',
};

// Payment status constants and labels
export const PAYMENT_STATUSES = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.PAID]: 'Paid',
  [PAYMENT_STATUSES.UNPAID]: 'Unpaid',
  [PAYMENT_STATUSES.PARTIAL]: 'Partial',
  [PAYMENT_STATUSES.PENDING]: 'Pending',
  [PAYMENT_STATUSES.FAILED]: 'Failed',
  [PAYMENT_STATUSES.REFUNDED]: 'Refunded',
  [PAYMENT_STATUSES.OVERDUE]: 'Overdue',
  [PAYMENT_STATUSES.CANCELLED]: 'Cancelled'
};

export default INVOICE_STATUSES;
