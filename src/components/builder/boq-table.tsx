"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoqCategory, BoqItem } from "@/lib/types";
import { Trash2, Plus, Info, Percent } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface BoqTableProps {
  categories: BoqCategory[];
  onUpdateCategory: (categoryId: string, updates: Partial<BoqCategory>) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BoqItem>) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onAddItem: (categoryId: string) => void;
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
  const [contingencyRate, setContingencyRate] = useState(5);

  const calculateCategoryTotal = (category: BoqCategory) => {
    return category.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const subTotal = categories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0);
  const contingencyAmount = (subTotal * contingencyRate) / 100;
  const totalBeforeVat = subTotal + contingencyAmount;
  const vatAmount = includeVat ? (totalBeforeVat * 11) / 100 : 0;
  const grandTotal = totalBeforeVat + vatAmount;

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
                Sub-total Bagian: {formatCurrency(calculateCategoryTotal(category))}
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
                <TableHead className="w-[400px]">Uraian Pekerjaan / Perangkat</TableHead>
                <TableHead className="w-[100px]">Satuan</TableHead>
                <TableHead className="w-[120px] text-right">Volume</TableHead>
                <TableHead className="w-[150px] text-right">Harga Satuan</TableHead>
                <TableHead className="w-[150px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.map((item) => (
                <TableRow key={item.id} className="group transition-colors hover:bg-accent/5">
                  <TableCell>
                    <Input
                      className="bg-transparent border-transparent hover:border-input focus:border-input h-8"
                      value={item.name}
                      placeholder="Contoh: Server Core i9 / Jasa Instalasi"
                      onChange={(e) => onUpdateItem(category.id, item.id, { name: e.target.value })}
                    />
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
              {category.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    Belum ada item di bagian ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          <div className="p-2 border-t bg-muted/5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8 text-primary hover:bg-primary/10 border border-dashed hover:border-primary/50"
              onClick={() => onAddItem(category.id)}
            >
              <Plus className="h-3 w-3 mr-2" /> Tambah Baris Pekerjaan
            </Button>
          </div>
        </div>
      ))}

      {/* Rekapitulasi Akhir */}
      <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-6">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <Info className="h-5 w-5" /> Ringkasan Rekapitulasi (Rupiah)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-muted-foreground">Total Pekerjaan (Sub-total)</span>
              <span className="font-semibold">{formatCurrency(subTotal)}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Biaya Tak Terduga</span>
                <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                  <Input 
                    type="number" 
                    className="w-12 h-6 p-1 text-xs border-none bg-transparent" 
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
                Sertakan PPN 11% (Standard Pajak Indonesia)
              </Label>
            </div>
            
            {includeVat && (
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-muted-foreground">PPN 11%</span>
                <span className="font-semibold">{formatCurrency(vatAmount)}</span>
              </div>
            )}
          </div>

          <div className="boq-accent-gradient rounded-xl p-8 text-white flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-sm opacity-80 uppercase tracking-widest font-semibold">Total Keseluruhan (Grand Total)</span>
            <div className="text-4xl font-extrabold tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
            <p className="text-xs opacity-70 italic mt-4">
              * Harga di atas sudah termasuk biaya jasa dan perangkat yang diinput.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
