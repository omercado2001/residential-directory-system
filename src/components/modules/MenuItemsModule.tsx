'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, Filter, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MenuItem, Business } from '@/types/database';

interface MenuItemsModuleProps {
  menuItems: MenuItem[];
  businesses: Business[];
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
  searchTerm: string;
  canEdit?: boolean;
}

export default function MenuItemsModule({
  menuItems,
  businesses,
  onSaveMenuItem,
  onDeleteMenuItem,
  searchTerm,
  canEdit = true,
}: MenuItemsModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>('ALL');

  // Confirmation state
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<MenuItem | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<MenuItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [businessId, setBusinessId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBusiness = selectedBusinessFilter === 'ALL' || item.business_id === selectedBusinessFilter;
    return matchesSearch && matchesBusiness;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingItem(null);
    setBusinessId(businesses[0]?.id || '');
    setName(''); setCategory(''); setPrice(0); setDescription(''); setImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setBusinessId(item.business_id); setName(item.name); setCategory(item.category);
    setPrice(item.price); setDescription(item.description || ''); setImage(item.image || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!name || !businessId) return;
    const payload: MenuItem = {
      id: editingItem?.id || crypto.randomUUID(),
      business_id: businessId, name, category, price: Number(price), description, image,
      created_at: editingItem?.created_at || new Date().toISOString(),
    };

    if (editingItem) {
      setConfirmUpdatePayload(payload);
    } else {
      await onSaveMenuItem(payload);
      setIsModalOpen(false);
    }
  };

  const executeUpdate = async () => {
    if (!confirmUpdatePayload) return;
    await onSaveMenuItem(confirmUpdatePayload);
    setConfirmUpdatePayload(null);
    setIsModalOpen(false);
  };

  const executeDelete = async () => {
    if (!confirmDeleteItem) return;
    await onDeleteMenuItem(confirmDeleteItem.id);
    setConfirmDeleteItem(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" /> Catálogo de Productos y Servicios
          </h2>
          <p className="text-xs text-slate-500 mt-1">Platillos y productos disponibles ({menuItems.length})</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchableSelect
            options={businesses.map((b) => ({
              value: b.id,
              label: b.name,
              sublabel: b.address || b.tags || undefined,
              icon: Building2,
            }))}
            value={selectedBusinessFilter}
            onChange={(val) => {
              setSelectedBusinessFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Filtrar por negocio..."
            allOptionLabel="Todos los Negocios"
            searchPlaceholder="Escribe para buscar comercio..."
            icon={Building2}
            className="w-64"
          />
          {canEdit ? (
            <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-9 flex items-center gap-2">
              <Plus className="w-4 h-4" /><span>Nuevo Producto</span>
            </Button>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              Modo Solo Consulta
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">FOTO</th>
                <th className="py-3.5 px-4">PRODUCTO</th>
                <th className="py-3.5 px-4">NEGOCIO</th>
                <th className="py-3.5 px-4">SECCIÓN DEL MENÚ</th>
                <th className="py-3.5 px-4">PRECIO</th>
                {canEdit && <th className="py-3.5 px-4 text-right">ACCIONES</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedItems.length === 0 ? (
                <tr><td colSpan={canEdit ? 6 : 5} className="text-center py-8 text-slate-500 text-xs">No hay productos registrados.</td></tr>
              ) : (
                paginatedItems.map((item) => {
                  const b = businesses.find((biz) => biz.id === item.business_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{item.description}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{b ? b.name : 'Comercio'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">{item.category}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">${Number(item.price).toFixed(2)}</td>
                      {canEdit && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button className="w-8 h-8 p-0 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200" variant="ghost" onClick={() => openEditModal(item)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" variant="ghost" onClick={() => setConfirmDeleteItem(item)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      )}
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
          totalItems={filteredItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 8, 15, 30]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingItem ? 'Editar Producto del Menú' : 'Nuevo Producto del Menú'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Negocio al que pertenece</label>
              <SearchableSelect
                options={businesses.map((b) => ({
                  value: b.id,
                  label: b.name,
                  sublabel: b.address || b.tags || undefined,
                  icon: Building2,
                }))}
                value={businessId}
                onChange={setBusinessId}
                placeholder="Selecciona un comercio..."
                searchPlaceholder="Escribe para buscar comercio..."
                icon={Building2}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Nombre del Producto</label>
                <Input placeholder="Ej. Servicio de Carne Asada" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Sección o Tipo (ej. Bebidas, Platos)</label>
                <Input placeholder="Ej. Platos Fuertes" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Precio ($)</label>
              <Input placeholder="150.00" type="number" step="0.5" value={String(price)} onChange={(e) => setPrice(Number(e.target.value))} required />
            </div>
            <ImageDropzone
              label="Foto del Producto"
              value={image}
              onChange={setImage}
              folder="products"
              businessId={businessId}
              businessName={businesses.find((b) => b.id === businessId)?.name || 'Comercio'}
            />
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Descripción o Ingredientes</label>
              <Textarea placeholder="Escribe los ingredientes o detalles del platillo" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleFormSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs">
              {editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteItem)}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Producto?"
        description={`¿Estás seguro de que deseas eliminar el producto "${confirmDeleteItem?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={Boolean(confirmUpdatePayload)}
        onClose={() => setConfirmUpdatePayload(null)}
        onConfirm={executeUpdate}
        title="¿Actualizar Producto?"
        description={`¿Deseas guardar los cambios realizados en el producto "${confirmUpdatePayload?.name}"?`}
        confirmText="Sí, Actualizar"
        cancelText="Cancelar"
        variant="primary"
      />
    </div>
  );
}
