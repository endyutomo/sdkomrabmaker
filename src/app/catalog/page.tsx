"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { Logo } from "@/components/ui/logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import {
  Loader2,
  Search,
  Package,
  UserCog,
  Clock,
  Store,
  Trash2,
  Edit3,
  Plus,
  ExternalLink,
  BookTemplate,
  AlertTriangle,
  Settings,
  LogOut,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  unit_price: number;
  type: "perangkat" | "jasa";
  vendor_name?: string;
  last_used?: string;
  model_type?: string;
  image_url?: string;
  created_at?: string;
  user_id?: string;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export default function CatalogPage() {
  const router = useRouter();
  const { supabase, user, isLoading: isAuthLoading } = useSupabase();
  const { toast } = useToast();

  // Auth check
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push("/auth");
        return;
      }
      const email = user.email;
      if (!email?.endsWith("@sdkom.co.id")) {
        toast({
          variant: "destructive",
          title: "Email Tidak Diizinkan",
          description: "Hanya email dengan domain @sdkom.co.id yang dapat mengakses halaman ini.",
        });
        supabase.auth.signOut();
        router.push("/auth");
      }
    }
  }, [user, isAuthLoading, supabase, router, toast]);

  // Data state
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Edit dialog
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    unit: "",
    unit_price: 0,
    type: "perangkat" as "perangkat" | "jasa",
    vendor_name: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [deleteItem, setDeleteItem] = useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch catalog items
  const fetchItems = useCallback(async () => {
    if (!supabase || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("historical_boq_items")
        .select("*")
        .eq("user_id", user.id)
        .order("last_used", { ascending: false, nullsFirst: false });

      if (queryError) {
        if (queryError.code === "42P01" || queryError.message?.includes("relation")) {
          setItems([]);
          setError("Tabel 'historical_boq_items' belum ada di database. Buat tabel terlebih dahulu.");
          return;
        }
        throw queryError;
      }

      setItems(data || []);
    } catch (err: any) {
      console.error("Error fetching catalog:", err);
      setError(err.message || "Gagal memuat katalog.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.vendor_name || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterType !== "all" && item.type !== filterType) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on search/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  // Open edit dialog
  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      unit: item.unit,
      unit_price: item.unit_price,
      type: item.type,
      vendor_name: item.vendor_name || "",
    });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!supabase || !editingItem || !editForm.name.trim()) return;

    setIsSaving(true);
    try {
      const newId = editForm.name.toLowerCase().trim().replace(/\s+/g, "-");

      const { error: updateError } = await supabase
        .from("historical_boq_items")
        .upsert({
          id: newId,
          user_id: user?.id,
          name: editForm.name.trim(),
          unit: editForm.unit,
          unit_price: editForm.unit_price,
          type: editForm.type,
          vendor_name: editForm.vendor_name.trim(),
          last_used: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // If ID changed, delete old record
      if (newId !== editingItem.id) {
        await supabase
          .from("historical_boq_items")
          .delete()
          .eq("id", editingItem.id)
          .eq("user_id", user?.id);
      }

      toast({
        title: "Item Diperbarui",
        description: `"${editForm.name}" berhasil disimpan.`,
      });

      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: err.message || "Terjadi kesalahan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!supabase || !deleteItem) return;

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("historical_boq_items")
        .delete()
        .eq("id", deleteItem.id)
        .eq("user_id", user?.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Item Dihapus",
        description: `"${deleteItem.name}" telah dihapus dari katalog.`,
      });

      setDeleteItem(null);
      fetchItems();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus",
        description: err.message || "Terjadi kesalahan.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      import("xlsx").then((XLSX) => {
        const wb = XLSX.utils.book_new();
        const rows: any[] = [];

        // Header row
        rows.push([
          "No",
          "Nama Item",
          "Tipe",
          "Satuan",
          "Harga Satuan (Rp)",
          "Vendor",
          "Model Type",
          "Terakhir Dipakai",
        ]);

        // Data rows
        items.forEach((item, index) => {
          rows.push([
            index + 1,
            item.name,
            item.type === "perangkat" ? "Perangkat" : "Jasa",
            item.unit || "",
            item.unit_price,
            item.vendor_name || "",
            item.model_type || "",
            item.last_used
              ? format(parseISO(item.last_used), "dd/MM/yyyy")
              : "",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Column widths
        ws["!cols"] = [
          { wch: 5 },
          { wch: 45 },
          { wch: 12 },
          { wch: 10 },
          { wch: 18 },
          { wch: 25 },
          { wch: 20 },
          { wch: 15 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Katalog Item");

        const fileName = `Katalog-Item-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast({
          title: "Ekspor Berhasil",
          description: `File ${fileName} telah diunduh (${items.length} item).`,
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

  // Import from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportDialogOpen(true);
    setImportResults(null);

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      if (json.length === 0) {
        throw new Error("File Excel kosong atau format tidak dikenali.");
      }

      let success = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < json.length; i++) {
        const row = json[i];

        // Try to find the name column (case-insensitive)
        const name =
          row["Nama Item"] ||
          row["nama item"] ||
          row["NAMA ITEM"] ||
          row["Item"] ||
          row["item"] ||
          row["name"] ||
          row["Name"] ||
          "";

        if (!name || !name.toString().trim()) {
          skipped++;
          continue;
        }

        const typeRaw =
          row["Tipe"] ||
          row["tipe"] ||
          row["type"] ||
          row["Type"] ||
          "";
        const type =
          typeRaw.toString().toLowerCase().trim() === "jasa"
            ? "jasa"
            : "perangkat";

        const unit =
          row["Satuan"] ||
          row["satuan"] ||
          row["unit"] ||
          row["Unit"] ||
          "";

        // Parse price from various column names
        const priceRaw =
          row["Harga Satuan (Rp)"] ||
          row["harga satuan"] ||
          row["Harga Satuan"] ||
          row["Harga"] ||
          row["harga"] ||
          row["price"] ||
          row["Price"] ||
          row["unit_price"] ||
          row["unitPrice"] ||
          0;
        const price = parseFloat(String(priceRaw).replace(/[^\d.-]/g, "")) || 0;

        const vendor =
          row["Vendor"] ||
          row["vendor"] ||
          row["Vendor"] ||
          row["vendor_name"] ||
          row["Toko"] ||
          row["toko"] ||
          "";

        const modelType =
          row["Model Type"] ||
          row["model type"] ||
          row["Model"] ||
          row["model"] ||
          row["model_type"] ||
          "";

        const itemName = name.toString().trim();
        const itemId = itemName.toLowerCase().replace(/\s+/g, "-");

        try {
          const { error: upsertError } = await supabase
            .from("historical_boq_items")
            .upsert({
              id: itemId,
              user_id: user?.id,
              name: itemName,
              unit: unit.toString().trim(),
              unit_price: price,
              type: type,
              vendor_name: vendor.toString().trim(),
              model_type: modelType.toString().trim(),
              last_used: new Date().toISOString(),
            });

          if (upsertError) throw upsertError;
          success++;
        } catch (err: any) {
          errors.push(
            `Baris ${i + 2}: "${itemName}" — ${err.message || "Gagal menyimpan"}`
          );
        }
      }

      setImportResults({ success, skipped, errors });

      if (success > 0) {
        toast({
          title: "Import Berhasil",
          description: `${success} item berhasil diimpor${skipped > 0 ? `, ${skipped} dilewati` : ""}.`,
        });
        fetchItems();
      } else {
        toast({
          variant: "destructive",
          title: "Import Gagal",
          description: "Tidak ada item yang berhasil diimpor. Periksa format file.",
        });
      }
    } catch (err: any) {
      console.error("Import failed:", err);
      setImportResults({
        success: 0,
        skipped: 0,
        errors: [err.message || "Gagal membaca file Excel."],
      });
      toast({
        variant: "destructive",
        title: "Gagal Import",
        description: err.message || "Terjadi kesalahan saat membaca file.",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logout Berhasil", description: "Anda telah keluar." });
      router.push("/auth");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Logout Gagal", description: err.message });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Count stats
  const totalItems = items.length;
  const perangkatCount = items.filter((i) => i.type === "perangkat").length;
  const jasaCount = items.filter((i) => i.type === "jasa").length;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[150px] -z-10" />

      {/* Header */}
      <header className="h-16 border-b bg-emerald-800/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <BookTemplate className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-primary">Katalog Item</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={items.length === 0}
            className="flex items-center gap-2"
            title="Ekspor katalog ke Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import item dari file Excel"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 text-accent" />
              )}
              <span className="hidden sm:inline">Import</span>
            </Button>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pengaturan
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <Link href="/builder">
            <Button className="boq-accent-gradient h-10 px-6 font-extrabold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Plus className="h-5 w-5 mr-1.5" /> RAB Baru
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full z-10">
        {/* Title & Stats */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-primary mb-2 tracking-tighter">
            Manajemen Katalog
          </h1>
          <p className="text-base text-slate-500 font-medium">
            Kelola daftar item yang pernah digunakan dalam proyek RAB Anda.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Total Item"
            value={totalItems.toString()}
            color="from-indigo-500 to-violet-600"
          />
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Perangkat"
            value={perangkatCount.toString()}
            color="from-emerald-500 to-teal-600"
          />
          <StatCard
            icon={<UserCog className="h-5 w-5" />}
            label="Jasa"
            value={jasaCount.toString()}
            color="from-amber-500 to-orange-600"
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-500 text-sm">Error</p>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-6 boq-glass p-3 rounded-2xl flex flex-col md:flex-row gap-3 border-white/40">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama item atau vendor..."
              className="pl-10 h-11 border-none bg-slate-50/50 dark:bg-slate-800/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-11 border-none bg-slate-50/50 dark:bg-slate-800/50 rounded-xl font-bold">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="perangkat">Perangkat</SelectItem>
              <SelectItem value="jasa">Jasa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="boq-glass rounded-[40px] p-20 text-center flex flex-col items-center space-y-6 border-2 border-white/40">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-bold text-foreground">Memuat katalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="boq-glass rounded-[40px] border-dashed border-slate-300 p-16 text-center flex flex-col items-center space-y-6 border-2">
            <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center text-primary">
              <BookTemplate className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight">
                {searchQuery ? "Tidak Ditemukan" : "Katalog Masih Kosong"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery
                  ? `Tidak ada item yang cocok dengan "${searchQuery}".`
                  : "Item akan otomatis tercatat saat Anda menambahkan dan menyimpan harga item di halaman Builder."}
              </p>
            </div>
            {!searchQuery && (
              <div className="flex gap-3">
                <Link href="/builder">
                  <Button className="boq-accent-gradient px-8 h-12 text-lg font-bold shadow-xl shadow-primary/20">
                    Mulai Input Item
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="px-8 h-12 text-lg font-bold border-white/30"
                  onClick={() =>
                    document
                      .querySelector<HTMLElement>('input[accept=".xlsx,.xls"]')
                      ?.click()
                  }
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Import dari Excel
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              Menampilkan {paginatedItems.length} dari {filteredItems.length} item
              {filteredItems.length !== items.length &&
                ` (difilter dari ${items.length} total)`}
            </p>

            {/* Items Table */}
            <div className="boq-glass rounded-2xl border-white/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Item</th>
                      <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipe</th>
                      <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Satuan</th>
                      <th className="text-right p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Harga Satuan</th>
                      <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vendor</th>
                      <th className="text-right p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terakhir Dipakai</th>
                      <th className="text-center p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {item.type === "perangkat" ? (
                              <Package className="h-4 w-4 text-primary/60 shrink-0" />
                            ) : (
                              <UserCog className="h-4 w-4 text-accent/60 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-foreground text-sm truncate max-w-[300px]">
                                {item.name}
                              </p>
                              {item.model_type && (
                                <p className="text-[10px] text-accent/70 font-medium">
                                  Model: {item.model_type}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5",
                              item.type === "perangkat"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-accent/10 text-accent border-accent/20"
                            )}
                          >
                            {item.type === "perangkat" ? "Perangkat" : "Jasa"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground font-medium">
                          {item.unit || "-"}
                        </td>
                        <td className="p-4 text-right text-sm font-black text-foreground">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Store className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {item.vendor_name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {item.last_used
                                ? format(parseISO(item.last_used), "dd MMM yyyy", { locale: localeId })
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleEdit(item)}
                              title="Edit item"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteItem(item)}
                              title="Hapus item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Link href="/builder">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                                title="Gunakan di Builder"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-10 w-10 boq-glass border-white/40 disabled:opacity-30"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pageNum =
                      totalPages <= 7
                        ? i + 1
                        : currentPage <= 4
                          ? i + 1
                          : currentPage >= totalPages - 3
                            ? totalPages - 6 + i
                            : currentPage - 3 + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={cn(
                          "h-10 w-10 rounded-xl font-bold text-xs transition-all",
                          currentPage === pageNum
                            ? "boq-accent-gradient border-none shadow-lg shadow-primary/20"
                            : "boq-glass border-white/40"
                        )}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-10 w-10 boq-glass border-white/40 disabled:opacity-30"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="boq-glass border-white/40 rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Item Katalog
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Nama Item
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nama item..."
                className="h-11 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Satuan
                </Label>
                <Input
                  value={editForm.unit}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="Unit, Lot, m2..."
                  className="h-11 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Harga Satuan (Rp)
                </Label>
                <Input
                  type="number"
                  value={editForm.unit_price}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      unit_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-11 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Tipe
                </Label>
                <Select
                  value={editForm.type}
                  onValueChange={(val) =>
                    setEditForm((f) => ({
                      ...f,
                      type: val as "perangkat" | "jasa",
                    }))
                  }
                >
                  <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="perangkat">Perangkat</SelectItem>
                    <SelectItem value="jasa">Jasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Vendor / Toko
                </Label>
                <Input
                  value={editForm.vendor_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, vendor_name: e.target.value }))
                  }
                  placeholder="Nama vendor..."
                  className="h-11 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingItem(null)}
              className="rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.name.trim()}
              className="boq-accent-gradient rounded-xl font-bold text-white shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent className="boq-glass border-white/40 rounded-2xl">
          <AlertDialogHeader className="space-y-4">
            <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
              <Trash2 className="h-7 w-7" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-foreground tracking-tight">
              Hapus Item Katalog?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              Item <strong className="text-foreground">"{deleteItem?.name}"</strong> akan dihapus
              permanen dari katalog. Item di proyek yang sudah ada tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-xl font-bold border-white/10">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Results Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="boq-glass border-white/40 rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              {importResults && importResults.success > 0 ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  Import Selesai
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {isImporting ? "Mengimport..." : "Hasil Import"}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {isImporting ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-foreground font-bold">
                  Sedang mengimport item...
                </p>
              </div>
            ) : importResults ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-green-500">
                      {importResults.success}
                    </p>
                    <p className="text-[10px] font-bold text-green-500/70 uppercase tracking-wider">
                      Berhasil
                    </p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-amber-500">
                      {importResults.skipped}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">
                      Dilewati
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-red-500">
                      {importResults.errors.length}
                    </p>
                    <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-wider">
                      Error
                    </p>
                  </div>
                </div>

                {/* Errors list */}
                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Detail Error
                    </p>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {importResults.errors.map((err, i) => (
                        <div
                          key={i}
                          className="text-xs text-red-400 bg-red-500/5 rounded-lg p-2 border border-red-500/10"
                        >
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips for empty import */}
                {importResults.success === 0 && importResults.errors.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Pastikan file Excel memiliki kolom <strong>"Nama Item"</strong> dan minimal satu baris data.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportExcel}
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {!isImporting && importResults && (
            <DialogFooter>
              <Button
                onClick={() => setImportDialogOpen(false)}
                className="boq-accent-gradient rounded-xl font-bold text-white shadow-lg shadow-primary/20"
              >
                Tutup
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="boq-glass p-5 rounded-2xl flex items-center gap-4 border-white/40 hover:-translate-y-1 transition-all duration-300">
      <div
        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}
