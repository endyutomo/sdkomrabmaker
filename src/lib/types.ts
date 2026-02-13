export interface BoqItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  type: 'perangkat' | 'jasa';
  suggestedPrice?: number;
  sourceUrl?: string;
}

export interface BoqCategory {
  id: string;
  name: string;
  items: BoqItem[];
}

export interface ProjectBoq {
  id: string;
  title: string;
  type: string;
  specifications: string;
  categories: BoqCategory[];
  createdAt: string;
  // Fields untuk Kop Surat
  clientName?: string;
  documentNumber?: string;
  projectLocation?: string;
  documentDate?: string;
}
