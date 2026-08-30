'use client';

import React, { useState } from 'react';
import {
  Calendar, MapPin, Phone, MessageSquare, Plus, Edit, Trash2,
  Search, Filter, Sparkles, Clock, PartyPopper, Users, Tag, Image as ImageIcon,
  Loader2
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
import { toast } from 'sonner';

interface EventsModuleProps {
  events: CommunityEvent[];
  searchTerm: string;
  onSaveEvent: (event: CommunityEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
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
  onSaveEvent,
  onDeleteEvent,
  canEdit = true,
}: EventsModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<CommunityEvent | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<CommunityEvent | null>(null);

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

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Por favor ingresa el título del evento');
      return;
    }

    const payload: CommunityEvent = {
      id: editingEvent?.id || crypto.randomUUID(),
      title: trimmedTitle,
      category: category.trim() || 'Comunitario 🏘️',
      location: location.trim() || null,
      event_date: eventDate.trim() || null,
      description: description.trim() || null,
      organizer_phone: organizerPhone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      image: image.trim() || null,
      created_at: editingEvent?.created_at || new Date().toISOString(),
    };

    if (editingEvent) {
      setConfirmUpdatePayload(payload);
    } else {
      setIsSubmitting(true);
      try {
        await onSaveEvent(payload);
        setIsModalOpen(false);
      } catch (err: any) {
        toast.error(`Error al publicar evento: ${err?.message || 'Fallo de conexión'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const executeUpdate = async () => {
    if (!confirmUpdatePayload) return;
    setIsSubmitting(true);
    try {
      await onSaveEvent(confirmUpdatePayload);
      setConfirmUpdatePayload(null);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Error al actualizar evento: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteEvent) return;
    try {
      await onDeleteEvent(confirmDeleteEvent.id);
      setConfirmDeleteEvent(null);
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err?.message || 'Fallo de conexión'}`);
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

          <div className="text-xs font-semibold text-slate-500">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </div>
        </div>

        {canEdit ? (
          <Button
            onClick={openNewModal}
            className="font-bold shadow-md bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Nuevo Evento</span>
          </Button>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Modo Solo Consulta
          </span>
        )}
      </div>

      {/* Grid of Events Cards */}
      {paginatedEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No hay eventos registrados</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'ALL'
              ? 'No se encontraron eventos con los filtros actuales.'
              : 'Aún no se han publicado actividades o eventos comunitarios en el residencial.'}
          </p>
          {canEdit && (
            <Button
              onClick={openNewModal}
              variant="outline"
              className="mt-4 rounded-full font-bold text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Publicar el primer evento
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedEvents.map((evt) => (
            <Card
              key={evt.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              {/* Event Image Banner or Placeholder */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden group">
                {evt.image ? (
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-300">
                    <PartyPopper className="w-10 h-10 mb-1 opacity-70" />
                    <span className="text-[11px] font-semibold text-slate-400">Sin afiche promocional</span>
                  </div>
                )}

                {/* Category Badge Floating */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
                    {evt.category || 'General'}
                  </span>
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 leading-tight">
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  {evt.event_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{evt.event_date}</span>
                    </div>
                  )}

                  {evt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  )}

                  {evt.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <a
                        href={`https://wa.me/${evt.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline font-mono"
                      >
                        {evt.whatsapp}
                      </a>
                    </div>
                  )}

                  {evt.organizer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${evt.organizer_phone}`} className="hover:underline font-mono">
                        {evt.organizer_phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>

              {canEdit && (
                <CardFooter className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    onClick={() => openEditModal(evt)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-slate-700 hover:bg-slate-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    onClick={() => setConfirmDeleteEvent(evt)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs flex items-center gap-1.5"
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

      {/* Pagination Controls */}
      {filteredEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
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
      )}

      {/* Modal Crear / Editar Evento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingEvent ? 'Editar Evento Residencial' : 'Publicar Nuevo Evento'}
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
                disabled={isSubmitting}
                variant="secondary"
                className="rounded-full font-semibold text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{editingEvent ? 'Actualizar Evento' : 'Publicar Evento'}</span>
                )}
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

      {/* Confirmation Dialog for Update */}
      <ConfirmDialog
        isOpen={Boolean(confirmUpdatePayload)}
        onClose={() => setConfirmUpdatePayload(null)}
        onConfirm={executeUpdate}
        title="¿Actualizar Evento?"
        description={`¿Deseas guardar los cambios realizados en el evento "${confirmUpdatePayload?.title}"?`}
        confirmText="Sí, Actualizar"
      />
    </div>
  );
}
