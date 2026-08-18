import { TechnicalCompatibilityCheck } from '@/types';

export const mockCompatibilityChecks: TechnicalCompatibilityCheck[] = [
  {
    id: 'compat-001',
    primaryProductId: 'prod-xyz-450',
    targetProductId: 'prod-abc-100',
    primaryName: 'XYZ-450 Industrial Motor (7.5 kW v2.0)',
    targetName: 'Schneider ABC-100 VFD Controller (5.5 kW Max)',
    targetCategory: 'Motor Drives & Inverters',
    status: 'Incompatible',
    compatibilityScore: 0.42,
    affectedByRecentChange: true,
    relationshipChain: ['Motor (XYZ-450)', 'VFD Controller (ABC-100)', 'Pump (P-200)', 'Coupling (CP-50)'],
    explanation: 'CRITICAL CAPACITY MISMATCH: XYZ-450 was upgraded to 7.5 kW (15.2 A full load). Controller ABC-100 is rated strictly for 5.5 kW (12.5 A continuous). Operating under full mechanical load will trip drive overcurrent protection (Err-OC3).',
    checks: [
      {
        parameter: 'Supply Voltage Rating',
        primaryValue: '415 V (3-Phase 50 Hz)',
        targetValue: '380 - 460 V AC (3-Phase)',
        passed: true,
        notes: 'Voltage band compatible within ±10% utility tolerances.'
      },
      {
        parameter: 'Continuous Power Capacity',
        primaryValue: '7.5 kW (Upgraded from 5.5 kW)',
        targetValue: '5.5 kW Max Continuous',
        passed: false,
        notes: 'FAILURE: Controller undersized by 2.0 kW (26.7% overload).'
      },
      {
        parameter: 'Full Load Current (FLC)',
        primaryValue: '15.2 Amps',
        targetValue: '12.5 Amps Rated Out',
        passed: false,
        notes: 'FAILURE: Motor rated current exceeds drive continuous thermal limit.'
      },
      {
        parameter: 'Speed / Frequency Control',
        primaryValue: '1460 RPM (50 Hz)',
        targetValue: '0 - 3000 RPM (0 - 400 Hz V/f)',
        passed: true,
        notes: 'Speed modulation range fully supported by inverter PWM.'
      },
      {
        parameter: 'Control Interface & Bus',
        primaryValue: 'Terminal Block (U1, V1, W1, PE)',
        targetValue: 'Modbus RTU / Hardwired I/O',
        passed: true,
        notes: 'Standard 3-wire motor power termination.'
      }
    ]
  },
  {
    id: 'compat-002',
    primaryProductId: 'prod-xyz-450',
    targetProductId: 'prod-pump-200',
    primaryName: 'XYZ-450 Industrial Motor (7.5 kW v2.0)',
    targetName: 'Kirloskar P-200 Centrifugal Slurry Pump',
    targetCategory: 'Industrial Pumps',
    status: 'Compatible',
    compatibilityScore: 0.98,
    affectedByRecentChange: true,
    relationshipChain: ['Motor (XYZ-450)', 'Coupling (CP-50)', 'Pump (P-200)'],
    explanation: 'EXCELLENT COMPATIBILITY: P-200 pump hydraulic performance curve demands 7.2 kW shaft input at 1450 RPM. Upgraded XYZ-450 (7.5 kW, 1460 RPM) provides optimal torque reserve with 4.1% safety margin.',
    checks: [
      {
        parameter: 'Shaft Power Requirement',
        primaryValue: '7.5 kW Output',
        targetValue: '6.0 - 7.5 kW Absorbed Power',
        passed: true,
        notes: 'Delivers rated hydraulic flow without motor overload.'
      },
      {
        parameter: 'Operating Rotational Speed',
        primaryValue: '1460 RPM Full Load',
        targetValue: '1450 - 1500 RPM Rated Head',
        passed: true,
        notes: 'Speed synchronizes precisely with pump impeller duty point.'
      },
      {
        parameter: 'Mounting Alignment',
        primaryValue: 'B3 Foot Mount (132M Frame)',
        targetValue: 'Universal Baseplate Bed',
        passed: true,
        notes: 'Center height 132 mm aligns with pump suction centerline.'
      }
    ]
  },
  {
    id: 'compat-003',
    primaryProductId: 'prod-xyz-450',
    targetProductId: 'prod-cpl-50',
    primaryName: 'XYZ-450 Industrial Motor (7.5 kW v2.0)',
    targetName: 'Lovejoy CP-50 Flexible Jaw Coupling',
    targetCategory: 'Power Transmission & Couplings',
    status: 'Compatible',
    compatibilityScore: 0.96,
    affectedByRecentChange: true,
    relationshipChain: ['Motor (XYZ-450)', 'Coupling (CP-50)', 'Driven Load'],
    explanation: 'COMPATIBLE: 38mm bore matches the 132M frame motor shaft diameter. Torque rating of 110 Nm accommodates 7.5 kW starting torque.',
    checks: [
      {
        parameter: 'Bore Diameter',
        primaryValue: '38 mm Shaft (Frame 132M)',
        targetValue: '38 mm Pilot Bore / Keyway',
        passed: true,
        notes: 'Direct slide-fit with standard DIN 6885 keyway.'
      },
      {
        parameter: 'Nominal Torque Rating',
        primaryValue: '49.1 Nm Rated (110 Nm Max)',
        targetValue: '120 Nm Max Dynamic Torque',
        passed: true,
        notes: 'Service factor 2.4 exceeds standard 1.5 pump duty factor.'
      }
    ]
  },
  {
    id: 'compat-004',
    primaryProductId: 'prod-xyz-450',
    targetProductId: 'prod-cpl-40',
    primaryName: 'XYZ-450 Industrial Motor (7.5 kW v2.0)',
    targetName: 'Lovejoy CP-40 Legacy Flexible Coupling',
    targetCategory: 'Power Transmission & Couplings',
    status: 'Incompatible',
    compatibilityScore: 0.35,
    affectedByRecentChange: true,
    relationshipChain: ['Motor (XYZ-450)', 'Coupling (CP-40) [OBSOLETE]'],
    explanation: 'BORE & TORQUE MISMATCH: CP-40 was configured for previous 5.5 kW version (Frame 132S, 28mm shaft). The new 7.5 kW motor has a 38mm shaft and cannot be mounted into CP-40.',
    checks: [
      {
        parameter: 'Shaft Bore Dimension',
        primaryValue: '38 mm (Frame 132M)',
        targetValue: '28 mm Max Bore (CP-40)',
        passed: false,
        notes: 'FAILURE: Physical interference; bore undersized by 10mm.'
      },
      {
        parameter: 'Torque Rating Limit',
        primaryValue: '49.1 Nm Full Load',
        targetValue: '45 Nm Peak Limit',
        passed: false,
        notes: 'FAILURE: Coupling elastomer insert risks shearing under start.'
      }
    ]
  }
];
