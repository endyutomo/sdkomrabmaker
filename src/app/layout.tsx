import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

export const metadata: Metadata = {
  title: 'SDKOM RAB MAker | RAB Berbasis AI',
  description: 'Buat Rencana Anggaran Biaya (RAB) profesional dengan cepat menggunakan AI Generatif. Alat estimasi konstruksi profesional.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://js.puter.com/v2/"></script>
      </head>
      <body className="font-body antialiased">
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
