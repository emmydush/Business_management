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

export default INVOICE_STATUSES;