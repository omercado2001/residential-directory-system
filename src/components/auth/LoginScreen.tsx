'use client';

import React, { useState } from 'react';
import { Building2, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string) => void;
  onLoginAttempt: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
}

export default function LoginScreen({ onLoginSuccess, onLoginAttempt }: LoginScreenProps) {
  const [email, setEmail] = useState('admin@residencial.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Por favor ingresa tu correo y contraseña.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const res = await onLoginAttempt(email, password);
      if (res.success) { onLoginSuccess(email); }
      else { setErrorMsg(res.message || 'Credenciales incorrectas.'); }
    } catch {
      setErrorMsg('Error al conectar con el servidor de autenticación.');
    } finally { setIsLoading(false); }
  };

  const handleDemoFill = () => {
    setEmail('admin@residencial.com'); setPassword('admin123'); setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Directorio Residencial</h1>
          <p className="text-xs text-slate-500 font-medium">Acceso al Panel de Administración Residencial</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border border-slate-200 rounded-3xl shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" /> Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{errorMsg}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Correo Electrónico</label>
                <Input placeholder="ejemplo@residencial.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Contraseña</label>
                <Input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full rounded-full font-bold h-11 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 mt-2 flex items-center justify-center gap-2">
                <span>Ingresar al Sistema</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <Button className="w-full rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium h-9 flex items-center justify-center gap-2" variant="ghost" onClick={handleDemoFill}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Usar credenciales de prueba (admin@residencial.com)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Directorio Residencial System &copy; {new Date().getFullYear()} — Control de Accesos &amp; Comercio
        </div>
      </div>
    </div>
  );
}
