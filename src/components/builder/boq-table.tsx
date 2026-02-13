
"use client";

import React, { useState, useEffect } from "react";
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
  Calculator, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  Hash,
  FileText,
  Percent,
  Store,
  TrendingUp,
  Coins,
  History
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { suggestItemPrice } from "@/ai/flows/ai-price-suggestion";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface BoqTableProps {
  project: ProjectBoq;
  onUpdateProjectInfo: (updates: Partial<ProjectBoq>) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<BoqCategory>) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BoqItem>) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onAddItem: (categoryId: string, type?: 'perangkat' | 'jasa') => void;
  onDeleteCategory: (categoryId: string) => void;
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
  const { toast } = useToast();
  const db = useFirestore();

  const categories = project.categories;

  // Fungsi untuk merekam item ke katalog Firestore (Upsert berdasarkan nama)
  const recordToCatalog = async (item: BoqItem) => {
    if (!db || !item.name || item.unitPrice <= 0) return;
    
    try {
      // Kita gunakan ID yang stabil atau slug nama untuk katalog agar tidak duplikat
      const catalogId = item.name.toLowerCase().replace(/\s+/g, '-');
      const catalogRef = doc(db, "item_catalog", catalogId);
      
      await setDoc(catalogRef, {
        name: item.name,
        unit: item.unit,
        unitPrice: item.unitPrice,
        type: item.type,
        vendorName: item.vendorName || "",
        lastUsed: serverTimestamp()
      }, { merge: true });
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
  const pph23Amount = includePph23 ? (totalJasa * 2) / 100 : 0;
  
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
      const result = await suggestItemPrice({
        itemName: item.name,
        itemType: item.type
      });
      
      onUpdateItem(categoryId, item.id, {
        unitPrice: result.suggestedPrice,
        sourceUrl: result.sourceUrl,
        vendorName: result.sourceName
      });

      toast({
        title: "Saran Harga Tertinggi Berhasil",
        description: `Menggunakan harga aman (high-end) dari ${result.sourceName}.`
      });

      // Simpan otomatis ke katalog setelah dapat harga AI
      recordToCatalog({
        ...item,
        unitPrice: result.suggestedPrice,
        vendorName: result.sourceName
      });
    } catch (error) {
      console.error("Gagal mendapatkan saran harga:", error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan saat menghubungi AI.",
      });
    } finally {
      setLoadingPriceId(null);
    }
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

          <div className="space-y-4 w-full md:w-64">
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
          </div>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between border-b gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                {categories.indexOf(category) + 1}
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
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="w-[60px] text-center">Tipe</TableHead>
                  <TableHead className="min-w-[600px]">Uraian Pekerjaan & Spesifikasi</TableHead>
                  <TableHead className="w-[120px]">Satuan</TableHead>
                  <TableHead className="w-[140px] text-right">Vol</TableHead>
                  <TableHead className="w-[320px] text-right">Harga Dasar (Modal)</TableHead>
                  <TableHead className="w-[120px] text-right">Margin (%)</TableHead>
                  <TableHead className="w-[280px] text-right">Total Jual (Rp)</TableHead>
                  <TableHead className="min-w-[250px]">Referensi Vendor</TableHead>
                  <TableHead className="w-[100px] text-center">Saran AI</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item) => (
                  <TableRow key={item.id} className="group transition-colors hover:bg-slate-50/80">
                    <TableCell className="text-center">
                      {item.type === 'perangkat' ? (
                        <Package className="h-5 w-5 text-primary opacity-60 mx-auto" />
                      ) : (
                        <UserCog className="h-5 w-5 text-accent opacity-60 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 font-medium text-slate-900 transition-all px-3 -ml-2 text-base w-full"
                        value={item.name}
                        placeholder="Ketik nama item..."
                        onChange={(e) => onUpdateItem(category.id, item.id, { name: e.target.value })}
                        onBlur={() => recordToCatalog(item)} // Simpan ke katalog saat selesai edit
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-slate-600 px-3 -ml-2 w-full"
                        value={item.unit}
                        onChange={(e) => onUpdateItem(category.id, item.id, { unit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-right font-medium px-3 -ml-2 w-full text-base"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(category.id, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-right font-bold text-slate-800 px-3 -ml-2 w-full text-base"
                        value={item.unitPrice}
                        onChange={(e) => onUpdateItem(category.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        onBlur={() => recordToCatalog(item)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-right font-medium text-accent px-3 -ml-2 w-full text-base"
                          value={item.margin || 0}
                          onChange={(e) => onUpdateItem(category.id, item.id, { margin: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary text-base whitespace-nowrap px-4">
                      {formatCurrency(calculateItemTotal(item))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-11 text-sm text-slate-600 px-3 -ml-1 w-full"
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
                  <span className="font-bold text-destructive">-{formatCurrency(pph23Amount)}</span>
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
    </div>
  );
}
