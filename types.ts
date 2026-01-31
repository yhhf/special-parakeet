
export enum DocumentType {
  INVOICE = 'Facture',
  DELIVERY_NOTE = 'Bon de Livraison',
  CONTRACT = 'Contrat',
  PROOF_OF_DELIVERY = 'Preuve de Livraison',
  OTHER = 'Autre'
}

export interface DocumentMetadata {
  id: string;
  date: string;
  companyName: string;
  amount?: string;
  documentReference?: string;
  summary: string;
  language: string;
}

export interface LogisticsDocument {
  id: string;
  fileName: string;
  fileType: string;
  base64Data: string;
  uploadDate: string;
  type: DocumentType;
  metadata: DocumentMetadata;
  fullText: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
}

export interface SearchResult {
  id: string;
  relevanceScore: number;
  reason: string;
}
