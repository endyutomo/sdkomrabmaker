"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoqCategory, BoqItem, ProjectBoq } from "@/lib/types";
import {
  Trash2,
  Plus,
  Package,
  UserCog,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Calculator,
  Sparkles,
  Loader2,
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  Hash,
  FileText,
  Search,
  History,
  User,
  Image as ImageIcon,
  ZoomIn,
  ImageOff,
  Store,
  Percent,
  Coins,
  GripVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { suggestItemPrice, PriceSuggestionOutput } from "@/ai/flows/ai-price-suggestion";
import { suggestItemPriceClient, shouldUsePuterAI, PriceSuggestionInput } from "@/ai/puter-ai-adapter";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";

interface BoqTableProps {
  project: ProjectBoq;
  onUpdateProjectInfo: (updates: Partial<ProjectBoq>) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<BoqCategory>) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BoqItem>) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onAddItem: (categoryId: string, type?: 'perangkat' | 'jasa') => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategory?: (categoryId: string, direction: 'up' | 'down') => void;
  onReorderItem?: (categoryId: string, itemId: string, direction: 'up' | 'down') => void;
}

export function BoqTable({
  project,
  onUpdateProjectInfo,
  onUpdateCategory,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onDeleteCategory
}: BoqTableProps) {
  const [includeVat, setIncludeVat] = useState(true);
  const [includePph23, setIncludePph23] = useState(true);
  const [contingencyRate, setContingencyRate] = useState(5);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const { supabase, user } = useSupabase();

  // Fetch catalog items for autocomplete using Supabase
  const { data: catalogItems } = useSupabaseQuery<any>(
    'historical_boq_items',
    (q) => q.order('last_used', { ascending: false })
  );

  const categories = project.categories;

  const recordToCatalog = async (item: BoqItem) => {
    if (!supabase || !user || !item.name || item.name.includes("Baru") || item.unitPrice <= 0) return;

    try {
      const catalogId = item.name.toLowerCase().trim().replace(/\s+/g, '-');

      const { error } = await supabase
        .from('historical_boq_items')
        .upsert({
          id: catalogId,
          user_id: user.id,
          name: item.name,
          unit: item.unit,
          unit_price: item.unitPrice,
          type: item.type,
          vendor_name: item.vendorName || "",
          last_used: new Date().toISOString(),
          // Note: model_type and image_url might need DB migration manually if they don't exist
          // but passing them here won't hurt if using JSONB or if schema is updated
          model_type: item.modelType || null,
          image_url: item.imageUrl || null
        });

      if (error) throw error;
    } catch (e) {
      console.error("Gagal menyimpan ke katalog:", e);
    }
  };

  const calculateItemSellingPrice = (item: BoqItem) => {
    const margin = item.margin || 0;
    return item.unitPrice * (1 + margin / 100);
  };

  const calculateItemTotal = (item: BoqItem) => {
    return item.quantity * calculateItemSellingPrice(item);
  };

  const calculateItemCost = (item: BoqItem) => {
    return item.quantity * item.unitPrice;
  };

  const totalPerangkat = categories.reduce((sum, cat) =>
    sum + cat.items.filter(i => i.type === 'perangkat').reduce((s, i) => s + calculateItemTotal(i), 0), 0);

  const totalJasa = categories.reduce((sum, cat) =>
    sum + cat.items.filter(i => i.type === 'jasa').reduce((s, i) => s + calculateItemTotal(i), 0), 0);

  const totalCost = categories.reduce((sum, cat) =>
    sum + cat.items.reduce((s, i) => s + calculateItemCost(i), 0), 0);

  const subTotal = totalPerangkat + totalJasa;
  const totalProfit = subTotal - totalCost;
  const contingencyAmount = (subTotal * contingencyRate) / 100;
  const totalBeforeTax = subTotal + contingencyAmount;

  const vatAmount = includeVat ? (totalBeforeTax * 11) / 100 : 0;

  const grandTotal = totalBeforeTax + vatAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSuggestPrice = async (categoryId: string, item: BoqItem) => {
    if (!item.name || item.name.includes("Baru")) {
      toast({
        variant: "destructive",
        title: "Nama item tidak spesifik",
        description: "Masukkan nama item yang jelas sebelum meminta saran harga tertinggi.",
      });
      return;
    }

    setLoadingPriceId(item.id);
    try {
      const input: PriceSuggestionInput = {
        itemName: item.name,
        itemType: item.type as 'perangkat' | 'jasa'
      };

      let result;

      // Check active provider
      if (shouldUsePuterAI()) {
        // @ts-ignore
        if (!window.puter) {
          throw new Error("Layanan AI Client tidak tersedia. Coba refresh halaman.");
        }
        console.log("Using Client-Side AI Provider (Puter/OpenAI/Claude/Grok)");
        result = await suggestItemPriceClient(input);
      } else {
        console.log("Using Server-Side AI Provider (Gemini)");
        result = await suggestItemPrice(input);
      }

      onUpdateItem(categoryId, item.id, {
        unitPrice: result.suggestedPrice,
        sourceUrl: result.sourceUrl,
        vendorName: result.sourceName,
        priceRange: result.priceRange,
        marketplaceSources: result.marketplaceSources,
        brandDetected: result.brandDetected,
        isPremiumBrand: result.isPremiumBrand,
        brandNote: result.brandNote,
        modelType: result.modelType,
        imageUrl: result.imageUrl
      });

      const toastTitle = result.isPremiumBrand
        ? `Harga Brand Premium: ${result.brandDetected}`
        : "Saran Harga Teraman Berhasil";

      const toastDescription = result.isPremiumBrand
        ? `${result.brandNote || `Brand premium terdeteksi. Harga dari ${result.marketplaceSources?.join(', ') || result.sourceName}.`}`
        : `Menggunakan harga tertinggi (aman) dari ${result.marketplaceSources?.join(', ') || result.sourceName}.`;

      toast({
        title: toastTitle,
        description: toastDescription
      });

      recordToCatalog({
        ...item,
        unitPrice: result.suggestedPrice,
        vendorName: result.sourceName,
        priceRange: result.priceRange,
        marketplaceSources: result.marketplaceSources,
        brandDetected: result.brandDetected,
        isPremiumBrand: result.isPremiumBrand,
        brandNote: result.brandNote,
        modelType: result.modelType,
        imageUrl: result.imageUrl
      });
    } catch (error: any) {
      console.error("Gagal mendapatkan saran harga:", error);

      let errorMessage = "Terjadi kesalahan saat menghubungi AI.";
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      toast({
        variant: "destructive",
        title: "Gagal",
        description: errorMessage,
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleSelectFromCatalog = (categoryId: string, itemId: string, catalogItem: any) => {
    onUpdateItem(categoryId, itemId, {
      name: catalogItem.name,
      unit: catalogItem.unit,
      unitPrice: catalogItem.unit_price,
      type: catalogItem.type,
      vendorName: catalogItem.vendor_name
    });
    toast({
      title: "Item Dimuat dari Katalog",
      description: `${catalogItem.name} berhasil diterapkan.`
    });
  };

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Kop Surat */}
      <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
          <div className="space-y-4 flex-1 w-full">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Informasi Klien</span>
            </div>
            <Input
              className="text-3xl font-bold bg-transparent border-none focus:ring-0 p-0 h-auto placeholder:text-muted-foreground/30"
              placeholder="Nama Klien / Perusahaan"
              value={project.clientName}
              onChange={(e) => onUpdateProjectInfo({ clientName: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-lg border border-slate-100">
                <MapPin className="h-4 w-4 shrink-0" />
                <Input
                  className="bg-transparent border-none focus:ring-0 p-0 h-auto text-sm"
                  placeholder="Lokasi Proyek"
                  value={project.projectLocation}
                  onChange={(e) => onUpdateProjectInfo({ projectLocation: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-lg border border-slate-100">
                <FileText className="h-4 w-4 shrink-0" />
                <Input
                  className="bg-transparent border-none focus:ring-0 p-0 h-auto text-sm font-medium"
                  placeholder="Nama Proyek"
                  value={project.title}
                  onChange={(e) => onUpdateProjectInfo({ title: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 w-full md:w-72">
            <div className="flex items-center gap-2 text-primary">
              <Hash className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Data Dokumen</span>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">Nomor Dokumen</Label>
              <Input
                className="text-sm border-slate-200 focus:border-primary transition-colors h-11"
                placeholder="RAB/2024/001"
                value={project.documentNumber}
                onChange={(e) => onUpdateProjectInfo({ documentNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">Tanggal</Label>
              <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 h-11 border-slate-200">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  className="bg-transparent border-none focus:ring-0 text-sm flex-1 outline-none"
                  value={project.documentDate}
                  onChange={(e) => onUpdateProjectInfo({ documentDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">Pembuat RAB</Label>
              <div className="flex items-center gap-2 bg-white border rounded-md px-3 h-11 border-slate-200 focus-within:border-primary transition-colors">
                <User className="h-4 w-4 text-primary" />
                <Input
                  className="bg-transparent border-none focus:ring-0 p-0 h-auto text-sm font-semibold"
                  placeholder="Nama Penyusun"
                  value={project.creatorName || ""}
                  onChange={(e) => onUpdateProjectInfo({ creatorName: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {categories.map((category, catIdx) => (
        <div key={category.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between border-b gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="flex items-center gap-1">
                {onReorderCategory && (
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button
                      onClick={() => onReorderCategory(category.id, 'up')}
                      disabled={catIdx === 0}
                      className="h-4 w-4 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Pindah ke atas"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderCategory(category.id, 'down')}
                      disabled={catIdx === categories.length - 1}
                      className="h-4 w-4 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Pindah ke bawah"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing hidden sm:block" />
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                  {catIdx + 1}
                </div>
              </div>
              <Input
                className="font-bold text-2xl bg-transparent border-transparent hover:border-slate-200 focus:border-primary h-12 w-full max-w-xl transition-all"
                value={category.name}
                onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
              />
              <Badge variant="outline" className="hidden lg:inline-flex bg-white px-4 py-2 text-base font-bold shadow-sm text-primary whitespace-nowrap">
                Sub-total: {formatCurrency(category.items.reduce((s, i) => s + calculateItemTotal(i), 0))}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => onDeleteCategory(category.id)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table className="table-auto w-full min-w-[1500px]">
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="w-[60px] text-center">Tipe</TableHead>
                  <TableHead className="min-w-[600px]">Uraian Pekerjaan & Spesifikasi</TableHead>
                  <TableHead className="w-[120px]">Satuan</TableHead>
                  <TableHead className="min-w-[160px] text-right">Vol (Qty)</TableHead>
                  <TableHead className="min-w-[400px] text-right">Harga Dasar (Modal)</TableHead>
                  <TableHead className="min-w-[150px] text-right">Margin (%)</TableHead>
                  <TableHead className="min-w-[300px] text-right font-bold text-primary">Total Jual (Rp)</TableHead>
                  <TableHead className="min-w-[250px]">Referensi Vendor</TableHead>
                  <TableHead className="w-[100px] text-center">AI</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item, itemIdx) => (
                  <TableRow key={item.id} className="group transition-colors hover:bg-slate-50/80">
                    <TableCell className="text-center w-[30px] p-1">
                      {onReorderItem && (
                        <div className="flex flex-col gap-0.5 items-center">
                          <button
                            onClick={() => onReorderItem(category.id, item.id, 'up')}
                            disabled={itemIdx === 0}
                            className="h-3 w-3 flex items-center justify-center text-slate-300 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onReorderItem(category.id, item.id, 'down')}
                            disabled={itemIdx === category.items.length - 1}
                            className="h-3 w-3 flex items-center justify-center text-slate-300 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.type === 'perangkat' ? (
                        <Package className="h-5 w-5 text-primary opacity-60 mx-auto" />
                      ) : (
                        <UserCog className="h-5 w-5 text-accent opacity-60 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 font-medium text-slate-900 transition-all px-3 -ml-2 text-base w-full"
                          value={item.name}
                          placeholder="Ketik nama item..."
                          onChange={(e) => onUpdateItem(category.id, item.id, { name: e.target.value })}
                          onBlur={() => setTimeout(() => recordToCatalog(item), 500)}
                        />
                        {item.modelType && (
                          <div className="text-[10px] font-bold text-accent px-2 -mt-2 mb-1 uppercase tracking-tighter bg-accent/5 rounded w-fit">
                            Model: {item.modelType}
                          </div>
                        )}
                        {item.imageUrl && (
                          <div className="flex items-center gap-2 px-2 -mt-1 mb-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 gap-1"
                              onClick={() => setSelectedImage(item.imageUrl || null)}
                            >
                              <ImageIcon className="h-3 w-3" /> Lihat Foto
                            </Button>
                          </div>
                        )}
                        {catalogItems && catalogItems.filter(c => c.name.toLowerCase().includes(item.name.toLowerCase()) && item.name.length > 2).length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary shrink-0">
                                <History className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <div className="p-2 border-b bg-slate-50 flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item dari Katalog</span>
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {catalogItems
                                  .filter(c => c.name.toLowerCase().includes(item.name.toLowerCase()))
                                  .map((c, idx) => (
                                    <button
                                      key={idx}
                                      className="w-full text-left p-3 hover:bg-slate-100 flex flex-col gap-1 border-b last:border-0 transition-colors"
                                      onClick={() => handleSelectFromCatalog(category.id, item.id, c)}
                                    >
                                      <span className="font-bold text-sm text-primary">{c.name}</span>
                                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                        <span>{formatCurrency(c.unit_price)} / {c.unit}</span>
                                        <span className="bg-slate-200 px-1.5 py-0.5 rounded uppercase">{c.type}</span>
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-slate-600 px-3 -ml-2 w-full text-base"
                        value={item.unit}
                        onChange={(e) => onUpdateItem(category.id, item.id, { unit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-right font-bold px-3 -ml-2 w-full text-lg"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(category.id, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-end gap-1">
                        <Input
                          type="number"
                          className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-right font-black text-slate-900 px-3 -ml-2 w-full text-lg"
                          value={item.unitPrice}
                          onChange={(e) => onUpdateItem(category.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          onBlur={() => recordToCatalog(item)}
                        />
                        {item.priceRange && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-50 text-slate-500 font-medium border-slate-200">
                              {formatCurrency(item.priceRange.min)} - {formatCurrency(item.priceRange.max)}
                            </Badge>
                            {item.marketplaceSources && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-4 w-4 text-slate-400 hover:text-primary p-0">
                                    <Hash className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-3" align="end">
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sumber Marketplace</p>
                                    <div className="flex flex-wrap gap-1">
                                      {item.marketplaceSources.map((source, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] py-0 px-1">
                                          {source}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic mt-2 border-t pt-1">
                                      Fokus seller rating 4-5★
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-right font-bold text-accent px-3 -ml-2 w-full text-lg"
                        value={item.margin || 0}
                        onChange={(e) => onUpdateItem(category.id, item.id, { margin: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right font-black text-primary text-xl whitespace-nowrap px-4 bg-primary/5">
                      {formatCurrency(calculateItemTotal(item))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-sm sm:text-sm text-slate-700 px-3 -ml-1 w-full font-medium"
                          value={item.vendorName || ""}
                          placeholder="Nama Toko / Vendor..."
                          onChange={(e) => onUpdateItem(category.id, item.id, { vendorName: e.target.value })}
                          onBlur={() => recordToCatalog(item)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-accent hover:text-accent hover:bg-accent/10"
                          onClick={() => handleSuggestPrice(category.id, item)}
                          disabled={loadingPriceId === item.id}
                        >
                          {loadingPriceId === item.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                        </Button>
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive h-10 w-10" onClick={() => onDeleteItem(category.id, item.id)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-6 border-t bg-slate-50/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="w-full h-12 text-primary border-primary/20 font-bold bg-white text-base">
                  <Plus className="h-5 w-5 mr-2" /> Tambah Item Pekerjaan <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-80 p-3">
                <DropdownMenuItem className="cursor-pointer py-3" onClick={() => onAddItem(category.id, 'perangkat')}>
                  <Package className="mr-4 h-6 w-6 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold">Baris Perangkat</span>
                    <span className="text-xs text-muted-foreground">Material, Hardware, Barang Fisik</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-3" onClick={() => onAddItem(category.id, 'jasa')}>
                  <UserCog className="mr-4 h-6 w-6 text-accent" />
                  <div className="flex flex-col">
                    <span className="font-bold">Baris Jasa</span>
                    <span className="text-xs text-muted-foreground">Instalasi, Konfigurasi, Tenaga Kerja</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {/* Rekapitulasi */}
      <div className="bg-white rounded-2xl shadow-xl border p-10 space-y-8">
        <h3 className="text-2xl font-bold text-primary flex items-center gap-3">
          <Calculator className="h-7 w-7" /> Rekapitulasi Anggaran (Saran Harga Tertinggi)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-3 font-medium">
                  <Package className="h-5 w-5 text-primary opacity-70" /> Total Perangkat
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(totalPerangkat)}</span>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-3 font-medium">
                  <UserCog className="h-5 w-5 text-accent opacity-70" /> Total Jasa Instalasi
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(totalJasa)}</span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl space-y-2 border border-emerald-100">
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>Estimasi Laba Kotor</span>
                  <span>{formatCurrency(totalProfit)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox id="include-pph23" checked={includePph23} onCheckedChange={(checked) => setIncludePph23(!!checked)} />
                    <Label htmlFor="include-pph23" className="text-slate-700 font-bold">PPh 23 (Potongan Jasa 2%)</Label>
                  </div>
                  <span className="font-bold text-destructive">-{formatCurrency(includePph23 ? (totalJasa * 2) / 100 : 0)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-medium">Cadangan Tak Terduga (Contingency)</span>
                  <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border">
                    <Input
                      type="number"
                      className="w-12 h-6 p-1 text-sm border-none bg-transparent font-bold text-center"
                      value={contingencyRate}
                      onChange={(e) => setContingencyRate(parseFloat(e.target.value) || 0)}
                    />
                    <Percent className="h-3 w-3 text-slate-500" />
                  </div>
                </div>
                <span className="font-bold text-amber-600">{formatCurrency(contingencyAmount)}</span>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl space-y-4 border border-primary/10">
                <div className="flex items-center space-x-3">
                  <Checkbox id="include-vat" checked={includeVat} onCheckedChange={(checked) => setIncludeVat(!!checked)} />
                  <Label htmlFor="include-vat" className="text-slate-700 font-bold">Sertakan PPN 11%</Label>
                </div>
                {includeVat && (
                  <div className="flex items-center justify-between pl-8">
                    <span className="text-slate-600 text-sm">Nilai PPN 11%</span>
                    <span className="font-bold text-slate-900">{formatCurrency(vatAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="boq-accent-gradient rounded-3xl p-10 text-white flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Coins className="h-32 w-32" />
              </div>
              <span className="text-xs opacity-80 uppercase tracking-widest font-black">Total Penawaran Aman</span>
              <div className="text-5xl font-black tracking-tight drop-shadow-lg">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => {
        if (!open) {
          setSelectedImage(null);
          setImageLoading(true);
          setImageError(false);
        }
      }}>
        <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 overflow-hidden flex items-center justify-center min-h-[300px]">
          <div className="relative group w-full flex items-center justify-center">
            {selectedImage && (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 text-white">
                    <Loader2 className="h-12 w-12 animate-spin" />
                  </div>
                )}
                {imageError ? (
                  <div className="bg-white p-8 rounded-xl flex flex-col items-center gap-4 text-center">
                    <div className="bg-red-50 p-4 rounded-full">
                      <ImageOff className="h-10 w-10 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">Gagal Memuat Foto</h4>
                      <p className="text-sm text-slate-500 max-w-xs break-all mt-1">
                        URL tidak valid atau diblokir oleh server asal.
                      </p>
                      <a href={selectedImage} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 block">
                        Coba buka link langsung
                      </a>
                    </div>
                  </div>
                ) : (
                  <img
                    src={selectedImage}
                    alt="Product Preview"
                    className={`max-h-[85vh] w-auto rounded-2xl shadow-2xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                )}
              </>
            )}
            {!imageLoading && !imageError && (
              <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn className="h-6 w-6" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
