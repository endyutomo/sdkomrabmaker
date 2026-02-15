import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BuilderClient } from "@/components/builder/builder-client";
import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Builder | SDKOM RAB MAker",
  description: "Buat dan kelola Rencana Anggaran Biaya (RAB) Anda",
};

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium animate-pulse">Memuat data SDKOM RAB MAker...</p>
        </div>
      </div>
    }>
      <BuilderClient />
    </Suspense>
  );
}
