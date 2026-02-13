export interface BoqItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Harga Dasar / Modal
  margin?: number;    // Persentase Margin (%)
  type: 'perangkat' | 'jasa';
  suggestedPrice?: number;
  sourceUrl?: string;
  vendorName?: string;
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
  creatorName?: string; // Penambahan kolom Pembuat RAB
  documentNumber?: string;
  projectLocation?: string;
  documentDate?: string;
}
