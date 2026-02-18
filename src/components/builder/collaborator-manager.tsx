'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, X, Users, Mail, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Collaborator {
  id: number;
  user_email: string;
  role: string;
  created_at: string;
}

interface CollaboratorManagerProps {
  projectId: string;
  isOwner: boolean;
  userId: string;
}

export function CollaboratorManager({ projectId, isOwner, userId }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) throw new Error('Failed to fetch collaborators');
      const data = await res.json();
      setCollaborators(data);
    } catch (error) {
      console.error('Fetch collaborators error:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [projectId, isOpen]);

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.endsWith('@sdkom.co.id')) {
      toast({
        variant: 'destructive',
        title: 'Email Tidak Valid',
        description: 'Hanya email dengan domain @sdkom.co.id yang dapat ditambahkan.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), role: 'editor', userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add collaborator');
      }

      toast({
        title: 'Kolaborator Ditambahkan',
        description: `${email} sekarang dapat mengedit RAB ini.`,
      });

      setEmail('');
      fetchCollaborators();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menambahkan',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collabEmail: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(collabEmail)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to remove collaborator');

      toast({
        title: 'Kolaborator Dihapus',
        description: `${collabEmail} tidak dapat lagi mengedit RAB ini.`,
      });

      fetchCollaborators();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menghapus',
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Users className="h-4 w-4 mr-2" />
          Kolaborator
          {collaborators.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {collaborators.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola Kolaborator</DialogTitle>
          <DialogDescription>
            Tambahkan email @sdkom.co.id untuk berbagi akses edit RAB ini.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={handleAddCollaborator} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="nama@sdkom.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-600">
            Kolaborator ({collaborators.length})
          </h4>
          {isFetching ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Belum ada kolaborator.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium">{collab.user_email}</p>
                      <p className="text-xs text-slate-500 capitalize">{collab.role}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collab.user_email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isOwner && (
          <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-200">
            Anda adalah kolaborator. Hanya pemilik yang dapat menambah/menghapus kolaborator.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
