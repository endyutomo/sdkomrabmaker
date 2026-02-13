"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Printer,
  History,
  HardDrive,
  Wrench,
  Truck,
  Loader2,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function BuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdFromUrl = searchParams.get("id");

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
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();
  const { supabase, user, isLoading: isAuthLoading } = useSupabase();

  // Ensure user is signed in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      supabase.auth.signInAnonymously().catch(err => {
        console.error("Anonymous sign-in failed:", err);
        toast({
          variant: "destructive",
          title: "Autentikasi Gagal",
          description: "Gagal masuk secara anonim. Pastikan 'Anonymous Sign-ins' sudah diaktifkan di menu Authentication > Providers pada dashboard Supabase Anda.",
        });
      });
    }
  }, [user, isAuthLoading, supabase]);

  // Load project if ID is provided
  useEffect(() => {
    const loadProject = async () => {
      if (!supabase || !user || !projectIdFromUrl || isDataLoaded) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectIdFromUrl)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          // Map snake_case from DB to camelCase for state
          const mappedProject: ProjectBoq = {
            id: data.id,
            title: data.title,
            type: data.type || "",
            specifications: data.specifications || "",
            categories: data.categories || [],
            clientName: data.client_name || "",
            creatorName: data.creator_name || "",
            documentNumber: data.document_number || "",
            projectLocation: data.project_location || "",
            documentDate: data.document_date || "",
            createdAt: data.created_at
          };
          setProject(mappedProject);
          setIsDataLoaded(true);
        } else {
          toast({
            variant: "destructive",
            title: "Proyek Tidak Ditemukan",
            description: "Data proyek yang Anda cari tidak tersedia.",
          });
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error loading project:", error);
      }
    };

    if (user && supabase && projectIdFromUrl) {
      loadProject();
    }
  }, [supabase, user, projectIdFromUrl, isDataLoaded, router, toast]);

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
      margin: 0
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
    let currentUser = user;

    if (!supabase) return;

    // Try to sign in if not authenticated
    if (!currentUser) {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        if (data.user) {
          currentUser = data.user;
        }
      } catch (authError: any) {
        console.error("Auto-login failed:", authError);
        toast({
          variant: "destructive",
          title: "Gagal Masuk",
          description: "Gagal melakukan login otomatis. Pastikan fitur 'Anonymous Sign-ins' sudah diaktifkan di Supabase Dashboard (Authentication > Providers).",
        });
        return;
      }
    }

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Anda harus masuk untuk menyimpan proyek.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: currentUser.id,
          title: project.title,
          type: project.type,
          specifications: project.specifications,
          categories: project.categories,
          client_name: project.clientName,
          creator_name: project.creatorName,
          document_number: project.documentNumber,
          project_location: project.projectLocation,
          document_date: project.documentDate,
          created_at: project.createdAt, // Preserve creation time
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Supabase Save Error:", error);
        // Better error message for the user
        let message = "Terjadi kesalahan saat menyimpan ke database.";
        if (error.code === "42P01") {
          message = "Tabel 'projects' belum dibuat di Supabase. Silakan jalankan script SQL di walkthrough.md.";
        } else if (error.message) {
          message = error.message;
        }

        throw new Error(message);
      }

      toast({
        title: "Proyek Berhasil Disimpan",
        description: `Proyek "${project.title}" telah direkam di database SDKOM RAB MAker.`,
      });

      if (!projectIdFromUrl) {
        router.replace(`/builder?id=${project.id}`);
      }
    } catch (error: any) {
      console.error("Gagal menyimpan proyek:", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan ke database.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPdf = () => {
    // Memberikan jeda sedikit agar UI stabil sebelum dialog print muncul
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportExcel = () => {
    try {
      import("xlsx").then((XLSX) => {
        const wb = XLSX.utils.book_new();

        // Prepare data for Excel
        const data: any[] = [];

        // Header Info
        data.push(["Rencana Anggaran Biaya (RAB)"]);
        data.push([""]);
        data.push(["Nama Proyek", project.title]);
        data.push(["Klien", project.clientName]);
        data.push(["Lokasi", project.projectLocation]);
        data.push(["Nomor Dokumen", project.documentNumber]);
        data.push(["Tanggal", project.documentDate]);
        data.push(["Penyusun", project.creatorName]);
        data.push([""]);

        // Table Header
        data.push([
          "No",
          "Kategori / Item",
          "Spesifikasi",
          "Volume",
          "Satuan",
          "Harga Satuan (Rp)",
          "Total Harga (Rp)",
          "Tipe",
          "Vendor"
        ]);

        let grandTotal = 0;

        // Content
        project.categories.forEach((cat, catIdx) => {
          // Category Header
          data.push([
            (catIdx + 1).toString(),
            cat.name.toUpperCase(),
            "", "", "", "", "", "", ""
          ]);

          cat.items.forEach((item, itemIdx) => {
            const total = item.quantity * item.unitPrice; // Cost price (modal)
            // Note: In Excel usually we want the selling price if for client, or modal if for internal.
            // Let's assume Selling Price for RAB (Client facing)
            const margin = item.margin || 0;
            const sellingPrice = item.unitPrice * (1 + margin / 100);
            const totalSelling = item.quantity * sellingPrice;

            grandTotal += totalSelling;

            data.push([
              `${catIdx + 1}.${itemIdx + 1}`,
              item.name,
              "", // Specs usually mixed in name in this app, or could be separate if we had field
              item.quantity,
              item.unit,
              sellingPrice,
              totalSelling,
              item.type,
              item.vendorName
            ]);
          });

          // Category Subtotal
          const catTotal = cat.items.reduce((acc, item) => {
            const m = item.margin || 0;
            const sp = item.unitPrice * (1 + m / 100);
            return acc + (item.quantity * sp);
          }, 0);

          data.push(["", `Subtotal ${cat.name}`, "", "", "", "", catTotal, "", ""]);
          data.push([""]); // Spacer
        });

        data.push([""]);
        data.push(["", "TOTAL RAB", "", "", "", "", grandTotal, "", ""]);

        // Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Column Widths
        ws['!cols'] = [
          { wch: 5 },  // No
          { wch: 40 }, // Item
          { wch: 20 }, // Spec
          { wch: 10 }, // Vol
          { wch: 10 }, // Unit
          { wch: 15 }, // Price
          { wch: 15 }, // Total
          { wch: 10 }, // Type
          { wch: 20 }  // Vendor
        ];

        XLSX.utils.book_append_sheet(wb, ws, "RAB");

        // Save file
        const fileName = `RAB-${project.clientName || 'Draft'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast({
          title: "Ekspor Berhasil",
          description: `File ${fileName} telah diunduh.`,
        });
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        variant: "destructive",
        title: "Gagal Ekspor",
        description: "Terjadi kesalahan saat membuat file Excel.",
      });
    }
  };

  if (isAuthLoading || (projectIdFromUrl && !isDataLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium animate-pulse">Memuat data SDKOM RAB MAker...</p>
        </div>
      </div>
    );
  }

  // Sidebar Component for reuse in Desktop and Mobile
  const SidebarContent = () => (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2">
        <AiGenerator onSuggest={handleAiSuggest} />

        <div className="space-y-4 mt-8">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tambah Cepat Kategori</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="justify-start border-dashed hover:border-primary font-bold w-full" onClick={() => handleAddCategory("Perangkat & Hardware")}>
              <HardDrive className="h-4 w-4 mr-2 text-primary" /> Perangkat Utama
            </Button>
            <Button variant="outline" className="justify-start border-dashed hover:border-primary font-bold w-full" onClick={() => handleAddCategory("Jasa Instalasi & Konfigurasi")}>
              <Wrench className="h-4 w-4 mr-2 text-accent" /> Jasa Instalasi
            </Button>
            <Button variant="outline" className="justify-start border-dashed hover:border-primary font-bold w-full" onClick={() => handleAddCategory("Mobilisasi & Alat Kerja")}>
              <Truck className="h-4 w-4 mr-2 text-amber-500" /> Mobilisasi
            </Button>
            <Button variant="outline" className="justify-start font-bold w-full" onClick={() => handleAddCategory()}>
              <Plus className="h-4 w-4 mr-2" /> Bagian Kustom
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t space-y-2">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground font-bold">
            <LayoutDashboard className="h-4 w-4 mr-2" /> Proyek Saya
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground font-bold" onClick={handlePrintPdf}>
          <Printer className="h-4 w-4 mr-2" /> Pratinjau Cetak
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[350px]">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left flex items-center gap-2">
                    <Logo className="h-6 w-6" />
                    Menu RAB Maker
                  </SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/dashboard" className="hidden lg:block">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-px bg-border hidden lg:block" />
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo className="h-8 w-8 hidden sm:block" />
            <input
              className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 px-2 rounded w-full lg:min-w-[300px] text-primary truncate"
              value={project.title}
              onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <FileDown className="h-4 w-4 mr-2" /> Ekspor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden">
                <FileDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handlePrintPdf} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-red-500" /> Simpan sebagai PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Ekspor ke Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="boq-accent-gradient h-9 text-white font-bold hidden sm:flex"
            onClick={handleSaveProject}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
          <Button
            className="boq-accent-gradient h-9 w-9 p-0 text-white font-bold sm:hidden"
            onClick={handleSaveProject}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-80 border-r bg-white p-6 hidden lg:block no-print overflow-y-auto h-[calc(100vh-64px)]">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-12 bg-slate-50/50 print:p-0 print:bg-white w-full">
          <div className="max-w-6xl mx-auto">
            {project.categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up no-print px-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary/5 rounded-2xl flex items-center justify-center text-primary rotate-3">
                  <Logo className="h-8 w-8 lg:h-10 lg:w-10 opacity-40" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl lg:text-2xl font-bold text-primary">Siap Menyusun RAB?</h2>
                  <p className="text-muted-foreground text-sm lg:text-base max-w-sm">
                    Gunakan panel samping (atau menu di HP) untuk menambah kategori perangkat dan jasa secara cepat, atau biarkan AI SDKOM RAB MAker memberikan saran item yang relevan.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button size="lg" className="boq-accent-gradient h-12 px-8 font-bold" onClick={() => handleAddCategory("Perangkat Utama")}>
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
