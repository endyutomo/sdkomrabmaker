'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const ALLOWED_DOMAIN = 'sdkom.co.id';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { supabase } = useSupabase();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const validateDomain = (emailAddress: string) => {
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    return domain === ALLOWED_DOMAIN;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email dan password harus diisi.',
      });
      return;
    }

    if (!validateDomain(email)) {
      toast({
        variant: 'destructive',
        title: 'Domain Tidak Valid',
        description: `Hanya email dengan domain @${ALLOWED_DOMAIN} yang diizinkan.`,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password Terlalu Pendek',
        description: 'Password harus minimal 6 karakter.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        toast({
          title: 'Sign Up Berhasil',
          description: 'Cek email Anda untuk verifikasi akun.',
        });
        setIsSignUp(false);
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Login Berhasil',
          description: 'Redirecting ke builder...',
        });

        router.push('/builder');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Gagal' : 'Login Gagal',
        description: error.message || 'Terjadi kesalahan.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <Logo className="h-10 w-10" />
          </div>
          <CardTitle className="text-center text-2xl">
            SDKOM <span className="font-light italic text-slate-400">RAB MAker</span>
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? 'Buat Akun Baru' : 'Login dengan Email SDKOM'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={`nama@${ALLOWED_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {email && !validateDomain(email) && (
                <p className="text-xs text-red-500">
                  Email harus menggunakan domain @{ALLOWED_DOMAIN}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="boq-accent-gradient w-full text-white font-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSignUp ? 'Buat Akun' : 'Login'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
              }}
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Informasi:</strong> Hanya email dengan domain @{ALLOWED_DOMAIN} yang dapat login. Hubungi admin untuk akun baru.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
