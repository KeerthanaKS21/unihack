import { AIMessage } from '@/types';

export const initialSalesChatMessages: AIMessage[] = [
  {
    id: 'msg-001',
    sender: 'assistant',
    timestamp: 'Just now',
    text: 'Welcome to the AI Industrial Sales Assistant. I provide instant, hallucination-free technical guidance, procurement analysis, compatibility verification, and quotation generation grounded exclusively in your verified enterprise catalog data.',
    routedModule: 'Product Search'
  }
];

export const initialAskCatalogMessages: AIMessage[] = [
  {
    id: 'cat-msg-001',
    sender: 'assistant',
    timestamp: 'Just now',
    text: 'Ask Catalog AI is your zero-hallucination information retrieval engine. I explain technical values, trace original document provenance, and compare catalog revisions using verified citations.',
    routedModule: 'Catalog Exploration'
  }
];
