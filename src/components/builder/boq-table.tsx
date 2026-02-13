"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoqCategory, BoqItem, ProjectBoq } from "@/lib/types";
import { 
  Trash2, 
  Plus, 
  Info, 
  Percent, 
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
  FileText
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

  const categories = project.categories;

  // Perhitungan Subtotals
  const totalPerangkat = categories.reduce((sum, cat) => 
    sum + cat.items.filter(i => i.type === 'perangkat').reduce((s, i) => s + (i.quantity * i.unitPrice), 0), 0);
  
  const totalJasa = categories.reduce((sum, cat) => 
    sum + cat.items.filter(i => i.type === 'jasa').reduce((s, i) => s + (i.quantity * i.unitPrice), 0), 0);

  const subTotal = totalPerangkat + totalJasa;
  const contingencyAmount = (subTotal * contingencyRate) / 100;
  const totalBeforeTax = subTotal + contingencyAmount;
  
  // Pajak
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
    if (!item.name || item.name === "Item Baru") {
      toast({
        variant: "destructive",
        title: "Nama item kosong",
        description: "Masukkan nama item terlebih dahulu sebelum meminta saran harga.",
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
        sourceUrl: result.sourceUrl
      });

      toast({
        title: "Saran Harga Berhasil",
        description: `Harga untuk ${item.name} diperbarui ke ${formatCurrency(result.suggestedPrice)}.`
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
      {/* Kop Surat / Header Dokumen */}
      <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
          <div className="space-y-4 flex-1 w-full">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Informasi Klien</span>
            </div>
            <Input 
              className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 h-auto placeholder:text-muted-foreground/30"
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
                className="text-sm border-slate-200 focus:border-primary transition-colors"
                placeholder="RAB/2024/001"
                value={project.documentNumber}
                onChange={(e) => onUpdateProjectInfo({ documentNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-bold">Tanggal</Label>
              <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 h-10 border-slate-200">
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
        <p className="text-[10px] text-muted-foreground italic">
          * Seluruh isian di atas akan muncul sebagai Kop Surat resmi saat dokumen RAB ini diekspor atau dicetak.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between border-b gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                {categories.indexOf(category) + 1}
              </div>
              <Input
                className="font-bold text-xl bg-transparent border-transparent hover:border-slate-200 focus:border-primary h-10 w-full max-w-md transition-all"
                value={category.name}
                onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
              />
              <Badge variant="outline" className="hidden lg:inline-flex bg-white px-3 py-1 text-sm shadow-sm">
                Sub-total: {formatCurrency(category.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}
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
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="w-[50px] text-center">Tipe</TableHead>
                  <TableHead className="min-w-[400px]">Uraian Pekerjaan & Spesifikasi</TableHead>
                  <TableHead className="w-[120px]">Satuan</TableHead>
                  <TableHead className="w-[100px] text-right">Vol</TableHead>
                  <TableHead className="w-[180px] text-right">Harga Satuan (Rp)</TableHead>
                  <TableHead className="w-[180px] text-right">Total (Rp)</TableHead>
                  <TableHead className="w-[80px] text-center">AI</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item) => (
                  <TableRow key={item.id} className="group transition-colors hover:bg-slate-50/80">
                    <TableCell className="text-center">
                      {item.type === 'perangkat' ? (
                        <Package className="h-5 w-5 text-primary opacity-60 mx-auto" title="Perangkat" />
                      ) : (
                        <UserCog className="h-5 w-5 text-accent opacity-60 mx-auto" title="Jasa" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 pr-4">
                        <Input
                          className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-9 font-medium text-slate-900 transition-all px-2 -ml-2"
                          value={item.name}
                          placeholder="Ketik nama item atau deskripsi pekerjaan..."
                          onChange={(e) => onUpdateItem(category.id, item.id, { name: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Badge variant={item.type === 'perangkat' ? 'outline' : 'secondary'} className="text-[9px] h-4 px-1.5 uppercase tracking-tighter font-bold">
                            {item.type}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-9 text-slate-600 px-2 -ml-2"
                        value={item.unit}
                        placeholder="Unit/Lot/Titik"
                        onChange={(e) => onUpdateItem(category.id, item.id, { unit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-9 text-right font-medium px-2 -ml-2"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(category.id, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="bg-transparent border-none hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary h-9 text-right font-bold text-slate-800 px-2 -ml-2"
                        value={item.unitPrice}
                        onChange={(e) => onUpdateItem(category.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary text-sm whitespace-nowrap">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10 transition-colors"
                          onClick={() => handleSuggestPrice(category.id, item)}
                          disabled={loadingPriceId === item.id}
                        >
                          {loadingPriceId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                        {item.sourceUrl && (
                          <a 
                            href={item.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Lihat Sumber Harga"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive h-8 w-8"
                        onClick={() => onDeleteItem(category.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-4 border-t bg-slate-50/30 flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-10 text-primary border-primary/20 hover:border-primary/50 hover:bg-primary/5 font-semibold bg-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tambah Item Pekerjaan <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 p-2">
                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => onAddItem(category.id, 'perangkat')}>
                  <Package className="mr-3 h-5 w-5 text-primary" /> 
                  <div className="flex flex-col">
                    <span className="font-bold">Baris Perangkat</span>
                    <span className="text-[10px] text-muted-foreground">Material, Hardware, atau Barang Fisik</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => onAddItem(category.id, 'jasa')}>
                  <UserCog className="mr-3 h-5 w-5 text-accent" /> 
                  <div className="flex flex-col">
                    <span className="font-bold">Baris Jasa</span>
                    <span className="text-[10px] text-muted-foreground">Instalasi, Konfigurasi, atau Tenaga Kerja</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {/* Rekapitulasi Akhir */}
      <div className="bg-white rounded-2xl shadow-xl border p-10 space-y-8">
        <h3 className="text-2xl font-bold text-primary flex items-center gap-3">
          <Calculator className="h-7 w-7" /> Rekapitulasi Akhir Anggaran
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 flex items-center gap-3 font-medium">
                  <Package className="h-5 w-5 text-primary opacity-70" /> Total Barang/Perangkat
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(totalPerangkat)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 flex items-center gap-3 font-medium">
                  <UserCog className="h-5 w-5 text-accent opacity-70" /> Total Jasa Instalasi
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(totalJasa)}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="include-pph23" 
                        className="h-5 w-5"
                        checked={includePph23} 
                        onCheckedChange={(checked) => setIncludePph23(!!checked)} 
                      />
                      <Label htmlFor="include-pph23" className="text-slate-700 cursor-pointer font-bold">
                        PPh 23 (Potongan Jasa 2%)
                      </Label>
                    </div>
                    <p className="text-[10px] text-slate-500 ml-8 italic">Pajak penghasilan atas jasa yang wajib dipotong.</p>
                  </div>
                  <span className="font-bold text-destructive">-{formatCurrency(pph23Amount)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-medium">Biaya Tak Terduga (Contingency)</span>
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
                  <Checkbox 
                    id="include-vat" 
                    className="h-5 w-5"
                    checked={includeVat} 
                    onCheckedChange={(checked) => setIncludeVat(!!checked)} 
                  />
                  <Label htmlFor="include-vat" className="text-slate-700 cursor-pointer font-bold">
                    Sertakan PPN 11% (Standard Pajak Indonesia)
                  </Label>
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
                <Calculator className="h-32 w-32" />
              </div>
              <span className="text-xs opacity-80 uppercase tracking-[0.2em] font-black">Total Anggaran Keseluruhan</span>
              <div className="text-5xl font-black tracking-tight drop-shadow-lg">
                {formatCurrency(grandTotal)}
              </div>
              <div className="mt-8 pt-6 border-t border-white/20 w-full text-sm opacity-80">
                <div className="flex justify-between font-medium">
                  <span>Netto Transfer Vendor Jasa:</span>
                  <span className="font-bold">{formatCurrency(totalJasa - pph23Amount)}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
              Dokumen ini dihasilkan secara otomatis oleh Pembuat RAB AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
