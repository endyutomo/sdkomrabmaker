"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Palette, 
  Type, 
  Layout, 
  Save, 
  RotateCcw, 
  Eye,
  Moon,
  Sun,
  Download,
  Upload
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";

interface ThemeSettings {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  accent: string;
  muted: string;
  border: string;
  fontSize: number;
  fontFamily: string;
  borderRadius: number;
  shadowIntensity: number;
}

const defaultSettings: ThemeSettings = {
  background: "hsl(240, 16%, 15%)",
  foreground: "hsl(240, 16%, 93%)",
  card: "hsl(240, 16%, 20%)",
  cardForeground: "hsl(240, 16%, 93%)",
  primary: "hsl(238, 52%, 38%)",
  accent: "hsl(283, 100%, 52%)",
  muted: "hsl(240, 16%, 30%)",
  border: "hsl(240, 16%, 25%)",
  fontSize: 16,
  fontFamily: "Inter",
  borderRadius: 12,
  shadowIntensity: 50
};

// Helper functions for color conversion
function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return '#ffffff';
  
  const [, h, s, l] = match.map(Number);
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  
  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lDecimal - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
  
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  
  return `#${rHex}${gHex}${bHex}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'hsl(0, 0%, 100%)';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}

const presetThemes = {
  dark: {
    background: "hsl(240, 16%, 15%)",
    foreground: "hsl(240, 16%, 93%)",
    card: "hsl(240, 16%, 20%)",
    cardForeground: "hsl(240, 16%, 93%)",
    primary: "hsl(238, 52%, 38%)",
    accent: "hsl(283, 100%, 52%)",
    muted: "hsl(240, 16%, 30%)",
    border: "hsl(240, 16%, 25%)",
  },
  light: {
    background: "hsl(240, 16%, 93%)",
    foreground: "hsl(238, 52%, 10%)",
    card: "hsl(0, 0%, 100%)",
    cardForeground: "hsl(238, 52%, 10%)",
    primary: "hsl(238, 52%, 38%)",
    accent: "hsl(283, 100%, 52%)",
    muted: "hsl(240, 10%, 85%)",
    border: "hsl(240, 5.9%, 85%)",
  },
  ocean: {
    background: "hsl(210, 40%, 8%)",
    foreground: "hsl(210, 40%, 95%)",
    card: "hsl(210, 40%, 12%)",
    cardForeground: "hsl(210, 40%, 95%)",
    primary: "hsl(199, 89%, 48%)",
    accent: "hsl(189, 94%, 43%)",
    muted: "hsl(210, 40%, 20%)",
    border: "hsl(210, 40%, 25%)",
  },
  emerald: {
    background: "hsl(150, 20%, 8%)",
    foreground: "hsl(150, 20%, 95%)",
    card: "hsl(150, 20%, 12%)",
    cardForeground: "hsl(150, 20%, 95%)",
    primary: "hsl(142, 71%, 45%)",
    accent: "hsl(160, 84%, 39%)",
    muted: "hsl(150, 20%, 20%)",
    border: "hsl(150, 20%, 25%)",
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('theme-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }

    // Load dark mode preference
    const darkMode = localStorage.getItem('dark-mode') === 'true';
    setIsDarkMode(darkMode);
  }, []);

  const applySettings = () => {
    const root = document.documentElement;
    
    // Convert HSL strings to proper format for CSS variables
    const hslToCssVar = (hslString: string) => {
      // Extract HSL values from string like "hsl(142, 71%, 15%)"
      const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        return `${match[1]} ${match[2]}% ${match[3]}%`;
      }
      return hslString;
    };
    
    // Apply CSS custom properties with proper HSL format
    root.style.setProperty('--background', hslToCssVar(settings.background));
    root.style.setProperty('--foreground', hslToCssVar(settings.foreground));
    root.style.setProperty('--card', hslToCssVar(settings.card));
    root.style.setProperty('--card-foreground', hslToCssVar(settings.cardForeground));
    root.style.setProperty('--primary', hslToCssVar(settings.primary));
    root.style.setProperty('--accent', hslToCssVar(settings.accent));
    root.style.setProperty('--muted', hslToCssVar(settings.muted));
    root.style.setProperty('--border', hslToCssVar(settings.border));
    root.style.setProperty('--radius', `${settings.borderRadius}px`);
    
    // Apply font settings
    root.style.fontSize = `${settings.fontSize}px`;
    root.style.fontFamily = settings.fontFamily;
    
    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme-settings', JSON.stringify(settings));
    localStorage.setItem('dark-mode', isDarkMode.toString());

    toast({
      title: "Pengaturan Disimpan",
      description: "Tema telah diterapkan ke seluruh aplikasi.",
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setIsDarkMode(true);
    
    const root = document.documentElement;
    root.classList.add('dark');
    
    // Remove all custom CSS properties to revert to CSS file defaults
    const cssVars = ['--background', '--foreground', '--card', '--card-foreground', '--primary', '--accent', '--muted', '--border', '--radius'];
    cssVars.forEach(varName => {
      root.style.removeProperty(varName);
    });
    
    // Reset font settings
    root.style.fontSize = '';
    root.style.fontFamily = '';
    
    localStorage.removeItem('theme-settings');
    localStorage.setItem('dark-mode', 'true');

    toast({
      title: "Pengaturan Direset",
      description: "Kembali ke pengaturan default.",
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify({ ...settings, isDarkMode }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'theme-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings({ ...defaultSettings, ...imported });
          if (imported.isDarkMode !== undefined) {
            setIsDarkMode(imported.isDarkMode);
          }
          toast({
            title: "Pengaturan Diimpor",
            description: "Pengaturan berhasil diimpor dari file.",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Import Gagal",
            description: "File pengaturan tidak valid.",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const applyPresetTheme = (themeName: keyof typeof presetThemes) => {
    const theme = presetThemes[themeName];
    const newSettings = { ...settings, ...theme };
    setSettings(newSettings);
    
    if (themeName === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }
    
    // Apply immediately
    const root = document.documentElement;
    
    // Convert HSL strings to proper format for CSS variables
    const hslToCssVar = (hslString: string) => {
      const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        return `${match[1]} ${match[2]}% ${match[3]}%`;
      }
      return hslString;
    };
    
    // Apply CSS custom properties
    Object.entries(theme).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, hslToCssVar(value));
    });
    
    // Apply dark mode class
    if (themeName === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pengaturan Tema</h1>
              <p className="text-muted-foreground">Kustomisasi warna, font, dan tampilan aplikasi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Kembali
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Warna
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Tema
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Warna Kustom</CardTitle>
                <CardDescription>
                  Sesuaikan warna untuk setiap elemen aplikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="background">Background</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background"
                        type="color"
                        value={settings.background}
                        onChange={(e) => setSettings(prev => ({ ...prev, background: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.background}
                        onChange={(e) => setSettings(prev => ({ ...prev, background: e.target.value }))}
                        placeholder="hsl(240, 16%, 15%)"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="foreground">Foreground (Teks)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="foreground"
                        type="color"
                        value={settings.foreground}
                        onChange={(e) => setSettings(prev => ({ ...prev, foreground: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.foreground}
                        onChange={(e) => setSettings(prev => ({ ...prev, foreground: e.target.value }))}
                        placeholder="hsl(240, 16%, 93%)"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primary">Primary</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary"
                        type="color"
                        value={settings.primary}
                        onChange={(e) => setSettings(prev => ({ ...prev, primary: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.primary}
                        onChange={(e) => setSettings(prev => ({ ...prev, primary: e.target.value }))}
                        placeholder="hsl(238, 52%, 38%)"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accent">Accent</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent"
                        type="color"
                        value={settings.accent}
                        onChange={(e) => setSettings(prev => ({ ...prev, accent: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.accent}
                        onChange={(e) => setSettings(prev => ({ ...prev, accent: e.target.value }))}
                        placeholder="hsl(283, 100%, 52%)"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="card">Card</Label>
                    <div className="flex gap-2">
                      <Input
                        id="card"
                        type="color"
                        value={settings.card}
                        onChange={(e) => setSettings(prev => ({ ...prev, card: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.card}
                        onChange={(e) => setSettings(prev => ({ ...prev, card: e.target.value }))}
                        placeholder="hsl(240, 16%, 20%)"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="border">Border</Label>
                    <div className="flex gap-2">
                      <Input
                        id="border"
                        type="color"
                        value={settings.border}
                        onChange={(e) => setSettings(prev => ({ ...prev, border: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={settings.border}
                        onChange={(e) => setSettings(prev => ({ ...prev, border: e.target.value }))}
                        placeholder="hsl(240, 16%, 25%)"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Font</CardTitle>
                <CardDescription>
                  Sesuaikan ukuran, jenis, dan warna font untuk keterbacaan optimal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Jenis Font</Label>
                  <Select value={settings.fontFamily} onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Default)</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Nunito">Nunito</SelectItem>
                      <SelectItem value="Raleway">Raleway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Ukuran Font: {settings.fontSize}px</Label>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={24}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, fontSize: value[0] }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Warna Font (Teks)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Pilih warna teks yang kontras dengan background hijau tua
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      key="color-white"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(0, 0%, 100%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(0, 0%, 100%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-300"></div>
                      <span className="text-xs">Putih</span>
                    </Button>
                    <Button
                      key="color-cream"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(60, 100%, 95%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(60, 100%, 95%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FEF3C7] border border-slate-300"></div>
                      <span className="text-xs">Cream</span>
                    </Button>
                    <Button
                      key="color-blue"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(200, 100%, 95%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(200, 100%, 95%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#E0F2FE] border border-slate-300"></div>
                      <span className="text-xs">Biru Muda</span>
                    </Button>
                    <Button
                      key="color-green"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(150, 100%, 95%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(150, 100%, 95%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#ECFDF5] border border-slate-300"></div>
                      <span className="text-xs">Hijau Muda</span>
                    </Button>
                    <Button
                      key="color-yellow"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(30, 100%, 95%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(30, 100%, 95%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FFFBEB] border border-slate-300"></div>
                      <span className="text-xs">Kuning Muda</span>
                    </Button>
                    <Button
                      key="color-purple"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(280, 100%, 95%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(280, 100%, 95%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FAF5FF] border border-slate-300"></div>
                      <span className="text-xs">Ungu Muda</span>
                    </Button>
                    <Button
                      key="color-red"
                      variant="outline"
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${settings.foreground === 'hsl(340, 100%, 95%)' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, foreground: 'hsl(340, 100%, 95%)' }))}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#FFF1F2] border border-slate-300"></div>
                      <span className="text-xs">Merah Muda</span>
                    </Button>
                    <div key="color-custom" className="flex flex-col gap-2">
                      <Input
                        type="color"
                        value={hslToHex(settings.foreground)}
                        onChange={(e) => {
                          const newHsl = hexToHsl(e.target.value);
                          setSettings(prev => ({ ...prev, foreground: newHsl }));
                        }}
                        className="h-8 w-full cursor-pointer"
                      />
                      <span className="text-xs text-center text-muted-foreground">Kustom</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg" style={{ backgroundColor: settings.card }}>
                  <p style={{ 
                    fontSize: `${settings.fontSize}px`, 
                    fontFamily: settings.fontFamily,
                    color: settings.foreground
                  }}>
                    Ini adalah contoh teks dengan pengaturan font yang dipilih. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Layout</CardTitle>
                <CardDescription>
                  Sesuaikan border radius dan efek visual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius: {settings.borderRadius}px</Label>
                  <Slider
                    id="borderRadius"
                    min={0}
                    max={24}
                    step={1}
                    value={[settings.borderRadius]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, borderRadius: value[0] }))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shadowIntensity">Intensitas Shadow: {settings.shadowIntensity}%</Label>
                  <Slider
                    id="shadowIntensity"
                    min={0}
                    max={100}
                    step={5}
                    value={[settings.shadowIntensity]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, shadowIntensity: value[0] }))}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="darkMode"
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                  />
                  <Label htmlFor="darkMode">Mode Gelap</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tema Preset</CardTitle>
                <CardDescription>
                  Pilih dari tema yang sudah disiapkan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => applyPresetTheme('dark')}
                  >
                    <div className="w-full h-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded"></div>
                    <span>Dark Mode</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => applyPresetTheme('light')}
                  >
                    <div className="w-full h-8 bg-gradient-to-r from-gray-100 to-white rounded"></div>
                    <span>Light Mode</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => applyPresetTheme('ocean')}
                  >
                    <div className="w-full h-8 bg-gradient-to-r from-blue-900 to-cyan-800 rounded"></div>
                    <span>Ocean</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    onClick={() => applyPresetTheme('emerald')}
                  >
                    <div className="w-full h-8 bg-gradient-to-r from-emerald-900 to-green-800 rounded"></div>
                    <span>Emerald</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Button onClick={applySettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Terapkan Pengaturan
              </Button>
              
              <Button variant="outline" onClick={resetSettings} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset ke Default
              </Button>
              
              <Button variant="outline" onClick={exportSettings} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
