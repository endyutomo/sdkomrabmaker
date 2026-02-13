"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, X } from "lucide-react";
import { suggestBoqItems } from "@/ai/flows/ai-boq-item-suggestion";
import { BoqCategory } from "@/lib/types";

interface AiGeneratorProps {
  onSuggest: (categories: BoqCategory[]) => void;
}

export function AiGenerator({ onSuggest }: AiGeneratorProps) {
  const [projectType, setProjectType] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!projectType) return;
    setLoading(true);
    try {
      const result = await suggestBoqItems({ projectType, specifications });
      
      const formattedCategories: BoqCategory[] = result.categories.map((cat, idx) => ({
        id: `cat-${Date.now()}-${idx}`,
        name: cat.name,
        items: cat.items.map((item, iIdx) => ({
          id: `item-${Date.now()}-${idx}-${iIdx}`,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }));
      
      onSuggest(formattedCategories);
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-primary/20 space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold">
        <Sparkles className="h-5 w-5 text-accent" />
        AI-Powered BOQ Builder
      </div>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-type">Project Type</Label>
          <Input 
            id="project-type" 
            placeholder="e.g. Residential Villa, Highway Construction, Office Renovation"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="specs">Specific Requirements (Optional)</Label>
          <Textarea 
            id="specs" 
            placeholder="Describe specifics like site conditions, materials preferred, or number of floors..."
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
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating BOQ Items...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Suggestions
          </>
        )}
      </Button>
      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
        Powered by Advanced Generative AI
      </p>
    </div>
  );
}