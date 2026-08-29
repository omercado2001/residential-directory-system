'use client';

import React, { useState } from 'react';
import {
  Calendar, MapPin, Phone, MessageSquare, Plus, Edit, Trash2,
  Search, Filter, Sparkles, Clock, PartyPopper, Users, Tag, Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CommunityEvent } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EventsModuleProps {
  events: CommunityEvent[];
  searchTerm: string;
  onRefresh: () => void;
  canEdit?: boolean;
}

const EVENT_CATEGORIES = [
  'Fiesta 🥳',
  'Deportes ⚽',
  'Comunitario 🏘️',
  'Feria o Bazar 🛍️',
  'Música y Cultura 🎵',
  'Taller o Clase 📚',
  'Religioso ⛪',
  'Otro 🎉',
];

export default function EventsModule({
  events,
  searchTerm,
  onRefresh,
  canEdit = true,
}: EventsModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<CommunityEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fiesta 🥳');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || e.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openNewModal = () => {
    setEditingEvent(null);
    setTitle('');
    setCategory('Fiesta 🥳');
    setLocation('');
    setEventDate('');
    setDescription('');
    setOrganizerPhone('');
    setWhatsapp('');
    setImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (evt: CommunityEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title || '');
    setCategory(evt.category || 'Fiesta 🥳');
    setLocation(evt.location || '');
    setEventDate(evt.event_date || '');
    setDescription(evt.description || '');
    setOrganizerPhone(evt.organizer_phone || '');
    setWhatsapp(evt.whatsapp || '');
    setImage(evt.image || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Por favor ingresa el título del evento');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<CommunityEvent> = {
        title: title.trim(),
        category: category.trim(),
        location: location.trim() || null,
        event_date: eventDate.trim() || null,
        description: description.trim() || null,
        organizer_phone: organizerPhone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        image: image.trim() || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success('Evento actualizado exitosamente');
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('events')
          .insert({
            id: newId,
            ...payload,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success('Nuevo evento publicado exitosamente');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error al guardar evento:', err);
      toast.error(`Error al guardar evento: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteEvent) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', confirmDeleteEvent.id);

      if (error) throw error;

      toast.success('Evento eliminado correctamente');
      setConfirmDeleteEvent(null);
      onRefresh();
    } catch (err: any) {
      console.error('Error al eliminar evento:', err);
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Top Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <SearchableSelect
            options={EVENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              setCurrentPage(1);
            }}
            placeholder="Filtrar por categoría..."
            allOptionLabel="Todas las Categorías"
            icon={Filter}
            className="w-56"
          />

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            Total: {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        {canEdit && (
          <Button
            onClick={openNewModal}
            className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-9 text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Evento</span>
          </Button>
        )}
      </div>

      {/* Events Grid View */}
      {paginatedEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center text-slate-500 text-xs rounded-2xl shadow-xs space-y-2">
          <Calendar className="w-12 h-12 mx-auto stroke-1 text-slate-400" />
          <p className="font-bold text-slate-700">No hay eventos registrados en esta sección.</p>
          <p className="text-[11px] text-slate-400">Publica un nuevo evento para la comunidad del residencial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedEvents.map((evt) => (
            <Card
              key={evt.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              {/* Image banner */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                {evt.image ? (
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-linear-to-br from-blue-50 to-indigo-50">
                    <PartyPopper className="w-10 h-10 text-blue-400 mb-1" />
                    <span className="text-[11px] font-semibold">Sin imagen asignada</span>
                  </div>
                )}

                {/* Category badge */}
                {evt.category && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold shadow-md">
                    {evt.category}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-base text-slate-900 line-clamp-1">{evt.title}</h3>

                {evt.description ? (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{evt.description}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">Sin descripción detallada</p>
                )}

                <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                  {evt.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{evt.event_date}</span>
                    </div>
                  )}

                  {evt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  )}

                  {evt.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a
                        href={`https://wa.me/${evt.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        WhatsApp: {evt.whatsapp}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Card Footer Actions */}
              {canEdit && (
                <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <Button
                    onClick={() => openEditModal(evt)}
                    className="px-3 h-8 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    variant="ghost"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    onClick={() => setConfirmDeleteEvent(evt)}
                    className="px-3 h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    variant="ghost"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEvents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[6, 12, 24]}
        />
      </div>

      {/* Create / Edit Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>{editingEvent ? 'Editar Evento Comunitario' : 'Crear Nuevo Evento'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">Título del Evento *</label>
              <Input
                placeholder="Ej. Fiesta de Fin de Semana en El Doral"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold block">Categoría</label>
                <SearchableSelect
                  options={EVENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                  value={category}
                  onChange={setCategory}
                  placeholder="Selecciona una categoría..."
                  searchPlaceholder="Escribe para buscar categoría..."
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold block">Fecha y Horario</label>
                <Input
                  placeholder="Ej. Sábado 20 de Septiembre, 6:00 PM"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">Lugar / Ubicación en el Residencial</label>
              <Input
                placeholder="Ej. Casa Club, Cancha Principal o Sector 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold block">Número de WhatsApp</label>
                <Input
                  placeholder="Ej. 8475 8383"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold block">Teléfono de Contacto</label>
                <Input
                  placeholder="Ej. 2255 4433"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                />
              </div>
            </div>

            <ImageDropzone
              label="Afiche o Imagen del Evento"
              value={image}
              onChange={setImage}
              folder="businesses"
            />

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold block">Descripción o Detalles del Evento</label>
              <Textarea
                placeholder="Escribe los detalles, actividades o requisitos del evento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="secondary"
                className="rounded-full font-semibold text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs"
              >
                {isSubmitting ? 'Guardando...' : editingEvent ? 'Actualizar Evento' : 'Publicar Evento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteEvent)}
        onClose={() => setConfirmDeleteEvent(null)}
        onConfirm={executeDelete}
        title="¿Eliminar Evento?"
        description={`¿Estás seguro de que deseas eliminar permanentemente el evento "${confirmDeleteEvent?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar Evento"
      />
    </div>
  );
}
