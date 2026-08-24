'use client';

import React, { useState } from 'react';
import { Heart, Plus, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { UserFavorite, Profile, Business } from '@/types/database';

interface FavoritesModuleProps {
  favorites: UserFavorite[];
  profiles: Profile[];
  businesses: Business[];
  onSaveFavorite: (fav: UserFavorite) => Promise<void>;
  onDeleteFavorite: (userId: string, businessId: string) => Promise<void>;
  searchTerm: string;
}

export default function FavoritesModule({ favorites, profiles, businesses, onSaveFavorite, onDeleteFavorite, searchTerm }: FavoritesModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [businessId, setBusinessId] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const filteredFavorites = favorites.filter((f) => {
    const profile = profiles.find((p) => p.id === f.user_id);
    const business = businesses.find((b) => b.id === f.business_id);
    return (
      (profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (business?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage) || 1;
  const paginatedFavorites = filteredFavorites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setUserId(profiles[0]?.id || '');
    setBusinessId(businesses[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!userId || !businessId) return;
    const payload: UserFavorite = {
      user_id: userId, business_id: businessId,
      created_at: new Date().toISOString(),
    };
    await onSaveFavorite(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> Comercios Favoritos de Residentes
          </h2>
          <p className="text-xs text-slate-500 mt-1">Negocios guardados como favoritos ({favorites.length})</p>
        </div>
        <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-10 flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>Agregar Favorito</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">RESIDENTE / USUARIO</th>
                <th className="py-3.5 px-4">COMERCIO FAVORITO</th>
                <th className="py-3.5 px-4">FECHA</th>
                <th className="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedFavorites.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-xs">No hay comercios favoritos registrados aún.</td></tr>
              ) : (
                paginatedFavorites.map((fav) => {
                  const profile = profiles.find((p) => p.id === fav.user_id);
                  const business = businesses.find((b) => b.id === fav.business_id);
                  return (
                    <tr key={`${fav.user_id}-${fav.business_id}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {(profile?.full_name || profile?.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate">{profile?.full_name || 'Residente'}</span>
                            <span className="text-[10px] text-slate-500 truncate">{profile?.email || 'Sin correo'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{business?.name || 'Comercio'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium text-xs">
                        {fav.created_at ? new Date(fav.created_at).toLocaleDateString() : 'Registrado'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" variant="ghost" onClick={() => onDeleteFavorite(fav.user_id, fav.business_id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredFavorites.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agregar a Favoritos</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Selecciona el Residente</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Selecciona el Comercio</label>
              <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs">Guardar Favorito</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
