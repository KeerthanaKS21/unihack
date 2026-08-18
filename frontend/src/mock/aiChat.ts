import { AIMessage } from '@/types';

export const initialSalesChatMessages: AIMessage[] = [
  {
    id: 'msg-001',
    sender: 'assistant',
    timestamp: '11:28 AM',
    text: 'Welcome to the AI Industrial Sales Assistant. I provide instant, hallucination-free technical guidance, procurement analysis, compatibility verification, and quotation generation grounded exclusively in your verified enterprise catalog data.',
    routedModule: 'Product Search'
  },
  {
    id: 'msg-002',
    sender: 'user',
    timestamp: '11:29 AM',
    text: 'Tell me about the XYZ-450 motor specifications and its recent version update.'
  },
  {
    id: 'msg-003',
    sender: 'assistant',
    timestamp: '11:29 AM',
    text: 'Here is the verified intelligence for **XYZ-450 Industrial 3-Phase Induction Motor** (Siemens):\n\n• **Rated Power**: 7.5 kW (Upgraded from 5.5 kW in v2.0 release)\n• **Rated Voltage**: 415 V AC 3-Phase 50 Hz\n• **Full Load Speed**: 1460 RPM (Formerly 1440 RPM)\n• **Ingress Protection**: IP55 Dust & Water-Jet protected\n• **Frame Size**: 132M (Gross Weight: 45 kg)\n• **Efficiency**: 91.2% (IE3 Premium Class)\n\n*Note*: 3 changes are currently pending synchronization sign-off, with 4 critical cross-domain impact notices flagged for review.',
    routedModule: 'Product Search',
    confidence: 0.99,
    sourceCitations: [
      {
        docName: 'technical_spec_2026.pdf',
        page: 1,
        snippet: 'Siemens XYZ-450 Severe-Duty 7.5 kW 415V 1460 RPM Induction Motor Specifications',
        verified: true
      },
      {
        docName: 'certificate.pdf',
        page: 1,
        snippet: 'TÜV Rheinland Certificate TUV-IND-2026-8841 IEC 60034-1 Conformity',
        verified: true
      }
    ],
    actionCard: {
      title: 'Review Version 2.0 Synchronization',
      label: 'Open Synchronization View',
      url: '/synchronization'
    }
  }
];

export const initialAskCatalogMessages: AIMessage[] = [
  {
    id: 'cat-msg-001',
    sender: 'assistant',
    timestamp: '11:20 AM',
    text: 'Ask Catalog AI is your zero-hallucination information retrieval engine. I explain technical values, trace original document provenance, and compare catalog revisions using verified citations.',
    routedModule: 'Catalog Exploration'
  },
  {
    id: 'cat-msg-002',
    sender: 'user',
    timestamp: '11:22 AM',
    text: 'Where did the 415 V rating for XYZ-450 come from, and why is there a conflict with the web storefront?'
  },
  {
    id: 'cat-msg-003',
    sender: 'assistant',
    timestamp: '11:22 AM',
    text: 'The 415 V specification is grounded in two authoritative enterprise sources:\n\n1. **OEM Technical Datasheet v2.0** (`technical_spec_2026.pdf`, Page 2, Section 3.1: "Rated Operating Voltage 415V AC ±10% 50Hz 3-Phase").\n2. **SAP Material Master Record** (`MAT-77092-XYZ450`, Voltage class 415V).\n\n**Origin of the Storefront 440 V Conflict**:\nThe B2B public website displayed 440 V due to a legacy regional marketing catalog template imported in 2023. AI Catalog Intelligence recommends accepting 415 V with 96% confidence and applying automated correction to the storefront.',
    routedModule: 'Catalog Exploration',
    confidence: 0.98,
    sourceCitations: [
      {
        docName: 'technical_spec_2026.pdf',
        page: 2,
        snippet: 'Electrical Parameters: 415V ±10% 50Hz 3-Phase Delta connection',
        verified: true
      },
      {
        docName: 'motor_specs.pdf',
        page: 1,
        snippet: 'Baseline 415V 50Hz electrical supply specification',
        verified: true
      }
    ],
    actionCard: {
      title: 'Resolve Voltage Conflict in Catalog Issues',
      label: 'Open Conflict Resolver',
      url: '/catalog-issues?filter=conflict'
    }
  }
];
