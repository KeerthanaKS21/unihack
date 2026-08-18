import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: 'prod-xyz-450',
    model: 'XYZ-450',
    name: 'XYZ-450 Industrial 3-Phase Induction Motor',
    manufacturer: 'Siemens Industrial Automation',
    category: 'Electric Motors / Induction Motors',
    currentVersion: 'v2.0 (2026)',
    previousVersion: 'v1.4 (2024)',
    confidence: 0.98,
    healthScore: 88,
    status: 'review_required',
    description: 'Heavy-duty 3-phase cast-iron induction motor engineered for continuous severe-duty industrial drive applications including pumps, compressors, conveyors, and fans.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    changesDetected: 3,
    impactsPending: 4,
    sourceDocumentIds: ['doc-001', 'doc-002', 'doc-003'],
    specs: {
      power: '7.5 kW',
      voltage: '415 V',
      speed: '1460 RPM',
      frequency: '50 Hz',
      ipRating: 'IP55',
      weight: '45 kg',
      efficiency: '91.2% (IE3 Premium)',
      mountType: 'Foot & Flange (B35)',
      frameSize: '132M',
      insulationClass: 'Class F (Temp Rise B)',
      operatingTemp: '-20°C to +50°C',
      certifications: ['IEC 60034-1', 'CE', 'RoHS 3', 'IS 12615']
    },
    previousSpecs: {
      power: '5.5 kW',
      voltage: '415 V',
      speed: '1440 RPM',
      frequency: '50 Hz',
      ipRating: 'IP55',
      weight: '42 kg',
      efficiency: '89.6% (IE2 High)',
      mountType: 'Foot (B3)',
      frameSize: '132S',
      insulationClass: 'Class F',
      operatingTemp: '-20°C to +40°C',
      certifications: ['IEC 60034-1', 'CE']
    },
    versions: [
      {
        version: 'v2.0',
        releaseDate: '2026-08-18',
        specs: {
          power: '7.5 kW',
          voltage: '415 V',
          speed: '1460 RPM',
          frequency: '50 Hz',
          ipRating: 'IP55',
          weight: '45 kg',
          efficiency: '91.2%'
        },
        sourceDocId: 'doc-002',
        sourceDocName: 'technical_spec_2026.pdf',
        verifiedBy: 'AI Ingestion Engine + Pending Human Signoff',
        status: 'draft'
      },
      {
        version: 'v1.4',
        releaseDate: '2024-03-15',
        specs: {
          power: '5.5 kW',
          voltage: '415 V',
          speed: '1440 RPM',
          frequency: '50 Hz',
          ipRating: 'IP55',
          weight: '42 kg',
          efficiency: '89.6%'
        },
        sourceDocId: 'doc-001',
        sourceDocName: 'motor_specs.pdf',
        verifiedBy: 'Dr. Rajesh Nair (Chief Lead Engineer)',
        status: 'verified'
      }
    ]
  },
  {
    id: 'prod-abc-100',
    model: 'ABC-100',
    name: 'ABC-100 Variable Frequency Drive / Speed Controller',
    manufacturer: 'Schneider Electric',
    category: 'Motor Drives & Inverters',
    currentVersion: 'v3.1',
    previousVersion: 'v3.0',
    confidence: 0.99,
    healthScore: 96,
    status: 'synchronized',
    description: 'High-precision sensorless vector drive inverter configured for induction motors up to 5.5 kW rating at 415 V 3-phase input.',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    changesDetected: 0,
    impactsPending: 0,
    sourceDocumentIds: ['doc-004'],
    specs: {
      power: '5.5 kW Max (Overload 120%)',
      voltage: '380 - 460 V AC 3-Phase',
      speed: '0 - 3000 RPM Control Range',
      frequency: '50/60 Hz ±5%',
      ipRating: 'IP20 (Cabinet Mount)',
      weight: '6.8 kg',
      efficiency: '97.8%',
      mountType: 'DIN Rail / Panel Wall Mount',
      operatingTemp: '-10°C to +50°C'
    },
    previousSpecs: {
      power: '5.5 kW Max',
      voltage: '380 - 460 V AC',
      speed: '0 - 3000 RPM',
      frequency: '50/60 Hz',
      ipRating: 'IP20',
      weight: '6.8 kg'
    },
    versions: []
  },
  {
    id: 'prod-pump-200',
    model: 'P-200-CENTRI',
    name: 'P-200 High-Head Centrifugal Slurry Pump',
    manufacturer: 'Kirloskar Brothers Limited',
    category: 'Industrial Pumps',
    currentVersion: 'v1.2',
    previousVersion: 'v1.0',
    confidence: 0.94,
    healthScore: 92,
    status: 'active',
    description: 'End suction centrifugal water and slurry pump with closed cast bronze impeller, sized for 6-8 kW motor coupling.',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    changesDetected: 0,
    impactsPending: 0,
    sourceDocumentIds: ['doc-005'],
    specs: {
      power: 'Required 7.5 kW at 1450 RPM',
      voltage: 'N/A (Mechanical Input)',
      speed: '1450 - 1500 RPM',
      frequency: 'N/A',
      ipRating: 'IP68 Wetted End',
      weight: '84 kg',
      mountType: 'Baseplate Bed'
    },
    previousSpecs: {
      power: 'Required 5.5 - 7.5 kW',
      voltage: 'N/A',
      speed: '1440 RPM',
      frequency: 'N/A',
      ipRating: 'IP68',
      weight: '82 kg'
    },
    versions: []
  },
  {
    id: 'prod-weg-w22',
    model: 'W22-IE4-7.5',
    name: 'WEG W22 Super Premium IE4 Industrial Motor',
    manufacturer: 'WEG Industries',
    category: 'Electric Motors / Induction Motors',
    currentVersion: 'v2.2',
    previousVersion: 'v2.1',
    confidence: 0.97,
    healthScore: 95,
    status: 'synchronized',
    description: 'Cast iron frame IE4 Super Premium efficiency 3-phase motor with high thermal reserve and severe-duty bearings.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    changesDetected: 0,
    impactsPending: 0,
    sourceDocumentIds: ['doc-006'],
    specs: {
      power: '7.5 kW',
      voltage: '415 V',
      speed: '1465 RPM',
      frequency: '50 Hz',
      ipRating: 'IP55 (Optional IP66)',
      weight: '48 kg',
      efficiency: '92.6% (IE4 Super Premium)',
      frameSize: '132M'
    },
    previousSpecs: {
      power: '7.5 kW',
      voltage: '415 V',
      speed: '1465 RPM',
      frequency: '50 Hz',
      ipRating: 'IP55',
      weight: '48 kg'
    },
    versions: []
  },
  {
    id: 'prod-abb-m3bp',
    model: 'M3BP-132SMA',
    name: 'ABB Process Performance Cast Iron Motor',
    manufacturer: 'ABB Ltd',
    category: 'Electric Motors / Induction Motors',
    currentVersion: 'v4.0',
    previousVersion: 'v3.8',
    confidence: 0.98,
    healthScore: 94,
    status: 'synchronized',
    description: 'Process performance motor engineered for mining, chemical, and heavy processing environments.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    changesDetected: 0,
    impactsPending: 0,
    sourceDocumentIds: ['doc-007'],
    specs: {
      power: '7.5 kW',
      voltage: '415 V',
      speed: '1458 RPM',
      frequency: '50 Hz',
      ipRating: 'IP56 Severe Duty',
      weight: '49 kg',
      efficiency: '91.8% (IE3)',
      frameSize: '132S'
    },
    previousSpecs: {
      power: '7.5 kW',
      voltage: '415 V',
      speed: '1455 RPM',
      frequency: '50 Hz',
      ipRating: 'IP55',
      weight: '49 kg'
    },
    versions: []
  }
];
