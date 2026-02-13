
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Calculator, 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  LayoutTemplate,
  CheckCircle2,
  LayoutDashboard
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight text-primary">SDKOM RAB MAker</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary transition-colors">Fitur</a>
            <a href="#workflow" className="hover:text-primary transition-colors">Alur Kerja</a>
            <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" /> Proyek Saya
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:block">
              <Button variant="ghost" className="text-primary font-bold">Masuk Dashboard</Button>
            </Link>
            <Link href="/builder">
              <Button className="boq-accent-gradient h-10 px-6 font-bold">Mulai Sekarang</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Alur Kerja Baru Berbasis AI
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-primary leading-tight">
              Buat RAB Akurat <span className="text-accent">dalam Menit</span>, Bukan Hari.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Alat Estimasi & Rencana Anggaran Biaya (RAB) profesional yang didukung oleh AI Generatif. 
              Dibuat untuk quantity surveyor, kontraktor, dan manajer proyek.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/builder">
                <Button size="lg" className="boq-accent-gradient text-white h-14 px-8 text-lg font-semibold rounded-xl w-full sm:w-auto shadow-lg shadow-primary/20">
                  Mulai Susun Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-xl border-2 w-full sm:w-auto">
                  Lihat Proyek Saya
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Cloud Sync Otomatis
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Katalog Harga Historis
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Ekspor ke Excel
              </div>
            </div>
          </div>
          
          <div className="relative animate-fade-in-up">
            <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full -z-10" />
            <div className="bg-white rounded-2xl shadow-2xl border p-2 transform rotate-2">
               <div className="bg-slate-50 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                  <img 
                    src="https://picsum.photos/seed/boq/800/600" 
                    alt="Antarmuka SDKOM RAB MAker" 
                    className="w-full h-full object-cover opacity-80"
                    data-ai-hint="construction dashboard"
                  />
               </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border flex items-center gap-4 animate-bounce">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Estimasi</p>
                <p className="font-bold text-primary">Rp 1.240.500.000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold text-primary">Segala Hal yang Anda Butuhkan untuk Estimasi Presisi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fitur profesional yang dirancang untuk mempercepat proses pembuatan RAB dengan tetap menjaga akurasi maksimal.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-6 w-6" />}
              title="Saran Item Berbasis AI"
              description="Cukup masukkan tipe proyek dan spesifikasi, AI kami akan menyarankan item dan kategori yang relevan secara otomatis."
            />
            <FeatureCard 
              icon={<LayoutTemplate className="h-6 w-6" />}
              title="Katalog Otomatis"
              description="Setiap item yang Anda masukkan akan direkam ke dalam katalog pribadi untuk digunakan kembali di proyek mendatang."
            />
            <FeatureCard 
              icon={<Calculator className="h-6 w-6" />}
              title="Kalkulasi Otomatis"
              description="Rumus cerdas menangani perkalian volume/harga, margin profit, dan rekapitulasi PPN secara real-time."
            />
            <FeatureCard 
              icon={<Download className="h-6 w-6" />}
              title="Ekspor Sekali Klik"
              description="Hasilkan laporan PDF profesional atau file Excel terstruktur yang siap untuk presentasi klien atau tender."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Penyimpanan Cloud Aman"
              description="Data RAB Anda tersimpan aman di cloud Firebase, dapat diakses kapan saja dari perangkat mana pun."
            />
            <FeatureCard 
              icon={<LayoutTemplate className="h-6 w-6" />}
              title="Kop Surat Kustom"
              description="Kelola informasi klien, nomor dokumen, dan data proyek lainnya dalam format kop surat profesional."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent opacity-10 blur-[120px] rounded-full translate-x-1/2" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-4xl font-bold">Siap untuk mempercepat alur kerja Anda?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Bergabunglah dengan ribuan profesional yang telah beralih dari spreadsheet manual ke efisiensi SDKOM RAB MAker.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/builder">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                Buat RAB Pertama Saya
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white text-white hover:bg-white/10">
                Buka Dashboard Saya
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold text-primary">SDKOM RAB MAker</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-primary">Privasi</a>
            <a href="#" className="hover:text-primary">Dukungan</a>
            <a href="#" className="hover:text-primary">Kontak</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SDKOM RAB MAker. Hak cipta dilindungi undang-undang.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow group">
      <div className="h-12 w-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:boq-accent-gradient group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-primary">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
