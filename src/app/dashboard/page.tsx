"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Settings,
  LogOut,
  Users,
  Bell,
  RefreshCw,
  AlertCircle
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const router = useRouter();
  const { supabase, user, isLoading: isAuthLoading } = useSupabase();
  const { toast } = useToast();

  // Check if user is authenticated with email
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/auth');
        return;
      }

      const email = user.email;
      if (!email?.endsWith('@sdkom.co.id')) {
        toast({
          variant: 'destructive',
          title: 'Email Tidak Diizinkan',
          description: 'Hanya email dengan domain @sdkom.co.id yang dapat mengakses dashboard.',
        });
        supabase.auth.signOut();
        router.push('/auth');
      }
    }
  }, [user, isAuthLoading, supabase, router, toast]);

  const { data: ownedProjects, isLoading: isOwnedLoading, error: projectsError } = useSupabaseQuery<any>(
    'projects',
    (q) => q.order('updated_at', { ascending: false })
  );

  // Query collaboration projects
  const [collaborationProjects, setCollaborationProjects] = useState<any[]>([]);
  const [isCollabLoading, setIsCollabLoading] = useState(true);
  const [collabError, setCollabError] = useState<any>(null);

  const fetchCollaborations = useCallback(async () => {
    if (!user || !user.email) {
      setIsCollabLoading(false);
      return;
    }
    
    try {
      setIsCollabLoading(true);
      setCollabError(null);
      
      // Use API endpoint that uses service-role (bypasses RLS)
      const response = await fetch(`/api/collaborations?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id)}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Collaboration API error:', error);
        setCollaborationProjects([]);
        return;
      }

      const collaborationData = await response.json();
      console.log(`Loaded ${collaborationData.length} collaboration project(s) via API`);
      setCollaborationProjects(collaborationData);
      
    } catch (error: any) {
      console.error('Error fetching collaborations:', error);
      setCollaborationProjects([]);
    } finally {
      setIsCollabLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollaborations();
  }, [fetchCollaborations]);

  // Auto-refresh when window gains focus (untuk refresh data saat kembali dari builder)
  useEffect(() => {
    const handleFocus = () => {
      fetchCollaborations();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchCollaborations]);

  // Merge owned and collaboration projects with deduplication
  const ownedProjectsList = ownedProjects || [];
  const ownedProjectIds = new Set(ownedProjectsList.map((p: any) => p.id));
  
  // Filter out collaboration projects that are already in owned projects (avoid duplicates)
  const uniqueCollaborationProjects = collaborationProjects.filter(
    (p: any) => !ownedProjectIds.has(p.id)
  );
  
  const allProjects = [
    ...ownedProjectsList.map((p: any) => ({ ...p, isOwned: true })),
    ...uniqueCollaborationProjects
  ];
  
  const projects = allProjects;
  const isProjectsLoading = isOwnedLoading || isCollabLoading;

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari aplikasi.',
      });
      router.push('/auth');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logout Gagal',
        description: error.message,
      });
    }
  };

  // Mark collaboration notification as read
  const markCollaborationAsRead = async (collaborationId: number) => {
    if (!collaborationId) return;
    
    try {
      await supabase
        .from('project_collaborators')
        .update({ notified: true })
        .eq('id', collaborationId);
      
      // Update local state
      setCollaborationProjects(prev => 
        prev.map(p => p.collaborationId === collaborationId ? { ...p, notified: true } : p)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Count unread collaboration notifications
  const unreadCount = collaborationProjects.filter(p => !p.notified).length;

  // Show loading only for auth - don't block on projects loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
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
            <span className="text-[10px] font-light text-slate-400/80 tracking-tight">Created By Akbar Endi</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchCollaborations()}
            disabled={isCollabLoading}
            className="flex items-center gap-2"
            title="Refresh data kolaborasi"
          >
            <RefreshCw className={cn("h-4 w-4", isCollabLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {unreadCount > 0 && (
            <div className="relative">
              <Button variant="outline" size="sm" className="flex items-center gap-2 relative">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifikasi</span>
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              </Button>
            </div>
          )}
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pengaturan
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-600"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <Link href="/builder">
            <Button className="boq-accent-gradient h-10 px-6 font-extrabold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Plus className="h-5 w-5 mr-1.5" /> RAB Baru
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full z-10">
        {/* Show error only if it's a timeout or critical error */}
        {(projectsError?.code === 'TIMEOUT' || collabError?.code === 'TIMEOUT' || 
          (projectsError && !projectsError.code && projectsError.message?.includes('timeout')) ||
          (collabError && !collabError.code && collabError.message?.includes('timeout'))) && (
          <Alert variant="destructive" className="mb-6 border-2 border-red-500">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold text-lg">⚠️ Database Timeout - Action Required!</AlertTitle>
            <AlertDescription className="space-y-3">
              <p className="font-semibold">Query timeout terdeteksi. Ini biasanya disebabkan oleh Row Level Security (RLS) policies yang tidak dikonfigurasi dengan benar di Supabase.</p>
              
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900">
                <p className="font-bold mb-2">🔧 LANGKAH PERBAIKAN:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Buka <strong>Supabase Dashboard</strong> Anda</li>
                  <li>Pilih menu <strong>SQL Editor</strong> di sidebar</li>
                  <li>Copy seluruh isi file <code className="bg-red-200 dark:bg-red-900 px-2 py-1 rounded font-mono">fix-rls-recursion.sql</code></li>
                  <li>Paste dan <strong>Run</strong> script tersebut</li>
                  <li>Klik tombol <strong>Refresh</strong> di header setelah selesai</li>
                </ol>
              </div>
              
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold hover:underline">Detail Error (untuk debugging)</summary>
                <div className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded">
                  {projectsError && <p>Projects: {projectsError?.message}</p>}
                  {collabError && <p>Collaborations: {collabError?.message}</p>}
                </div>
              </details>
            </AlertDescription>
          </Alert>
        )}
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

        {/* Loading state */}
        {isProjectsLoading ? (
          <div className="boq-glass rounded-[40px] p-20 text-center flex flex-col items-center space-y-8 border-2 border-white/40">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Memuat Proyek...</h3>
              <p className="text-slate-500 max-w-sm text-lg leading-relaxed">Silakan tunggu sebentar</p>
            </div>
          </div>
        ) : !projects || projects.length === 0 ? (
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
                <Link 
                  key={project.id} 
                  href={`/builder?id=${project.id}`} 
                  className="group relative"
                  onClick={() => {
                    if (project.isCollaboration && !project.notified) {
                      markCollaborationAsRead(project.collaborationId);
                    }
                  }}
                >
                  <div className="boq-glass h-full rounded-[2rem] border-white/40 p-8 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-emerald-500/25 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-14 w-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:boq-accent-gradient group-hover:text-white transition-all duration-500 shadow-sm">
                        <Logo className="h-10 w-10 transition-transform group-hover:scale-110" />
                      </div>
                      {/* Only show delete button for owned projects */}
                      {!project.isCollaboration && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10 transition-colors"
                          onClick={(e) => handleDelete(e, project.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="text-2xl font-black text-primary group-hover:text-accent transition-colors line-clamp-1 tracking-tight flex-1">
                          {project.title || "Draft RAB"}
                        </h3>
                        {project.isCollaboration && (
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                              <Users className="h-3 w-3 mr-1" />
                              Kolaborasi
                            </Badge>
                            {!project.notified && (
                              <Badge variant="default" className="bg-red-500 text-white text-[10px] font-bold animate-pulse">
                                <Bell className="h-3 w-3 mr-1" />
                                New
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

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
