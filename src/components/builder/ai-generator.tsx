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
      // Static sample data untuk sementara (menghindari error API)
      const sampleData = {
        categories: [
          {
            name: "Pekerjaan Persiapan",
            items: [
              {
                name: "Pembersihan Lokasi",
                unit: "m2",
                quantity: 100,
                unitPrice: 15000,
                type: "jasa"
              }
            ]
          },
          {
            name: "Material Dasar",
            items: [
              {
                name: "Semen Portland",
                unit: "sak",
                quantity: 50,
                unitPrice: 65000,
                type: "perangkat"
              },
              {
                name: "Pasir Urug",
                unit: "m3",
                quantity: 10,
                unitPrice: 180000,
                type: "perangkat"
              }
            ]
          }
        ]
      };

      const formattedCategories: BoqCategory[] = sampleData.categories.map((cat: any, idx: number) => ({
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
        <div className="font-medium mb-1">💰 Estimasi Harga Pasaran</div>
        <div className="text-xs">
          AI memberikan estimasi harga berdasarkan pasaran umum marketplace. Harga adalah perkiraan dan dapat berbeda dengan harga aktual. Disarankan untuk melakukan verifikasi harga langsung di toko terpercaya sebelum membeli.
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
