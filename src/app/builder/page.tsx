"use client";

import React, { useState, useEffect } from "react";
import { BoqTable } from "@/components/builder/boq-table";
import { AiGenerator } from "@/components/builder/ai-generator";
import { Button } from "@/components/ui/button";
import { BoqCategory, BoqItem, ProjectBoq } from "@/lib/types";
import { 
  Plus, 
  FileDown, 
  FileUp, 
  Save, 
  LayoutDashboard, 
  ChevronLeft,
  Settings,
  Printer,
  History
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function BuilderPage() {
  const [project, setProject] = useState<ProjectBoq>({
    id: "draft",
    title: "Proyek Tanpa Judul",
    type: "",
    specifications: "",
    categories: [],
    createdAt: new Date().toISOString(),
  });
  
  const { toast } = useToast();

  const handleAddCategory = () => {
    const newCategory: BoqCategory = {
      id: `cat-${Date.now()}`,
      name: "Bagian Baru",
      items: [],
    };
    setProject(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const handleUpdateCategory = (categoryId: string, updates: Partial<BoqCategory>) => {
    setProject(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === categoryId ? { ...c, ...updates } : c)
    }));
  };

  const handleUpdateItem = (categoryId: string, itemId: string, updates: Partial<BoqItem>) => {
    setProject(prev => ({
      ...prev,
      categories: prev.categories.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: c.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
          };
        }
        return c;
      })
    }));
  };

  const handleAddItem = (categoryId: string) => {
    const newItem: BoqItem = {
      id: `item-${Date.now()}`,
      name: "Item Pekerjaan Baru",
      unit: "m2",
      quantity: 1,
      unitPrice: 0,
    };
    setProject(prev => ({
      ...prev,
      categories: prev.categories.map(c => {
        if (c.id === categoryId) {
          return { ...c, items: [...c.items, newItem] };
        }
        return c;
      })
    }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setProject(prev => ({
      ...prev,
      categories: prev.categories.map(c => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter(i => i.id !== itemId) };
        }
        return c;
      })
    }));
  };

  const handleDeleteCategory = (categoryId: string) => {
    setProject(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== categoryId)
    }));
  };

  const handleAiSuggest = (suggestedCategories: BoqCategory[]) => {
    setProject(prev => ({
      ...prev,
      categories: [...prev.categories, ...suggestedCategories]
    }));
    toast({
      title: "Berhasil",
      description: `Menambahkan ${suggestedCategories.length} bagian dari saran AI.`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Ekspor Dimulai",
      description: "Laporan RAB Anda sedang dibuat...",
    });
    // Implementation for CSV/Excel/PDF would go here
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-px bg-border" />
          <div>
            <input 
              className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 px-2 rounded"
              value={project.title}
              onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" /> Ekspor
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Printer className="h-4 w-4 mr-2" /> Cetak
          </Button>
          <Button className="boq-accent-gradient h-9">
            <Save className="h-4 w-4 mr-2" /> Simpan Proyek
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 border-r bg-white p-6 space-y-8 overflow-y-auto hidden lg:block">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kotak Peralatan</h3>
            <AiGenerator onSuggest={handleAiSuggest} />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tindakan Cepat</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start" onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Bagian
              </Button>
              <Button variant="outline" className="justify-start">
                <FileUp className="h-4 w-4 mr-2" /> Impor Template
              </Button>
              <Button variant="outline" className="justify-start">
                <History className="h-4 w-4 mr-2" /> Riwayat Versi
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="h-4 w-4 mr-2" /> Pengaturan RAB
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-5xl mx-auto">
            {project.categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                  <LayoutDashboard className="h-12 w-12 opacity-50" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Mulai Susun RAB Anda</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Tambah bagian secara manual atau gunakan penyusun AI kami untuk menghasilkan saran berdasarkan tipe proyek Anda.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button size="lg" onClick={handleAddCategory}>
                    <Plus className="h-5 w-5 mr-2" /> Tambah Bagian Pertama
                  </Button>
                  <div className="lg:hidden">
                     <Button size="lg" variant="outline" className="boq-accent-gradient text-white border-none">
                       <Sparkles className="h-5 w-5 mr-2" /> Gunakan Penyusun AI
                     </Button>
                  </div>
                </div>
              </div>
            ) : (
              <BoqTable 
                categories={project.categories}
                onUpdateCategory={handleUpdateCategory}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onAddItem={handleAddItem}
                onDeleteCategory={handleDeleteCategory}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
