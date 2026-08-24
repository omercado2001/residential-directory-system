'use client';

import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Star, MapPin, Phone, Filter } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { Business, Category } from '@/types/database';

interface BusinessesModuleProps {
  businesses: Business[];
  categories: Category[];
  onSaveBusiness: (business: Business) => Promise<void>;
  onDeleteBusiness: (id: string) => Promise<void>;
  searchTerm: string;
}

const DEFAULT_BUSINESS_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';

export default function BusinessesModule({
  businesses, categories, onSaveBusiness, onDeleteBusiness, searchTerm,
}: BusinessesModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(5.0);
  const [reviews, setReviews] = useState(0);
  const [distance, setDistance] = useState(0.0);
  const [hours, setHours] = useState('');
  const [isOpenState, setIsOpenState] = useState(true);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState('');
  const [featured, setFeatured] = useState(false);

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.tags && b.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'ALL' || b.category_id === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage) || 1;
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setEditingBusiness(null);
    setId(crypto.randomUUID());
    setName(''); setCategoryId(categories[0]?.id || ''); setTags('Restaurante, Gourmet');
    setRating(5.0); setReviews(0); setDistance(1.0); setHours('09:00 AM - 10:00 PM');
    setIsOpenState(true); setPhone(''); setWhatsapp('');
    setAddress(''); setDescription(''); setImage(''); setLogo(''); setGallery(''); setFeatured(false);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Business) => {
    setEditingBusiness(b);
    setId(b.id); setName(b.name); setCategoryId(b.category_id); setTags(b.tags || '');
    setRating(b.rating || 5.0); setReviews(b.reviews || 0); setDistance(b.distance || 0.0);
    setHours(b.hours || ''); setIsOpenState(b.is_open ?? true); setPhone(b.phone || '');
    setWhatsapp(b.whatsapp || ''); setAddress(b.address || ''); setDescription(b.description || '');
    setImage(b.image || ''); setLogo(b.logo || '');
    setGallery(b.gallery ? b.gallery.join(', ') : ''); setFeatured(b.featured ?? false);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !categoryId) return;
    const galleryArray = gallery ? gallery.split(',').map((item) => item.trim()).filter(Boolean) : [];
    const payload: Business = {
      id: id || crypto.randomUUID(), name, category_id: categoryId, tags,
      rating: Number(rating), reviews: Number(reviews), distance: Number(distance),
      hours, is_open: isOpenState, phone, whatsapp, address, description,
      image, logo, gallery: galleryArray, featured,
      lat: 19.4326, lng: -99.1332,
      created_at: editingBusiness?.created_at || new Date().toISOString(),
    };
    await onSaveBusiness(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-emerald-600" /> Directorio de Comercios y Servicios
          </h2>
          <p className="text-xs text-slate-500 mt-1">Negocios registrados ({businesses.length})</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 h-9 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Button onClick={openCreateModal} className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-9 flex items-center gap-2">
            <Plus className="w-4 h-4" /><span>Nuevo Negocio</span>
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedBusinesses.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 p-12 text-center text-slate-500 text-xs rounded-2xl shadow-xs">
            No hay comercios para mostrar.
          </div>
        ) : (
          paginatedBusinesses.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id);
            return (
              <Card key={b.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
                <CardHeader className="p-0 relative h-44 w-full bg-slate-100">
                  <img
                    src={b.image || DEFAULT_BUSINESS_IMAGE} alt={b.name}
                    onError={(e) => { e.currentTarget.src = DEFAULT_BUSINESS_IMAGE; }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase text-white shadow-md ${b.is_open ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {b.is_open ? 'Abierto' : 'Cerrado'}
                    </span>
                    {b.featured && <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white shadow-md">★ Destacado</span>}
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-slate-900 truncate">{b.name}</h3>
                      <span className="text-xs font-semibold text-blue-600">{cat?.name || 'Comercio'}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold font-mono text-xs border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />{b.rating} ({b.reviews} opiniones)
                    </span>
                  </div>
                  {b.description && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{b.description}</p>}
                  <div className="space-y-1.5 pt-2 text-[11px] text-slate-500">
                    {b.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span className="truncate">{b.address}</span></div>}
                    {b.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" /><span>{b.phone}</span></div>}
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {b.hours || 'Horario regular'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button onClick={() => openEditModal(b)} className="px-3 h-8 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5" variant="ghost">
                      <Edit className="w-3.5 h-3.5" /><span>Editar</span>
                    </Button>
                    <Button onClick={() => onDeleteBusiness(b.id)} className="w-8 h-8 p-0 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg" variant="ghost">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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
          totalItems={filteredBusinesses.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[6, 9, 18, 36]}
        />
      </div>

      {/* Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBusiness ? 'Editar Negocio' : 'Registrar Nuevo Negocio'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Nombre del Comercio</label>
                <Input placeholder="Ej. Asados El Doral" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Categoría</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Descripción del Comercio</label>
              <Textarea placeholder="Escribe los detalles o servicios que ofrece el negocio" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Calificación (1 a 5)</label>
                <Input placeholder="5.0" type="number" step="0.1" min="1" max="5" value={String(rating)} onChange={(e) => setRating(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Opiniones / Reseñas</label>
                <Input placeholder="0" type="number" value={String(reviews)} onChange={(e) => setReviews(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Distancia aprox. (km)</label>
                <Input placeholder="0.5" type="number" step="0.1" value={String(distance)} onChange={(e) => setDistance(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Teléfono de Contacto</label>
                <Input placeholder="Ej. +505 8765 4321" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">WhatsApp</label>
                <Input placeholder="Ej. +505 8765 4321" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-semibold block">Dirección o Ubicación en el Residencial</label>
              <Input placeholder="Ej. Sector 2, Frente al Parque Principal" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Foto Principal (enlace web)</label>
                <Input placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Logo del Comercio (enlace web)</label>
                <Input placeholder="https://..." value={logo} onChange={(e) => setLogo(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center space-x-6 pt-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={isOpenState} onChange={(e) => setIsOpenState(e.target.checked)} className="w-4 h-4 rounded accent-emerald-600" />
                <span>Negocio Abierto al Público</span>
              </label>
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
                <span>Marcar como Destacado</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs">Guardar Negocio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
