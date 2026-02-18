"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  Trash2,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Layers,
  FileText,
  Search,
  Filter,
  User as UserIcon,
  ChevronLeft,
  Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { supabase, user, isLoading: isAuthLoading } = useSupabase();
  const { toast } = useToast();

  const { data: projects, isLoading: isProjectsLoading } = useSupabaseQuery<any>(
    'projects',
    (q) => q.order('updated_at', { ascending: false })
  );

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Filter Logic
  const filteredProjects = projects?.filter((project: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (project.title?.toLowerCase() || "").includes(searchLower) ||
      (project.client_name?.toLowerCase() || "").includes(searchLower) ||
      (project.creator_name?.toLowerCase() || "").includes(searchLower);

    if (!matchesSearch) return false;

    if (filterMonth !== "all" || filterYear !== "all") {
      const projectDate = project.updated_at ? parseISO(project.updated_at) : new Date();
      if (filterYear !== "all" && projectDate.getFullYear().toString() !== filterYear) return false;
      if (filterMonth !== "all" && (projectDate.getMonth() + 1).toString() !== filterMonth) return false;
    }

    return true;
  }) || [];

  // Pagination Logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMonth, filterYear]);

  // Derived Values for Filters
  const years = Array.from(new Set(projects?.map((p: any) =>
    p.updated_at ? parseISO(p.updated_at).getFullYear().toString() : new Date().getFullYear().toString()
  ) || [])).sort((a, b) => b.localeCompare(a));


  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supabase || !user || !projectToDelete) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Proyek Dihapus",
        description: "Data RAB telah berhasil dihapus dari database.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus",
        description: "Terjadi kesalahan saat menghapus data.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  if (isAuthLoading || isProjectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats
  const totalProjects = projects?.length || 0;
  const recentProjects = projects?.filter((p: any) => {
    if (!p.updated_at) return false;
    const date = parseISO(p.updated_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date > sevenDaysAgo;
  }).length || 0;
  const totalDrafts = projects?.filter((p: any) => !p.client_name).length || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[150px] -z-10" />

      <header className="h-16 border-b bg-emerald-800/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 transition-all">
        <div className="flex items-center gap-2 group cursor-pointer">
          <Logo className="h-10 w-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-black tracking-tight text-primary bg-clip-text">SDKOM <span className="text-slate-400 font-medium italic">RAB MAker</span></span>
            <span className="text-[10px] font-light text-slate-400/80 tracking-tight">create by Endy Akbbar</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pengaturan
            </Button>
          </Link>
          <Link href="/builder">
            <Button className="boq-accent-gradient h-10 px-6 font-extrabold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Plus className="h-5 w-5 mr-1.5" /> RAB Baru
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full z-10">
        <div className="mb-10 space-y-8">
          <div>
            <h1 className="text-5xl font-black text-primary mb-3 tracking-tighter">Proyek Saya</h1>
            <p className="text-lg text-slate-500 font-medium">Platform cerdas untuk estimasi RAB profesional di Indonesia.</p>
          </div>

          {/* Stats Summary - Glass Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="boq-glass p-6 rounded-2xl flex items-center gap-5 border-white/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-emerald-500/25">
              <div className="h-14 w-14 rounded-xl boq-accent-gradient flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Proyek</p>
                <p className="text-3xl font-black text-primary">{totalProjects}</p>
              </div>
            </div>

            <div className="boq-glass p-6 rounded-2xl flex items-center gap-5 border-white/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-emerald-500/25">
              <div className="h-14 w-14 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Layers className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Update Minggu Ini</p>
                <p className="text-3xl font-black text-primary">{recentProjects}</p>
              </div>
            </div>

            <div className="boq-glass p-6 rounded-2xl flex items-center gap-5 border-white/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-emerald-500/25">
              <div className="h-14 w-14 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Draft Proyek</p>
                <p className="text-3xl font-black text-primary">{totalDrafts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 boq-glass p-3 rounded-2xl flex flex-col md:flex-row gap-3 border-white/40">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Cari berdasarkan judul, klien, atau pembuat..."
              className="pl-10 h-11 border-none bg-slate-50/50 dark:bg-slate-800/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px] h-11 border-none bg-slate-50/50 dark:bg-slate-800/50 rounded-xl font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Bulan" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Bulan</SelectItem>
                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                  <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[120px] h-11 border-none bg-slate-50/50 dark:bg-slate-800/50 rounded-xl font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Tahun" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="boq-glass rounded-[40px] border-dashed border-slate-300 p-20 text-center flex flex-col items-center space-y-8 border-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-emerald-500/25 transition-all duration-500">
            <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center text-primary animate-bounce">
              <Logo className="h-16 w-16" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Belum Ada Proyek RAB</h3>
              <p className="text-slate-500 max-w-sm text-lg leading-relaxed">Gunakan kekuatan AI untuk menyusun RAB profesional dalam hitungan menit.</p>
            </div>
            <Link href="/builder">
              <Button size="lg" className="boq-accent-gradient px-12 h-14 text-xl font-black shadow-xl shadow-primary/20">
                Mulai RAB Pertama
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedProjects.map((project: any) => (
                <Link key={project.id} href={`/builder?id=${project.id}`} className="group relative">
                  <div className="boq-glass h-full rounded-[2rem] border-white/40 p-8 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-emerald-500/25 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-14 w-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:boq-accent-gradient group-hover:text-white transition-all duration-500 shadow-sm">
                        <Logo className="h-10 w-10 transition-transform group-hover:scale-110" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10 transition-colors"
                        onClick={(e) => handleDelete(e, project.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4 flex-1">
                      <h3 className="text-2xl font-black text-primary group-hover:text-accent transition-colors line-clamp-1 tracking-tight">
                        {project.title || "Draft RAB"}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100/50 dark:border-white/5">
                          <Building2 className="h-5 w-5 text-primary/40" />
                          <span className="font-bold text-sm truncate">{project.client_name || "Tanpa Klien"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100/50 dark:border-white/5">
                          <UserIcon className="h-5 w-5 text-primary/40" />
                          <span className="font-bold text-sm truncate">{project.creator_name || "Endy Akbbar"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100/50 dark:border-white/5">
                          <MapPin className="h-5 w-5 text-primary/40" />
                          <span className="font-bold text-sm truncate">{project.project_location || "Lokasi Belum Diatur"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100/50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{project.updated_at ? format(parseISO(project.updated_at), "dd MMM yyyy", { locale: localeId }) : "Hari Ini"}</span>
                      </div>

                      <div className="h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 overflow-hidden">
                        <ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-11 w-11 boq-glass border-white/40 disabled:opacity-30"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-1.5 px-3">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      className={cn(
                        "h-11 w-11 rounded-xl font-bold transition-all",
                        currentPage === i + 1
                          ? "boq-accent-gradient border-none shadow-lg shadow-primary/20"
                          : "boq-glass border-white/40 hover:bg-white"
                      )}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-11 w-11 boq-glass border-white/40 disabled:opacity-30"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}

            {filteredProjects.length === 0 && searchQuery !== "" && (
              <div className="text-center py-20 boq-glass rounded-[2rem] border-white/40">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tidak ada hasil ditemukan</h3>
                <p className="text-slate-500">Coba ubah kata kunci atau bersihkan filter Anda.</p>
                <Button
                  variant="ghost"
                  className="mt-4 text-primary font-bold"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterMonth("all");
                    setFilterYear("all");
                  }}
                >
                  Reset Pencarian
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="boq-glass border-white/40 rounded-[2rem] p-8 shadow-2xl">
            <AlertDialogHeader className="space-y-4">
              <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-2">
                <Trash2 className="h-7 w-7" />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-primary tracking-tight">
                Hapus Proyek RAB?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-base font-medium">
                Tindakan ini tidak dapat dibatalkan. Seluruh data estimasi harga dan item pada proyek ini akan dihapus secara permanen dari server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="h-12 px-6 rounded-xl font-bold border-slate-200 hover:bg-slate-50 transition-all">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="h-12 px-6 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white transition-all shadow-lg shadow-destructive/20"
              >
                Ya, Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
