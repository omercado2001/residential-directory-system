'use client';

import React, { useState } from 'react';
import { Tag, Plus, Edit, Trash2, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { Promotion, Business, Category } from '@/types/database';

interface PromotionsModuleProps {
  promotions: Promotion[];
  businesses: Business[];
  categories: Category[];
  onSavePromotion: (promo: Promotion) => Promise<void>;
  onDeletePromotion: (id: string) => Promise<void>;
  searchTerm: string;
}

export default function PromotionsModule({ promotions, businesses, categories, onSavePromotion, onDeletePromotion, searchTerm }: PromotionsModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [businessId, setBusinessId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [image, setImage] = useState('');
  const [ribbon, setRibbon] = useState('');

  const filteredPromotions = promotions.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage) || 1;
  const paginatedPromotions = filteredPromotions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingPromo(null);
    setBusinessId(businesses[0]?.id || ''); setCategoryId(categories[0]?.id || '');
    setTitle(''); setDescription(''); setBadge(''); setValidUntil(''); setImage(''); setRibbon('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setBusinessId(p.business_id); setCategoryId(p.category_id || '');
    setTitle(p.title); setDescription(p.description || ''); setBadge(p.badge || '');
    setValidUntil(p.valid_until ? p.valid_until.split('T')[0] : '');
    setImage(p.image || ''); setRibbon(p.ribbon || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !businessId) return;
    const payload: Promotion = {
      id: editingPromo?.id || crypto.randomUUID(),
      business_id: businessId, category_id: categoryId, title, description,
      badge, valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      image, ribbon,
      created_at: editingPromo?.created_at || new Date().toISOString(),
    };
    await onSavePromotion(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Tag className="w-5 h-5 text-amber-500" /> Avisos y Promociones
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ofertas y campañas activas ({promotions.length})</p>
        </div>
        <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-9 flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>Nueva Promoción</span>
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedPromotions.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 p-12 text-center text-slate-500 text-xs rounded-2xl shadow-xs">
            No hay promociones activas registradas.
          </div>
        ) : (
          paginatedPromotions.map((promo) => {
            const business = businesses.find((b) => b.id === promo.business_id);
            return (
              <Card key={promo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs">
                {promo.image && (
                  <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    {promo.ribbon && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white shadow-md">{promo.ribbon}</span>
                    )}
                    {promo.badge && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white shadow-md">{promo.badge}</span>
                    )}
                  </div>
                )}
                <CardContent className="p-5 flex-1 space-y-2">
                  <h3 className="font-bold text-base text-slate-900 truncate">{promo.title}</h3>
                  {promo.description && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{promo.description}</p>}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{business?.name || 'Comercio'}</span>
                  </div>
                  {promo.valid_until && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Válido hasta: {new Date(promo.valid_until).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <Button onClick={() => openEditModal(promo)} className="px-3 h-8 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5" variant="ghost">
                    <Edit className="w-3.5 h-3.5" /><span>Editar</span>
                  </Button>
                  <Button onClick={() => onDeletePromotion(promo.id)} className="w-8 h-8 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg" variant="ghost">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Grid Pagination */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPromotions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[6, 9, 18, 36]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Título de la Promoción</label>
              <Input placeholder="Ej. 2x1 en Tajadas con Queso" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Comercio</label>
                <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Categoría</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Etiqueta (ej. 2x1 / 20% OFF)</label>
                <Input placeholder="2x1" value={badge} onChange={(e) => setBadge(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Fecha Límite</label>
                <Input placeholder="YYYY-MM-DD" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Distintivo (ej. Popular)</label>
                <Input placeholder="Popular" value={ribbon} onChange={(e) => setRibbon(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Imagen de la Promoción (enlace web)</label>
              <Input placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Descripción de la Oferta</label>
              <Textarea placeholder="Escribe las condiciones o detalles del aviso" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs">Guardar Promoción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
