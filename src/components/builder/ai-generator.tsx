"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { BoqCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { suggestBoqItems } from "@/ai/flows/ai-boq-item-suggestion";

interface AiGeneratorProps {
  onSuggest: (categories: BoqCategory[]) => void;
}

export function AiGenerator({ onSuggest }: AiGeneratorProps) {
  const [projectType, setProjectType] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (!projectType) return;
    setLoading(true);
    setError(null);
    try {
      const result = await suggestBoqItems({
        projectType,
        specifications: specifications || projectType
      });

      if (!result || !result.categories || result.categories.length === 0) {
        throw new Error("AI tidak menghasilkan kategori item. Coba dengan deskripsi lebih detail.");
      }

      const formattedCategories: BoqCategory[] = result.categories.map((cat: any, idx: number) => ({
        id: `cat-${Date.now()}-${idx}`,
        name: cat.name,
        items: cat.items.map((item: any, iIdx: number) => ({
          id: `item-${Date.now()}-${idx}-${iIdx}`,
          name: item.name,
          unit: item.unit || "Unit",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          type: item.type as 'perangkat' | 'jasa'
        }))
      }));

      onSuggest(formattedCategories);
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      const errorMsg = error.message || "Terjadi kesalahan pada AI";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Gagal Menghasilkan Saran",
        description: errorMsg,
      });
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
      >                      {loading ? (
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
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Gagal memanggil AI</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
        Didukung oleh AI Generatif Canggih
      </p>
    </div>
  );
}
