'use client';

import { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Plus, Edit, Trash2, Tag, FolderTree, Search, Check,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Category, Business } from '@/types/database';
import { toast } from 'sonner';

interface CategoriesModuleProps {
  categories: Category[];
  businesses: Business[];
  onSaveCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  searchTerm: string;
  canEdit?: boolean;
}

export const LEGACY_MAP: Record<string, string> = {
  restaurant: 'Utensils',
  pets: 'Dog',
  health: 'HeartPulse',
  stores: 'ShoppingBag',
  cafeteria: 'Coffee',
  deporte: 'Dumbbell',
  educacion: 'BookOpen',
  hostales: 'Home',
  tipicos: 'UtensilsCrossed',
  servicio_y_hogar: 'Wrench',
  belleza: 'Scissors',
  mas_servicios: 'Briefcase',
  bar: 'Wine',
};

export interface CategoryIconItem {
  name: string;
  label: string;
  category: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}

const createIconItem = (name: string, label: string, category: string, keywords = '') => ({
  name,
  label,
  category,
  keywords: `${name} ${label} ${keywords}`.toLowerCase(),
  icon: ((LucideIcons as any)[name] || LucideIcons.Tag) as React.ComponentType<{ className?: string }>,
});

export const AVAILABLE_ICONS: CategoryIconItem[] = [
  // Alimentos y Restaurantes
  createIconItem('Utensils', 'Restaurantes', 'Comida', 'comida cubiertos tenedor restaurante almuerzos'),
  createIconItem('UtensilsCrossed', 'Comida Típica', 'Comida', 'restaurante tipico asados carne asada fritanga'),
  createIconItem('Coffee', 'Cafeterías', 'Comida', 'cafe coffee desayuno panaderia merienda reposteria'),
  createIconItem('Pizza', 'Pizzerías / Fast Food', 'Comida', 'pizza comida rapida hamburguesas hot dog'),
  createIconItem('Wine', 'Bares y Licores', 'Comida', 'bar vino copas licoreria cerveza tragos'),
  createIconItem('Beer', 'Cervecería / Pub', 'Comida', 'cerveza trago bar pub michelada'),
  createIconItem('Fish', 'Mariscos / Pescadería', 'Comida', 'mariscos pescado ceviche camaron coctel'),
  createIconItem('Apple', 'Frutería / Verdulería', 'Comida', 'frutas vegetales saludable legumbres mercado'),
  createIconItem('Cake', 'Pastelería y Postres', 'Comida', 'queques tortas dulces postres cumpleaños pan'),
  createIconItem('IceCream', 'Heladerías', 'Comida', 'helado nieve sorbete postre'),
  createIconItem('Soup', 'Sopas y Comedores', 'Comida', 'comedor almuerzos sopa comida casera buffet'),
  createIconItem('Sandwich', 'Snacks y Sandwiches', 'Comida', 'sandwiches emparedados bocadillos tortas'),

  // Tiendas y Comercio
  createIconItem('ShoppingBag', 'Tiendas y Boutiques', 'Comercio', 'tienda compras shopping moda ropa calzado'),
  createIconItem('ShoppingCart', 'Supermercados', 'Comercio', 'super mercado compras carrito despensa canasta'),
  createIconItem('Store', 'Pulperías y Abarrotes', 'Comercio', 'pulperia mini super abarrotes conveniencia'),
  createIconItem('Tag', 'Ofertas y Promociones', 'Comercio', 'descuento promociones precio rebajas'),
  createIconItem('Gift', 'Regalos y Novedades', 'Comercio', 'regalos detalles obsequios fiesta piñatas'),
  createIconItem('Shirt', 'Ropa y Confección', 'Comercio', 'vestuario prendas sastreria boutique costura'),
  createIconItem('Package', 'Envíos y Paquetería', 'Comercio', 'paquetes encomiendas entregas box delivery'),
  createIconItem('BadgePercent', 'Descuentos', 'Comercio', 'porcentaje rebajas liquidacion ahorro'),
  createIconItem('Gem', 'Joyería y Relojes', 'Comercio', 'joyas bisuteria relojes accesorios anillos'),

  // Mascotas
  createIconItem('Dog', 'Veterinarias y Mascotas', 'Mascotas', 'perros veterinaria canino pet alimentos mascotas'),
  createIconItem('Cat', 'Gatos / Felinos', 'Mascotas', 'gatos felinos pet shop veterinario'),
  createIconItem('Footprints', 'Paseo y Cuidado Animal', 'Mascotas', 'patitas huellas estetica canina adiestramiento'),
  createIconItem('Bird', 'Aves y Animales', 'Mascotas', 'pajaros animales granja veterinaria'),

  // Salud y Belleza
  createIconItem('HeartPulse', 'Clínicas y Salud', 'Salud', 'medico hospital clinica doctor emergencia corazon'),
  createIconItem('Stethoscope', 'Consultorios Médicos', 'Salud', 'doctor pediatria consulta medicina general'),
  createIconItem('Pill', 'Farmacias y Boticas', 'Salud', 'medicamentos pastillas botica drogueria recetas'),
  createIconItem('Activity', 'Fisioterapia y Bienestar', 'Salud', 'rehabilitacion terapia bienestar quiropractico'),
  createIconItem('Syringe', 'Laboratorio Clínico', 'Salud', 'inyeccion analisis clinico sangre vacunas'),
  createIconItem('Smile', 'Odontología / Dental', 'Salud', 'dientes dentista sonrisa ortodoncia muelas'),
  createIconItem('Baby', 'Maternidad y Bebés', 'Salud', 'pediatra niños bebes pañalera maternidad'),
  createIconItem('Scissors', 'Salones y Barberías', 'Belleza', 'peluqueria barberia corte cabello uñas estilista'),
  createIconItem('Sparkles', 'Estética y Spa', 'Belleza', 'spa facial maquillaje estetica limpieza relajacion'),
  createIconItem('Flower2', 'Floristerías y Viveros', 'Belleza', 'flores plantas vivero arreglos ramos jardineria'),

  // Hogar y Mantenimiento
  createIconItem('Home', 'Hogar y Hospedaje', 'Hogar', 'casa vivienda hostal alquiler residencial cuartos'),
  createIconItem('Wrench', 'Plomería y Mantenimiento', 'Hogar', 'fontaneria reparaciones mecanica arreglo tubos'),
  createIconItem('Hammer', 'Ferreterías y Construcción', 'Hogar', 'construccion herramientas clavos carpinteria obra'),
  createIconItem('Paintbrush', 'Pintura y Remodelación', 'Hogar', 'decoracion interiores acabados pintor brocha'),
  createIconItem('Key', 'Cerrajerías y Chapas', 'Hogar', 'llaves cerrajero candados portones copias'),
  createIconItem('Shield', 'Seguridad y Vigilancia', 'Hogar', 'guardas camaras alarmas proteccion rejas'),
  createIconItem('Flame', 'Gas y Combustibles', 'Hogar', 'tanques de gas cocina llama fuego calor'),
  createIconItem('Zap', 'Electricidad y Climas', 'Hogar', 'electricista cables iluminacion aire acondicionado'),
  createIconItem('Truck', 'Fletes y Mudanzas', 'Hogar', 'transporte carga mudanza camion acarreos'),
  createIconItem('Clock', 'Servicios 24 Horas', 'Hogar', 'tiempo turnos nocturnos emergencia horario'),

  // Vehículos y Movilidad
  createIconItem('Car', 'Talleres y Autolavados', 'Vehículos', 'automotriz mecanica lavado carwash repuestos llantas'),
  createIconItem('Bike', 'Bicicletas y Motos', 'Vehículos', 'ciclismo taller de motos reparacion repuestos moto'),
  createIconItem('Fuel', 'Gasolineras / Lubricentros', 'Vehículos', 'combustible gasolina diesel lubricantes aceite'),
  createIconItem('Bus', 'Transporte y Expresos', 'Vehículos', 'expresos colectivo viajes transporte escolar'),
  createIconItem('Plane', 'Agencias de Viaje', 'Vehículos', 'turismo boletos vuelos traslados aeropuerto'),

  // Tecnología y Entretenimiento
  createIconItem('Laptop', 'Computación y Soporte', 'Tecnología', 'laptops computadoras soporte tecnico software pc'),
  createIconItem('Smartphone', 'Celulares y Accesorios', 'Tecnología', 'telefonia tablets fundas cargadores pantallas vidrio'),
  createIconItem('Tv', 'Audio y Video', 'Tecnología', 'television pantallas sonido parlantes electrodomesticos'),
  createIconItem('Camera', 'Fotografía y Video', 'Tecnología', 'fotos eventos sesiones estudio grabacion'),
  createIconItem('Film', 'Cine y Espectáculos', 'Entretenimiento', 'peliculas proyecciones diversion teatro shows'),
  createIconItem('Music', 'Música y Eventos', 'Entretenimiento', 'karaoke djs fiestas instrumentos sonido orquesta'),
  createIconItem('Gamepad2', 'Videojuegos / Gaming', 'Entretenimiento', 'gaming consolas juegos ciber playstation'),
  createIconItem('PartyPopper', 'Fiestas y Animación', 'Entretenimiento', 'piñatas banquetes animadores cumpleaños decoracion'),
  createIconItem('Ticket', 'Boletos y Entradas', 'Entretenimiento', 'tickets reservaciones pases eventos ferias'),

  // Deportes, Educación y Servicios
  createIconItem('Dumbbell', 'Gimnasios y Fitness', 'Deportes', 'gym pesas crossfit entrenamiento funcional pesas'),
  createIconItem('Trophy', 'Canchas y Torneos', 'Deportes', 'futbol trofeos canchas torneos ligas deportes'),
  createIconItem('Medal', 'Academias Deportivas', 'Deportes', 'artes marciales natacion karate academia disciplinas'),
  createIconItem('BookOpen', 'Librerías y Fotocopias', 'Educación', 'libros fotocopias utiles escolares biblioteca impresiones'),
  createIconItem('GraduationCap', 'Tutorías y Clases', 'Educación', 'clases ingles reforzamiento cursos colegio profesor'),
  createIconItem('Briefcase', 'Servicios Profesionales', 'Servicios', 'abogados contadores notaria consultoria tramites'),
  createIconItem('Building2', 'Bienes Raíces / Oficinas', 'Servicios', 'inmobiliaria casas oficinas alquiler venta'),
  createIconItem('DollarSign', 'Remesas y Finanzas', 'Servicios', 'cambio dolares western union transferencias banco'),
  createIconItem('MapPin', 'Guía y Ubicaciones', 'Servicios', 'puntos de referencia direcciones mapas residencial'),
];

export function renderCategoryIcon(iconName?: string, className = 'w-4 h-4') {
  if (!iconName) return <Tag className={className} />;

  const clean = iconName.trim().toLowerCase();
  const mapped = LEGACY_MAP[clean] || iconName;

  const found = AVAILABLE_ICONS.find((item) => item.name.toLowerCase() === mapped.toLowerCase());
  if (found) {
    const IconComponent = found.icon;
    return <IconComponent className={className} />;
  }

  // Búsqueda dinámica en el paquete completo de Lucide
  const DynamicComp = (LucideIcons as any)[mapped] || (LucideIcons as any)[iconName];
  if (DynamicComp && typeof DynamicComp === 'function') {
    return <DynamicComp className={className} />;
  }

  return <Tag className={className} />;
}

export const ICON_CATEGORIES = [
  { id: 'ALL', label: 'Todos' },
  { id: 'comida', label: 'Comida' },
  { id: 'comercio', label: 'Comercio' },
  { id: 'mascotas', label: 'Mascotas' },
  { id: 'salud', label: 'Salud' },
  { id: 'belleza', label: 'Belleza' },
  { id: 'hogar', label: 'Hogar' },
  { id: 'vehiculos', label: 'Vehículos' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'ocio', label: 'Ocio' },
  { id: 'deporte', label: 'Deportes' },
  { id: 'servicios', label: 'Servicios' },
];

export default function CategoriesModule({
  categories,
  businesses,
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
  const [icon, setIcon] = useState('Utensils');
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState('ALL');

  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);
  const [confirmUpdatePayload, setConfirmUpdatePayload] = useState<Category | null>(null);

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

  const filteredIcons = useMemo(() => {
    const q = iconSearch.toLowerCase().trim();
    return AVAILABLE_ICONS.filter((item) => {
      const matchesCategory = selectedIconCategory === 'ALL' || item.category === selectedIconCategory;
      const matchesSearch = !q ||
        item.label.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedIconCategory, iconSearch]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setId('');
    setName('');
    setSlug('');
    setIcon('Utensils');
    setIconSearch('');
    setSelectedIconCategory('ALL');
    setIsOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || 'Utensils');
    setIconSearch('');
    setSelectedIconCategory('ALL');
    setIsOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleFormSubmit = async () => {
    if (!name.trim() || !slug.trim()) return;

    const generatedId = id || slug.trim().toLowerCase();

    const payload: Category = {
      id: generatedId,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      icon: icon || 'Utensils',
      color: editingCategory?.color || '#3b82f6',
      created_at: editingCategory?.created_at || new Date().toISOString(),
    };

    if (editingCategory) {
      setConfirmUpdatePayload(payload);
    } else {
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

  const handleDeleteClick = (cat: Category) => {
    const linkedBusinesses = businesses.filter(b => b.category_id === cat.id);
    if (linkedBusinesses.length > 0) {
      toast.error(`No se puede eliminar "${cat.name}" porque tiene ${linkedBusinesses.length} comercio(s) vinculado(s).`);
      return;
    }
    setConfirmDeleteCat(cat);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">NOMBRE</th>
                <th className="py-3.5 px-4">CÓDIGO</th>
                <th className="py-3.5 px-4">ÍCONO VISUAL</th>
                {canEdit && <th className="py-3.5 px-4 text-right">ACCIONES</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedCategories.length === 0 ? (
                <tr><td colSpan={canEdit ? 4 : 3} className="text-center py-8 text-slate-500 text-xs">No hay categorías registradas.</td></tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span>{cat.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-semibold border border-blue-200">{cat.slug}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
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
                          <Button className="w-8 h-8 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" variant="ghost" onClick={() => handleDeleteClick(cat)}>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-slate-200">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-600" />
              {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura el nombre y selecciona el ícono oficial de Lucide compatible con la aplicación móvil.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Nombre de la Categoría</label>
                <Input
                  placeholder="Ej. Pulperías y Supermercados"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-700 text-xs font-semibold block">Código o Slug</label>
                <Input
                  placeholder="ej-pulperias-y-super"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Ícono de la Categoría (Lucide Icons)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Se mostrará de forma idéntica en la web y la app móvil.
                  </p>
                </div>
                {/* Selected Icon Preview Badge */}
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-3 py-1.5 rounded-xl text-blue-700">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    {renderCategoryIcon(icon, 'w-3.5 h-3.5')}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] block text-blue-500 leading-none">Seleccionado</span>
                    <span className="text-xs font-mono font-bold leading-none">{icon}</span>
                  </div>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Buscar ícono por nombre o palabra clave (ej. comida, café, perro, auto)..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedIconCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedIconCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Icons Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50">
                {filteredIcons.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                    No se encontraron íconos con "{iconSearch}"
                  </div>
                ) : (
                  filteredIcons.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = icon.toLowerCase() === item.name.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => setIcon(item.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-left group ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs scale-105 ring-2 ring-blue-500/20'
                            : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                        title={`${item.label} (${item.name})`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'text-slate-600 bg-slate-100 group-hover:bg-slate-200'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] leading-tight truncate w-full text-center font-medium">
                          {item.label}
                        </span>
                        <span className="text-[8px] text-slate-400 truncate w-full text-center font-mono">
                          {item.name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-row items-center justify-end gap-2">
            <Button onClick={() => setIsOpen(false)} variant="secondary" className="rounded-full font-semibold text-xs h-9 px-4">
              Cancelar
            </Button>
            <Button onClick={handleFormSubmit} className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 text-xs h-9 shadow-sm">
              {editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
