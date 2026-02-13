"use client";

import React, { useState, useEffect } from "react";
import { BoqTable } from "@/components/builder/boq-table";
import { AiGenerator } from "@/components/builder/ai-generator";
import { Button } from "@/components/ui/button";
import { BoqCategory, BoqItem, ProjectBoq } from "@/lib/types";
import { 
  Plus, 
  FileDown, 
  Save, 
  LayoutDashboard, 
  ChevronLeft,
  Settings,
  Printer,
  History,
  HardDrive,
  Wrench,
  Truck,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

export default function BuilderPage() {
  const [project, setProject] = useState<ProjectBoq>({
    id: `proj-${Date.now()}`,
    title: "Draft RAB Baru",
    type: "",
    specifications: "",
    categories: [],
    createdAt: new Date().toISOString(),
    clientName: "",
    documentNumber: `RAB/${new Date().getFullYear()}/001`,
    projectLocation: "",
    documentDate: new Date().toISOString().split('T')[0],
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  // Ensure user is signed in to satisfy security rules
  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));
    }
  }, [user, isUserLoading, auth]);

  const handleUpdateProjectInfo = (updates: Partial<ProjectBoq>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleAddCategory = (name = "Bagian Baru") => {
    const newCategory: BoqCategory = {
      id: `cat-${Date.now()}`,
      name: name,
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

  const handleAddItem = (categoryId: string, type: 'perangkat' | 'jasa' = 'perangkat') => {
    const newItem: BoqItem = {
      id: `item-${Date.now()}`,
      name: type === 'perangkat' ? "Item Perangkat Baru" : "Item Jasa Baru",
      unit: type === 'perangkat' ? "Unit" : "Lot",
      quantity: 1,
      unitPrice: 0,
      type: type,
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
      title: "Saran AI Diterapkan",
      description: `Berhasil menambahkan ${suggestedCategories.length} kategori pekerjaan baru.`,
    });
  };

  const handleSaveProject = async () => {
    if (!db || !user) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Anda harus masuk untuk menyimpan proyek.",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Align path with firestore.rules: /users/{userId}/projects/{projectId}
      const projectRef = doc(db, "users", user.uid, "projects", project.id);
      await setDoc(projectRef, {
        ...project,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Proyek Berhasil Disimpan",
        description: `Proyek "${project.title}" telah direkam di database.`,
      });
    } catch (error) {
      console.error("Gagal menyimpan proyek:", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan ke database.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    toast({
      title: "Mengekspor RAB",
      description: "Menyiapkan file PDF dan Excel...",
    });
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-px bg-border" />
          <input 
            className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 px-2 rounded min-w-[300px]"
            value={project.title}
            onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" /> Ekspor
          </Button>
          <Button 
            className="boq-accent-gradient h-9 text-white font-semibold"
            onClick={handleSaveProject}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Proyek
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r bg-white p-6 space-y-8 overflow-y-auto hidden lg:block">
          <AiGenerator onSuggest={handleAiSuggest} />
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tambah Cepat Kategori</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start border-dashed hover:border-primary" onClick={() => handleAddCategory("Perangkat & Hardware")}>
                <HardDrive className="h-4 w-4 mr-2 text-primary" /> Perangkat Utama
              </Button>
              <Button variant="outline" className="justify-start border-dashed hover:border-primary" onClick={() => handleAddCategory("Jasa Instalasi & Konfigurasi")}>
                <Wrench className="h-4 w-4 mr-2 text-accent" /> Jasa Instalasi
              </Button>
              <Button variant="outline" className="justify-start border-dashed hover:border-primary" onClick={() => handleAddCategory("Mobilisasi & Alat Kerja")}>
                <Truck className="h-4 w-4 mr-2 text-amber-500" /> Mobilisasi
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => handleAddCategory()}>
                <Plus className="h-4 w-4 mr-2" /> Bagian Kustom
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t space-y-2">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <History className="h-4 w-4 mr-2" /> Riwayat Versi
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <Printer className="h-4 w-4 mr-2" /> Pratinjau Cetak
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <Settings className="h-4 w-4 mr-2" /> Pengaturan Global
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            {project.categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
                <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center text-primary rotate-3">
                  <LayoutDashboard className="h-10 w-10 opacity-40" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-primary">Siap Menyusun RAB?</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Gunakan panel samping untuk menambah kategori perangkat dan jasa secara cepat, atau biarkan AI kami memberikan saran item yang relevan.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button size="lg" className="boq-accent-gradient h-12 px-8" onClick={() => handleAddCategory("Perangkat Utama")}>
                    <Plus className="h-5 w-5 mr-2" /> Mulai Input Manual
                  </Button>
                </div>
              </div>
            ) : (
              <BoqTable 
                project={project}
                onUpdateProjectInfo={handleUpdateProjectInfo}
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
