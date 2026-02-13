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
        Saya estimator konstruksi. Buatkan daftar Rencana Anggaran Biaya (RAB) untuk proyek: "${projectType}".
        Spesifikasi/Kondisi: "${specifications || 'Standar umum'}".
        Konteks Waktu: ${currentDate}
        
        Instruksi:
        1. Kelompokkan item pekerjaan ke dalam kategori logis (misal: "Pekerjaan Persiapan", "Pekerjaan Pondasi", "Pekerjaan Lantai", dll).
        2. Berikan estimasi volume dan harga satuan yang WAJAR dan TERUPDATE untuk wilayah Indonesia (Rupiah) per ${currentDate}.
        3. Tentukan tipe item: "perangkat" (material/barang) atau "jasa" (upah/instalasi).
        4. Output WAJIB dalam format JSON murni array of objects.

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
                  "unitPrice": number (harga satuan),
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
