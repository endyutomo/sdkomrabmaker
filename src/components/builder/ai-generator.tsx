"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { BoqCategory } from "@/lib/types";

interface AiGeneratorProps {
  onSuggest: (categories: BoqCategory[]) => void;
}

export function AiGenerator({ onSuggest }: AiGeneratorProps) {
  const [projectType, setProjectType] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!projectType) return;
    setLoading(true);
    try {
      // @ts-ignore
      if (!window.puter) {
        throw new Error("Layanan Puter.js tidak tersedia. Coba refresh halaman.");
      }

      const currentDate = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const prompt = `
        Saya estimator konstruksi profesional. Buatkan daftar Rencana Anggaran Biaya (RAB) untuk proyek: "${projectType}".
        Spesifikasi/Kondisi: "${specifications || 'Standar umum'}".
        Konteks Waktu: ${currentDate}
        
        Instruksi Penting:
        1. HARGA WAJIB berdasarkan estimasi harga dari MULTIPLE MARKETPLACE TERPERCAYA:
           - Tokopedia (seller rating 4-5 bintang)
           - Shopee (seller rating 4-5 bintang)
           - Bukalapak (seller rating 4-5 bintang)
           - Lazada (seller rating 4-5 bintang)
        2. DETEKSI BRAND PREMIUM dalam spesifikasi item:
           - Networking: Belden, Commscope, AMP, Panduit (harga 3-10x dari generik)
           - Electrical: Broco, Schneider, ABB, Siemens (harga 2-5x dari generik)
           - Pipe: Rucika, Wavin, Pralon Premium (harga 1.5-3x dari generik)
           - Paint: Nippon, Dulux, Jotun, Avian (harga 2-4x dari generik)
           - Sanitary: TOTO, American Standard, Kohler (harga 2-5x dari generik)
        3. Jika BRAND PREMIUM terdeteksi: gunakan harga premium yang sesuai (maksimum dari range)
        4. Jika TIDAK ADA BRAND: gunakan harga TERTINGGI/MAKSIMUM untuk RAB yang aman dengan buffer
        5. Berikan RANGE HARGA (harga terendah dan tertinggi) dari seller terpercaya
        6. Fokus pada seller dengan rating tinggi (4-5 bintang) dan review positif
        7. Jangan memberikan link toko spesifik atau nama toko yang tidak valid
        8. Untuk material bangunan: sesuaikan harga dengan brand (premium vs generik)
        9. Untuk peralatan: gunakan harga sesuai brand dan kualitas
        10. Untuk jasa: gunakan standar upah profesional di Indonesia (${currentDate})
        11. Kelompokkan item pekerjaan ke dalam kategori logis
        12. Berikan estimasi volume yang realistis untuk proyek jenis ini
        13. Tentukan tipe item: "perangkat" (material/barang) atau "jasa" (upah/instalasi)
        14. Output WAJIB dalam format JSON murni array of objects

        Panduan Pricing Brand-Aware:
        - BRAND PREMIUM: Gunakan harga premium maksimum (contoh: Kabel Belden 305m = Rp 2.5 juta)
        - GENERIK/TANPA BRAND: Harga TERTINGGI dari marketplace (contoh: Kabel UTP Cat6 305m = Rp 500 ribu)
        - Jasa: Standar upah profesional Indonesia (update ${currentDate})
        - Pertimbangkan ongkir rata-rata untuk material
        - Gunakan harga maksimum untuk buffer keamanan RAB
        - Prioritaskan seller dengan banyak review positif

        PENTING: Jika item menyebutkan brand premium (Belden, Rucika, Nippon, TOTO, dll), WAJIB gunakan harga premium maksimum. Untuk item generik, gunakan harga tertinggi dari range untuk RAB yang aman!

        Format JSON Output:
        {
          "categories": [
            {
              "name": "Nama Kategori",
              "items": [
                {
                  "name": "Nama Item Pekerjaan",
                  "unit": "Satuan (m2/m3/unit/ls)",
                  "quantity": number,
                  "unitPrice": number (harga satuan estimasi pasaran yang wajar),
                  "type": "perangkat" | "jasa"
                }
              ]
            }
          ]
        }
      `;

      // @ts-ignore
      const response = await window.puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
      const text = response.message.content.trim().replace(/```json/g, '').replace(/```/g, '');
      const result = JSON.parse(text);

      const formattedCategories: BoqCategory[] = result.categories.map((cat: any, idx: number) => ({
        id: `cat-${Date.now()}-${idx}`,
        name: cat.name,
        items: cat.items.map((item: any, iIdx: number) => ({
          id: `item-${Date.now()}-${idx}-${iIdx}`,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          type: item.type as 'perangkat' | 'jasa'
        }))
      }));

      onSuggest(formattedCategories);
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      alert(`Gagal: ${error.message || "Terjadi kesalahan pada AI"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-primary/20 space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <Sparkles className="h-5 w-5 text-accent" />
        Penyusun RAB Berbasis AI
      </div>

      <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
        <div className="font-medium mb-1">💰 Estimasi Harga Teraman Multi-Marketplace</div>
        <div className="text-xs">
          AI memberikan estimasi harga <strong>tertinggi yang realistis</strong> dari <strong>Tokopedia, Shopee, Bukalapak, dan Lazada</strong> (seller rating 4-5 bintang) untuk RAB yang aman dengan buffer harga. Harga adalah perkiraan dan dapat berbeda dengan harga aktual. Disarankan untuk melakukan verifikasi harga langsung di marketplace terpercaya sebelum membeli.
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-type">Tipe Proyek</Label>
          <Input
            id="project-type"
            placeholder="misal: Villa Mewah, Jalan Tol, Renovasi Kantor"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specs">Persyaratan Khusus (Opsional)</Label>
          <Textarea
            id="specs"
            placeholder="Jelaskan spesifikasi seperti kondisi lahan, material yang diinginkan, atau jumlah lantai..."
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>

      <Button
        className="w-full boq-accent-gradient hover:opacity-90 text-white font-medium"
        onClick={handleSuggest}
        disabled={loading || !projectType}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Menghasilkan Item RAB...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Hasilkan Saran
          </>
        )}
      </Button>
      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
        Didukung oleh AI Generatif Canggih
      </p>
    </div>
  );
}
