"use client";

import React from "react";
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
  Clock
} from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "projects"),
      orderBy("updatedAt", "desc")
    );
  }, [db, user]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!db || !user) return;
    
    if (confirm("Apakah Anda yakin ingin menghapus proyek ini?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "projects", projectId));
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
      }
    }
  };

  if (isUserLoading || isProjectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight text-primary">SDKOM RAB MAker</span>
        </div>
        <Link href="/builder">
          <Button className="boq-accent-gradient h-10 px-6 font-bold">
            <Plus className="h-5 w-5 mr-2" /> RAB Baru
          </Button>
        </Link>
      </header>

      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-primary mb-2">Proyek Saya</h1>
            <p className="text-muted-foreground">Kelola dan buka kembali dokumen RAB yang telah Anda buat dengan SDKOM RAB MAker.</p>
          </div>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center flex flex-col items-center space-y-6">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <LayoutDashboard className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Belum ada proyek</h3>
              <p className="text-slate-500 max-w-sm">Mulai buat Rencana Anggaran Biaya (RAB) pertama Anda menggunakan bantuan AI SDKOM RAB MAker.</p>
            </div>
            <Link href="/builder">
              <Button size="lg" className="boq-accent-gradient px-10 h-12 text-lg font-bold">
                Mulai Susun RAB
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/builder?id=${project.id}`}>
                <div className="bg-white rounded-2xl border p-6 hover:shadow-xl transition-all group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:boq-accent-gradient group-hover:text-white transition-colors">
                      <Logo className="h-8 w-8" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-300 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(e, project.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors line-clamp-1">
                      {project.title || "Draft Tanpa Nama"}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4 opacity-50" />
                        <span className="line-clamp-1">{project.clientName || "Klien belum diisi"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 opacity-50" />
                        <span className="line-clamp-1">{project.projectLocation || "Lokasi belum diisi"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 pt-4 border-t">
                        <Clock className="h-4 w-4" />
                        <span>Update: {project.updatedAt ? format(project.updatedAt.toDate(), "dd MMM yyyy, HH:mm", { locale: localeId }) : "Baru saja"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
