"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoqCategory, BoqItem } from "@/lib/types";
import { Trash2, Plus, Info, Percent, Package, UserCog, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BoqTableProps {
  categories: BoqCategory[];
  onUpdateCategory: (categoryId: string, updates: Partial<BoqCategory>) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BoqItem>) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onAddItem: (categoryId: string, type?: 'perangkat' | 'jasa') => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function BoqTable({ 
  categories, 
  onUpdateCategory, 
  onUpdateItem, 
  onDeleteItem, 
  onAddItem,
  onDeleteCategory 
}: BoqTableProps) {
  const [includeVat, setIncludeVat] = useState(true);
  const [includePph23, setIncludePph23] = useState(true);
  const [contingencyRate, setContingencyRate] = useState(5);

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

  return (
    <div className="space-y-8 animate-fade-in-up">
      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-muted/30 p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3 flex-1">
              <Input
                className="font-semibold text-lg bg-transparent border-transparent hover:border-input focus:border-input h-8 w-auto min-w-[300px]"
                value={category.name}
                onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
              />
              <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Sub-total: {formatCurrency(category.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteCategory(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[60px]"></TableHead>
                <TableHead className="w-[340px]">Uraian Pekerjaan</TableHead>
                <TableHead className="w-[100px]">Satuan</TableHead>
                <TableHead className="w-[120px] text-right">Vol</TableHead>
                <TableHead className="w-[150px] text-right">Harga Satuan</TableHead>
                <TableHead className="w-[150px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.map((item) => (
                <TableRow key={item.id} className="group transition-colors hover:bg-accent/5">
                  <TableCell className="text-center">
                    {item.type === 'perangkat' ? (
                      <Package className="h-4 w-4 text-primary opacity-60" title="Perangkat" />
                    ) : (
                      <UserCog className="h-4 w-4 text-accent opacity-60" title="Jasa" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Input
                        className="bg-transparent border-transparent hover:border-input focus:border-input h-8"
                        value={item.name}
                        placeholder="Nama Item..."
                        onChange={(e) => onUpdateItem(category.id, item.id, { name: e.target.value })}
                      />
                      <div className="flex gap-2 pl-3">
                        <Badge variant={item.type === 'perangkat' ? 'outline' : 'secondary'} className="text-[10px] h-4 px-1 uppercase">
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="bg-transparent border-transparent hover:border-input focus:border-input h-8"
                      value={item.unit}
                      placeholder="Unit/Lot"
                      onChange={(e) => onUpdateItem(category.id, item.id, { unit: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="bg-transparent border-transparent hover:border-input focus:border-input h-8 text-right"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(category.id, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="bg-transparent border-transparent hover:border-input focus:border-input h-8 text-right"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(category.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
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
          
          <div className="p-2 border-t bg-muted/5 flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-8 text-primary hover:bg-primary/10 border border-dashed hover:border-primary/50"
                >
                  <Plus className="h-3 w-3 mr-2" /> Tambah Baris <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem onClick={() => onAddItem(category.id, 'perangkat')}>
                  <Package className="mr-2 h-4 w-4" /> Perangkat / Barang
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddItem(category.id, 'jasa')}>
                  <UserCog className="mr-2 h-4 w-4" /> Jasa Instalasi / Upah
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {/* Rekapitulasi Akhir */}
      <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-6">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <Info className="h-5 w-5" /> Rekapitulasi Akhir (Rupiah)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" /> Total Barang/Perangkat
              </span>
              <span className="font-semibold">{formatCurrency(totalPerangkat)}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Total Jasa
              </span>
              <span className="font-semibold">{formatCurrency(totalJasa)}</span>
            </div>

            <div className="flex items-center justify-between p-2 border-b bg-muted/20">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="include-pph23" 
                    checked={includePph23} 
                    onCheckedChange={(checked) => setIncludePph23(!!checked)} 
                  />
                  <Label htmlFor="include-pph23" className="text-muted-foreground cursor-pointer font-medium">
                    PPh 23 (Potongan Jasa 2%)
                  </Label>
                </div>
                <p className="text-[10px] text-muted-foreground ml-6 italic">Potongan pajak penghasilan atas jasa</p>
              </div>
              <span className="font-semibold text-destructive">-{formatCurrency(pph23Amount)}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Biaya Tak Terduga</span>
                <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                  <Input 
                    type="number" 
                    className="w-10 h-6 p-1 text-xs border-none bg-transparent" 
                    value={contingencyRate}
                    onChange={(e) => setContingencyRate(parseFloat(e.target.value) || 0)}
                  />
                  <Percent className="h-3 w-3" />
                </div>
              </div>
              <span className="font-semibold text-amber-600">{formatCurrency(contingencyAmount)}</span>
            </div>

            <div className="flex items-center space-x-2 p-2">
              <Checkbox 
                id="include-vat" 
                checked={includeVat} 
                onCheckedChange={(checked) => setIncludeVat(!!checked)} 
              />
              <Label htmlFor="include-vat" className="text-muted-foreground cursor-pointer">
                Sertakan PPN 11% (Standard Pajak)
              </Label>
            </div>
            
            {includeVat && (
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-muted-foreground font-medium">PPN 11% (dari Subtotal + BTT)</span>
                <span className="font-semibold">{formatCurrency(vatAmount)}</span>
              </div>
            )}
          </div>

          <div className="boq-accent-gradient rounded-xl p-8 text-white flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="h-24 w-24" />
            </div>
            <span className="text-sm opacity-80 uppercase tracking-widest font-semibold">Total Anggaran Keseluruhan</span>
            <div className="text-4xl font-extrabold tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 w-full text-xs opacity-70">
              <div className="flex justify-between">
                <span>Netto ke Vendor Jasa (setelah PPh 23):</span>
                <span>{formatCurrency(totalJasa - pph23Amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
