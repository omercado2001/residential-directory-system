'use client';

import React, { useState } from 'react';
import {
  Plus, Edit, Trash2, Tag, Check, FolderTree,
  Utensils, Coffee, ShoppingBag, Store, Briefcase, HeartPulse,
  Car, Wrench, Home, Scissors, Sparkles, Film, Gift, Laptop,
  Truck, Smartphone, Dumbbell, BookOpen, Music, Camera,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Category } from '@/types/database';

interface CategoriesModuleProps {
  categories: Category[];
  onSaveCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  searchTerm: string;
  canEdit?: boolean;
}

const COLOR_PRESETS = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#64748b'
];

export const AVAILABLE_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Utensils', label: 'Restaurantes', icon: Utensils },
  { name: 'Coffee', label: 'Cafeterías', icon: Coffee },
  { name: 'ShoppingBag', label: 'Tiendas', icon: ShoppingBag },
  { name: 'Store', label: 'Supermercado', icon: Store },
  { name: 'Briefcase', label: 'Servicios', icon: Briefcase },
  { name: 'HeartPulse', label: 'Salud', icon: HeartPulse },
  { name: 'Car', label: 'Automotriz', icon: Car },
  { name: 'Wrench', label: 'Mantenimiento', icon: Wrench },
  { name: 'Home', label: 'Hogar', icon: Home },
  { name: 'Scissors', label: 'Belleza', icon: Scissors },
  { name: 'Sparkles', label: 'Limpieza', icon: Sparkles },
  { name: 'Film', label: 'Entretenimiento', icon: Film },
  { name: 'Gift', label: 'Regalos', icon: Gift },
  { name: 'Laptop', label: 'Tecnología', icon: Laptop },
  { name: 'Truck', label: 'Envíos / Delivery', icon: Truck },
  { name: 'Smartphone', label: 'Telefonía', icon: Smartphone },
  { name: 'Dumbbell', label: 'Deportes / Gym', icon: Dumbbell },
  { name: 'BookOpen', label: 'Educación', icon: BookOpen },
  { name: 'Music', label: 'Música / Eventos', icon: Music },
  { name: 'Camera', label: 'Fotografía', icon: Camera },
];

export function renderCategoryIcon(iconName?: string, className = 'w-4 h-4') {
  const found = AVAILABLE_ICONS.find((item) => item.name.toLowerCase() === (iconName || '').toLowerCase());
  if (found) {
    const IconComponent = found.icon;
    return <IconComponent className={className} />;
  }
  return <Tag className={className} />;
}

export default function CategoriesModule({
  categories,
  onSaveCategory,
  onDeleteCategory,
  searchTerm,
  canEdit = true,
}: CategoriesModuleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Utensils');

  // Confirmation dialogs state
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<Category | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const filteredCategories = categories.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setId('');
    setName(''); setSlug(''); setColor('#3b82f6'); setIcon('Utensils');
    setIsOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setId(cat.id); setName(cat.name); setSlug(cat.slug);
    setColor(cat.color || '#3b82f6'); setIcon(cat.icon || 'Utensils');
    setIsOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      const generatedSlug = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleFormSubmit = async () => {
    if (!name) return;
    const finalSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const finalId = id || editingCategory?.id || finalSlug || `cat-${Date.now()}`;
    const payload: Category = {
      id: finalId,
      name,
      slug: finalSlug,
      color,
      icon,
      created_at: editingCategory?.created_at || new Date().toISOString(),
    };

    if (editingCategory) {
      // Prompt confirmation before updating
      setConfirmUpdatePayload(payload);
    } else {
      // Direct creation
      await onSaveCategory(payload);
      setIsOpen(false);
    }
  };

  const executeUpdate = async () => {
    if (!confirmUpdatePayload) return;
    await onSaveCategory(confirmUpdatePayload);
    setConfirmUpdatePayload(null);
    setIsOpen(false);
  };

  const executeDelete = async () => {
    if (!confirmDeleteCat) return;
    await onDeleteCategory(confirmDeleteCat.id);
    setConfirmDeleteCat(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-600" /> Categorías de Comercios
          </h2>
          <p className="text-xs text-slate-500 mt-1">Categorías registradas ({categories.length})</p>
        </div>
        {canEdit ? (
          <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-10 flex items-center gap-2">
            <Plus className="w-4 h-4" /><span>Nueva Categoría</span>
          </Button>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Modo Solo Consulta
          </span>
        )}
      </div>

      {/* Styled Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">NOMBRE</th>
                <th className="py-3.5 px-4">CÓDIGO</th>
                <th className="py-3.5 px-4">COLOR DISTINTIVO</th>
                <th className="py-3.5 px-4">ÍCONO VISUAL</th>
                {canEdit && <th className="py-3.5 px-4 text-right">ACCIONES</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedCategories.length === 0 ? (
                <tr><td colSpan={canEdit ? 5 : 4} className="text-center py-8 text-slate-500 text-xs">No hay categorías registradas.</td></tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-semibold border border-blue-200">{cat.slug}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                        <span>{cat.color}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        >
                          {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                        </div>
                        <span className="font-semibold text-slate-700">{cat.icon}</span>
                      </div>
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200" variant="ghost" onClick={() => openEditModal(cat)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" variant="ghost" onClick={() => setConfirmDeleteCat(cat)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCategories.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Nombre de la Categoría</label>
              <Input placeholder="Ej. Pulperías y Supermercados" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Identificador o Código corto</label>
              <Input placeholder="ej-pulperias-y-super" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-700">Color Representativo</label>
              <div className="flex items-center space-x-2 mb-3">
                {COLOR_PRESETS.map((preset) => (
                  <button type="button" key={preset} onClick={() => setColor(preset)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition ${color === preset ? 'border-slate-900 scale-110' : 'border-transparent opacity-80'}`}
                    style={{ backgroundColor: preset }}>
                    {color === preset && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>

            {/* Visual Icon Grid Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Ícono Visual de la Categoría
                </label>
                <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  Seleccionado: <strong className="font-mono">{icon}</strong>
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon.toLowerCase() === item.name.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => setIcon(item.name)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs scale-105 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      title={item.label}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-600 bg-slate-100'
                        }`}
                        style={{ backgroundColor: isSelected ? color || '#3b82f6' : undefined }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] leading-tight truncate w-full text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleFormSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs">
              {editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteCat)}
        onClose={() => setConfirmDeleteCat(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Categoría?"
        description={`¿Estás seguro de que deseas eliminar la categoría "${confirmDeleteCat?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={Boolean(confirmUpdatePayload)}
        onClose={() => setConfirmUpdatePayload(null)}
        onConfirm={executeUpdate}
        title="¿Actualizar Categoría?"
        description={`¿Deseas guardar los cambios realizados en la categoría "${confirmUpdatePayload?.name}"?`}
        confirmText="Sí, Actualizar"
        cancelText="Cancelar"
        variant="primary"
      />
    </div>
  );
}
