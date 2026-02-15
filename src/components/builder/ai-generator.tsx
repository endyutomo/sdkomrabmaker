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
        1. HARGA WAJIB berdasarkan data marketplace Indonesia (Tokopedia, Bukalapak, Shopee) dari toko dengan rating 4-5 bintang
        2. Jangan gunakan harga terendah (murah/tidak berkualitas) atau harga tertinggi (overprice)
        3. Gunakan harga rata-rata dari penjual terpercaya dengan rating 4-5 bintang
        4. Kelompokkan item pekerjaan ke dalam kategori logis (misal: "Pekerjaan Persiapan", "Pekerjaan Pondasi", "Pekerjaan Lantai", dll)
        5. Berikan estimasi volume yang realistis untuk proyek jenis ini
        6. Tentukan tipe item: "perangkat" (material/barang) atau "jasa" (upah/instalasi)
        7. Output WAJIB dalam format JSON murni array of objects

        Panduan Pricing:
        - Material: Harga dari toko bangunan online terpercaya (rating 4-5 bintang)
        - Jasa: Harga pasaran tukang profesional di Indonesia (bukan yang termurah)
        - Include biaya transport dan handling untuk material
        - Untuk jasa, gunakan upah harian tukang bersertifikat/berpengalaman

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
                  "unitPrice": number (harga satuan reasonable dari marketplace 4-5 bintang),
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

      <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
        <div className="font-medium mb-1">💡 Harga Berdasarkan Marketplace</div>
        <div className="text-xs">
          AI akan memberikan harga yang wajar berdasarkan data dari toko bangunan online dengan rating 4-5 bintang (Tokopedia, Bukalapak, Shopee). Harga tidak terlalu murah (kualitas rendah) dan tidak terlalu tinggi (overprice).
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
