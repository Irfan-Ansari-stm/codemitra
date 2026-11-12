'use client';

import { Receipt } from 'lucide-react';
import { PlatformModulePlaceholder } from '@/components/common/PlatformModulePlaceholder';

export default function InvoicesPage() {
  return (
    <PlatformModulePlaceholder
      category="Operations & Workflow"
      title="Invoices & Transactions"
      description="Track platform billing history, institutional purchase orders, automated tax invoicing (GST/VAT), payment gateway receipts, and refunds."
      icon={Receipt}
      badge="Financial Ledger"
      features={[
        'Automated monthly and annual invoice generation for institutional tiers',
        'Stripe, Razorpay, and manual bank wire reconciliation logs',
        'Tax compliant PDF receipts with university purchase order numbers',
        'Overdue billing reminders and grace period automation',
        'Refund request processing and credit note issuance',
        'Financial export (CSV/Excel) for accounting reconciliation',
      ]}
      stats={[
        { label: 'Total Invoiced', value: '$124,500', hint: 'Year to date' },
        { label: 'Paid Invoices', value: '142', hint: '100% on-time' },
        { label: 'Pending POs', value: '2 Institutes', hint: 'Under review' },
        { label: 'Tax Compliant', value: 'GST / VAT', hint: 'Automated breakdown' },
      ]}
      primaryActionLabel="Generate Manual Invoice"
    />
  );
}
