import { Quotation } from '@/types';

export const initialQuotations: Quotation[] = [
  {
    id: 'quote-001',
    quoteNumber: 'Q-2026-9042',
    version: 'v2.0',
    customerName: 'Sanjay Deshmukh (Procurement Lead)',
    company: 'Apex Heavy Engineering Ltd, Pune Plant',
    requestPrompt: 'We need 20 industrial motors, 7.5 kW, 415 V, IP55 with 1460 RPM speed and fast delivery.',
    createdAt: '2026-08-18 11:15 AM',
    validUntil: '2026-09-17',
    status: 'Validated',
    items: [
      {
        productId: 'prod-xyz-450',
        model: 'XYZ-450-IE3',
        description: 'Siemens 7.5 kW 4-Pole 3-Phase Induction Motor, 415V, 1460 RPM, IP55, Frame 132M',
        specSummary: '7.5 kW | 415 V | 1460 RPM | IP55 | IE3 Premium',
        quantity: 20,
        unitPriceINR: 39500,
        leadTimeDays: 4,
        subtotalINR: 790000,
        supplierSource: 'Siemens Direct Channel (Kalwa)',
        status: 'available'
      },
      {
        productId: 'prod-cpl-50',
        model: 'Lovejoy CP-50',
        description: 'Flexible Jaw Coupling for 38mm Motor Shaft to Pump Drive Hub',
        specSummary: '38mm Bore | 110 Nm Torque | Nitrile Spider',
        quantity: 20,
        unitPriceINR: 3200,
        leadTimeDays: 3,
        subtotalINR: 64000,
        supplierSource: 'Lovejoy Power Transmission',
        status: 'available'
      }
    ],
    subtotalINR: 854000,
    taxGST18: 153720,
    freightINR: 18500,
    totalINR: 1026220,
    validationNotes: [
      '✓ Supplier inventory verified: 45 units available in Kalwa hub (exceeds requested 20).',
      '✓ Price protected against active corporate rate agreement #AGR-2026-99.',
      '✓ Lead time confirmed: 4 business days to Pune industrial estate.',
      '✓ Technical spec checked against customer RFP requirements (100% parameter compliance).'
    ],
    history: [
      {
        version: 'v1.0',
        changedAt: '2026-08-18 09:30 AM',
        changeSummary: 'Initial automated draft generated for 20 units at legacy 5.5 kW spec (₹720,000 base).',
        user: 'AI Quote Automation Engine'
      },
      {
        version: 'v2.0',
        changedAt: '2026-08-18 11:15 AM',
        changeSummary: 'Updated motor model to 7.5 kW v2.0 spec and upgraded coupling from CP-40 to CP-50.',
        user: 'Sanjay Deshmukh (via AI Sales Assistant)'
      }
    ]
  }
];
