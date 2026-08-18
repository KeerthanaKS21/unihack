import { ProductChange } from '@/types';

export const mockProductChanges: ProductChange[] = [
  {
    id: 'chg-001',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    attribute: 'Rated Power',
    oldValue: '5.5 kW',
    newValue: '7.5 kW',
    detectedAt: '2026-08-18 10:45 AM',
    sourceDocument: 'technical_spec_2026.pdf (Page 1)',
    confidence: 0.99,
    status: 'pending'
  },
  {
    id: 'chg-002',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    attribute: 'Rated Speed',
    oldValue: '1440 RPM',
    newValue: '1460 RPM',
    detectedAt: '2026-08-18 10:45 AM',
    sourceDocument: 'technical_spec_2026.pdf (Page 2)',
    confidence: 0.98,
    status: 'pending'
  },
  {
    id: 'chg-003',
    productId: 'prod-xyz-450',
    productName: 'XYZ-450 Industrial Motor',
    attribute: 'Net Weight',
    oldValue: '42 kg',
    newValue: '45 kg',
    detectedAt: '2026-08-18 10:45 AM',
    sourceDocument: 'technical_spec_2026.pdf (Page 4)',
    confidence: 0.97,
    status: 'pending'
  }
];
