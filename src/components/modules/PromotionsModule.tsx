'use client';

import React, { useState } from 'react';
import { Tag, Plus, Edit, Trash2, Calendar, Building2, ImageOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Promotion, Business, Category } from '@/types/database';
import { toast } from 'sonner';

interface PromotionsModuleProps {
  promotions: Promotion[];
  businesses: Business[];
  categories: Category[];
  onSavePromotion: (promo: Promotion) => Promise<void>;
  onDeletePromotion: (id: string) => Promise<void>;
  searchTerm: string;
  canEdit?: boolean;
}

export default function PromotionsModule({
  promotions,
  businesses,
  categories,
  onSavePromotion,
  onDeletePromotion,
  searchTerm,
  canEdit = true,
}: PromotionsModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Confirmation state
  const [confirmDeletePromo, setConfirmDeletePromo] = useState<Promotion | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<Promotion | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [businessId, setBusinessId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('#ef4444');
  const [validUntil, setValidUntil] = useState('');
  const [image, setImage] = useState('');
  const [ribbon, setRibbon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const initialBiz = businesses[0];
    const initialCat = initialBiz?.category_id || categories[0]?.id || '';
    setBusinessId(initialBiz?.id || '');
    setCategoryId(initialCat);
    setTitle('');
    setDescription('');
    setBadge('');
    setBadgeColor('#ef4444');
    setValidUntil('');
    setImage('');
    setRibbon('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setBusinessId(p.business_id);
    const biz = businesses.find((b) => b.id === p.business_id);
    setCategoryId(p.category_id || biz?.category_id || '');
    setTitle(p.title);
    setDescription(p.description || '');
    setBadge(p.badge || '');
    setBadgeColor(p.badge_color || '#ef4444');
    setValidUntil(p.valid_until ? p.valid_until.split('T')[0] : '');
    setImage(p.image || '');
    setRibbon(p.ribbon || '');
    setIsModalOpen(true);
  };

  const handleBusinessChange = (selectedBizId: string) => {
    setBusinessId(selectedBizId);
    const biz = businesses.find((b) => b.id === selectedBizId);
    if (biz?.category_id) {
      setCategoryId(biz.category_id);
    }
  };

  const handleFormSubmit = async () => {
    const trimmedTitle = title.trim();
    const finalBizId = businessId || businesses[0]?.id;

    if (!trimmedTitle) {
      toast.error('Por favor ingresa el título de la promoción');
      return;
    }

    if (!finalBizId) {
      toast.error('Debes seleccionar un comercio para la promoción');
      return;
    }

    const selectedBiz = businesses.find((b) => b.id === finalBizId);
    const finalCatId = categoryId || selectedBiz?.category_id || categories[0]?.id || '';

    const formattedDate = validUntil && validUntil.trim() ? validUntil.trim().split('T')[0] : null;

    const payload: Promotion = {
      id: editingPromo?.id || crypto.randomUUID(),
      business_id: finalBizId,
      category_id: finalCatId,
      title: trimmedTitle,
      description: description.trim() || null,
      badge: badge.trim() || null,
      badge_color: badgeColor || '#ef4444',
      valid_until: formattedDate,
      image: image || null,
      ribbon: ribbon.trim() || null,
      created_at: editingPromo?.created_at || new Date().toISOString(),
    };

    if (editingPromo) {
      setConfirmUpdatePayload(payload);
    } else {
      setIsSubmitting(true);
      try {
        await onSavePromotion(payload);
        setIsModalOpen(false);
      } catch (err: any) {
        toast.error(`Error al guardar: ${err?.message || 'Fallo de conexión'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const executeUpdate = async () => {
    if (!confirmUpdatePayload) return;
    setIsSubmitting(true);
    try {
      await onSavePromotion(confirmUpdatePayload);
      setConfirmUpdatePayload(null);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeletePromo) return;
    await onDeletePromotion(confirmDeletePromo.id);
    setConfirmDeletePromo(null);
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
        {canEdit ? (
          <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-9 flex items-center gap-2">
            <Plus className="w-4 h-4" /><span>Nueva Promoción</span>
          </Button>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Modo Solo Consulta
          </span>
        )}
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
              <Card key={promo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs hover:border-slate-300 transition-all">
                {promo.image ? (
                  <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    {promo.ribbon && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white shadow-md">
                        {promo.ribbon}
                      </span>
                    )}
                    {promo.badge && (
                      <span
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-md"
                        style={{ backgroundColor: promo.badge_color || '#ef4444' }}
                      >
                        {promo.badge}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative h-28 w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-slate-200 flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Tag className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{business?.name || 'Comercio'}</span>
                    </div>
                    {promo.badge && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-xs"
                        style={{ backgroundColor: promo.badge_color || '#ef4444' }}
                      >
                        {promo.badge}
                      </span>
                    )}
                  </div>
                )}

                <CardContent className="p-5 flex-1 space-y-2.5">
                  <h3 className="font-bold text-base text-slate-900 truncate" title={promo.title}>
                    {promo.title}
                  </h3>
                  {promo.description ? (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{promo.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin descripción</p>
                  )}
                  <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{business?.name || 'Comercio'}</span>
                    </div>
                    {promo.valid_until && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Válido hasta: {promo.valid_until}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                {canEdit && (
                  <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <Button onClick={() => openEditModal(promo)} className="px-3 h-8 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5" variant="ghost">
                      <Edit className="w-3.5 h-3.5" /><span>Editar</span>
                    </Button>
                    <Button onClick={() => setConfirmDeletePromo(promo)} className="w-8 h-8 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg" variant="ghost">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardFooter>
                )}
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
                <SearchableSelect
                  options={businesses.map((b) => ({
                    value: b.id,
                    label: b.name,
                    sublabel: b.address || b.tags || undefined,
                    icon: Building2,
                  }))}
                  value={businessId}
                  onChange={(val) => handleBusinessChange(val)}
                  placeholder="Selecciona un comercio..."
                  searchPlaceholder="Escribe para buscar comercio..."
                  icon={Building2}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 text-xs font-semibold block">Categoría</label>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                    Auto-enlazada al comercio
                  </span>
                </div>
                <SearchableSelect
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Selecciona una categoría..."
                  searchPlaceholder="Escribe para buscar categoría..."
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Etiqueta (ej. 2x1)</label>
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

            <ImageDropzone
              label="Imagen de la Promoción"
              value={image}
              onChange={setImage}
              folder="promotions"
              businessId={businessId}
              businessName={businesses.find((b) => b.id === businessId)?.name || 'Comercio'}
            />

            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Descripción de la Oferta</label>
              <Textarea placeholder="Escribe las condiciones o detalles del aviso" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs flex items-center gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{editingPromo ? 'Actualizar Promoción' : 'Guardar Promoción'}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeletePromo)}
        onClose={() => setConfirmDeletePromo(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Promoción?"
        description={`¿Estás seguro de que deseas eliminar la promoción "${confirmDeletePromo?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={Boolean(confirmUpdatePayload)}
        onClose={() => setConfirmUpdatePayload(null)}
        onConfirm={executeUpdate}
        title="¿Actualizar Promoción?"
        description={`¿Deseas guardar los cambios realizados en la promoción "${confirmUpdatePayload?.title}"?`}
        confirmText="Sí, Actualizar"
        cancelText="Cancelar"
        variant="primary"
      />
    </div>
  );
}
