'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet, UploadCloud, Download, CheckCircle2, AlertCircle,
  X, Loader2, Info, Check, ArrowRight, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Business, Category } from '@/types/database';

interface BusinessBulkImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  existingBusinesses: Business[];
  onBatchSave: (businesses: Business[]) => Promise<void>;
}

interface ParsedBusinessRow {
  name: string;
  categoryName: string;
  categoryId?: string;
  tags?: string;
  hours?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  description?: string;
  googleMaps?: string;
  lat?: number;
  lng?: number;
  isValid: boolean;
  isDuplicate?: boolean;
  error?: string;
}

const TEMPLATE_COLUMNS = [
  'Nombre del Negocio',
  'Categoria',
  'Palabras Clave',
  'Horario de Atencion',
  'Telefono Fijo',
  'Numero de WhatsApp',
  'Direccion exacta en el residencial',
  'Descripcion breve del negocio',
  'Link de Google Maps',
  'Latitud',
  'Longitud',
];

const SAMPLE_DATA = [
  {
    'Nombre del Negocio': "The Crunchy's Food Park",
    'Categoria': 'Bar',
    'Palabras Clave': 'Bar, Comida, Cervezas',
    'Horario de Atencion': 'Lunes a Sábado de 08:00am a 05:30pm',
    'Telefono Fijo': '',
    'Numero de WhatsApp': '7656 3183',
    'Direccion exacta en el residencial': 'Vieja etapa, Calle 2 Avenida 17',
    'Descripcion breve del negocio': 'Food park con variedad de comidas rápidas y bebidas.',
    'Link de Google Maps': 'https://maps.app.goo.gl/aMpNQaS8XSaia2FPA',
    'Latitud': 12.20162759,
    'Longitud': -86.38921108,
  },
  {
    'Nombre del Negocio': 'Golden House',
    'Categoria': 'Bar',
    'Palabras Clave': 'Bar, Comida, Cervezas',
    'Horario de Atencion': 'Lunes a Sábado de 08:00am a 05:30pm',
    'Telefono Fijo': '',
    'Numero de WhatsApp': '8247 5516',
    'Direccion exacta en el residencial': 'Vieja etapa, Calle 2, Avenida 33',
    'Descripcion breve del negocio': 'Bar y restaurante con ambiente familiar y platillos variados.',
    'Link de Google Maps': 'https://maps.app.goo.gl/MFmkP5eUpgL7cvH47',
    'Latitud': 12.20513492,
    'Longitud': -86.39466882,
  },
  {
    'Nombre del Negocio': 'Alquimia Café',
    'Categoria': 'Cafetería',
    'Palabras Clave': 'Postres, Desayuno, Café',
    'Horario de Atencion': 'Lunes a Sábado de 08:00am a 05:30pm',
    'Telefono Fijo': '',
    'Numero de WhatsApp': '8111 7223',
    'Direccion exacta en el residencial': 'Nueva etapa, Calle 2, Avenida 2',
    'Descripcion breve del negocio': 'Especialistas en café de origen, repostería y desayunos.',
    'Link de Google Maps': 'https://maps.app.goo.gl/1o3serAZLdHCyAxZA',
    'Latitud': 12.20095734,
    'Longitud': -86.38428769,
  },
];

export function BusinessBulkImportDrawer({
  isOpen,
  onClose,
  categories,
  existingBusinesses,
  onBatchSave,
}: BusinessBulkImportDrawerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedBusinessRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(SAMPLE_DATA, { header: TEMPLATE_COLUMNS });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Comercios');
      XLSX.writeFile(workbook, 'Plantilla_Comercios_Residencial.xlsx');
      toast.success('Plantilla de Excel descargada');
    } catch (err: any) {
      toast.error('Error al generar plantilla: ' + err.message);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato no soportado. Por favor sube un archivo Excel (.xlsx, .xls) o CSV.');
      return;
    }

    try {
      setFileName(file.name);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (json.length === 0) {
        toast.error('El archivo está vacío.');
        return;
      }

      // Existing names set for uniqueness check
      const existingNamesMap = new Set(
        existingBusinesses.map((b) => b.name.trim().toLowerCase())
      );

      // Track names within the Excel file to prevent duplicate rows within the same file
      const seenExcelNames = new Set<string>();

      // Map rows to normalized structure
      const processed: ParsedBusinessRow[] = json.map((row) => {
        const name = (
          row['Nombre del Negocio'] ||
          row['Nombre'] ||
          row['Negocio'] ||
          row['name'] ||
          ''
        ).toString().trim();

        const catRaw = (
          row['Categoria'] ||
          row['Categoría'] ||
          row['category'] ||
          ''
        ).toString().trim();

        const tags = (
          row['Palabras Clave'] ||
          row['Palabras clave'] ||
          row['PalabrasClave'] ||
          row['Palabras Claves'] ||
          row['Palabras claves'] ||
          row['Palabras'] ||
          row['Tags'] ||
          row['tags'] ||
          ''
        ).toString().trim();

        const hours = (
          row['Horario de Atencion'] ||
          row['Horario de Atención'] ||
          row['Horario'] ||
          row['hours'] ||
          'Lunes a Sábado de 08:00am a 05:30pm'
        ).toString().trim();

        const phone = (
          row['Telefono Fijo'] ||
          row['Teléfono Fijo'] ||
          row['Telefono'] ||
          row['phone'] ||
          ''
        ).toString().trim();

        const whatsapp = (
          row['Numero de WhatsApp'] ||
          row['Número de WhatsApp'] ||
          row['WhatsApp'] ||
          row['whatsapp'] ||
          ''
        ).toString().trim();

        const address = (
          row['Direccion exacta en el residencial'] ||
          row['Dirección exacta en el residencial'] ||
          row['Direccion'] ||
          row['Dirección'] ||
          row['address'] ||
          ''
        ).toString().trim();

        const explicitDescription = (
          row['Descripcion breve del negocio'] ||
          row['Descripción breve del negocio'] ||
          row['Descripcion'] ||
          row['Descripción'] ||
          row['description'] ||
          ''
        ).toString().trim();

        // As requested: In description, put the content from "Palabras Clave"
        const description = tags || explicitDescription;

        const googleMaps = (
          row['Link de Google Maps'] ||
          row['Google Maps'] ||
          row['Maps'] ||
          ''
        ).toString().trim();

        const latVal = parseFloat(row['Latitud'] || row['lat'] || '12.2016');
        const lngVal = parseFloat(row['Longitud'] || row['lng'] || '-86.3892');

        // Match Category by name or slug
        let matchedCategory = categories.find(
          (c) =>
            c.name.toLowerCase() === catRaw.toLowerCase() ||
            c.slug.toLowerCase() === catRaw.toLowerCase()
        );

        if (!matchedCategory && categories.length > 0) {
          matchedCategory = categories[0];
        }

        const normalizedName = name.toLowerCase();
        let isValid = Boolean(name && name.length > 1);
        let isDuplicate = false;
        let error: string | undefined = undefined;

        if (!isValid) {
          error = 'El nombre del negocio es obligatorio';
        } else if (existingNamesMap.has(normalizedName)) {
          isValid = false;
          isDuplicate = true;
          error = 'Ya existe un negocio registrado con este nombre en la base de datos';
        } else if (seenExcelNames.has(normalizedName)) {
          isValid = false;
          isDuplicate = true;
          error = 'Nombre duplicado dentro del mismo archivo Excel';
        } else {
          seenExcelNames.add(normalizedName);
        }

        return {
          name,
          categoryName: catRaw || matchedCategory?.name || 'Comercio',
          categoryId: matchedCategory?.id || categories[0]?.id || 'cat-general',
          tags,
          hours,
          phone,
          whatsapp,
          address,
          description,
          googleMaps,
          lat: !isNaN(latVal) ? latVal : 12.2016,
          lng: !isNaN(lngVal) ? lngVal : -86.3892,
          isValid,
          isDuplicate,
          error,
        };
      });

      setParsedRows(processed);
      const validCount = processed.filter((r) => r.isValid).length;
      const dupCount = processed.filter((r) => r.isDuplicate).length;

      if (dupCount > 0) {
        toast.warning(`${validCount} comercios listos para importar (${dupCount} duplicados omitidos)`);
      } else {
        toast.success(`${validCount} comercios leídos del archivo correctamente`);
      }
    } catch (err: any) {
      console.error('Error al procesar excel:', err);
      toast.error('Error al leer el archivo Excel: ' + err.message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAll = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('No hay registros válidos para guardar');
      return;
    }

    setIsSaving(true);
    try {
      // Create without any hardcoded stock images
      const businessesToInsert: Business[] = validRows.map((r) => ({
        id: crypto.randomUUID(),
        name: r.name,
        category_id: r.categoryId || categories[0]?.id || 'cat-general',
        tags: r.tags || '',
        rating: 5.0,
        reviews: 0,
        distance: 0.5,
        hours: r.hours || 'Lunes a Sábado de 08:00am a 05:30pm',
        is_open: true,
        phone: r.phone || '',
        whatsapp: r.whatsapp || '',
        address: r.address || '',
        description: r.description || '',
        image: '', // Sin imagen quemada
        logo: '',  // Sin logo quemado
        gallery: [],
        featured: false,
        lat: r.lat || 12.2016,
        lng: r.lng || -86.3892,
        created_at: new Date().toISOString(),
      }));

      await onBatchSave(businessesToInsert);
      toast.success(`${businessesToInsert.length} comercios únicos agregados exitosamente`);
      onClose();
    } catch (err: any) {
      toast.error('Error al guardar el lote: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const duplicateRowsCount = parsedRows.filter((r) => r.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => !isSaving && onClose()}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Importación Masiva de Comercios
              </h2>
              <p className="text-xs text-slate-500">Carga negocios únicos desde Excel sin imágenes quemadas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-xs font-semibold rounded-full gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla Excel</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8 text-slate-500"
              onClick={onClose}
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format Guide Alert Banner */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-blue-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Estructura y Columnas del Archivo Excel</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-blue-700 underline font-semibold cursor-pointer hover:text-blue-900"
              >
                {showGuide ? 'Ocultar Detalle' : 'Ver Columnas Aceptadas'}
              </button>
            </div>

            {showGuide && (
              <div className="pt-2 border-t border-blue-200/60 space-y-2 text-[11px] leading-relaxed">
                <p>Tu archivo Excel debe contener los siguientes encabezados en la primera fila:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  {TEMPLATE_COLUMNS.map((col, idx) => (
                    <div key={idx} className="bg-white/80 border border-blue-200 rounded-lg p-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 scale-[0.99]'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 mb-1">
              Arrastra tu archivo Excel aquí o haz clic para seleccionarlo
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Soporta archivos <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong> y <strong className="text-slate-700">.csv</strong>
            </p>
            {fileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{fileName} ({parsedRows.length} filas procesadas)</span>
              </div>
            )}
          </div>

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Vista Previa ({validRowsCount} listos para ingresar)
                  </h4>
                  {duplicateRowsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      <AlertTriangle className="w-3 h-3" /> {duplicateRowsCount} duplicados omitidos
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName(null);
                  }}
                  className="text-xs text-rose-600 hover:bg-rose-50 h-7"
                >
                  Limpiar lista
                </Button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-2.5">ESTADO</th>
                      <th className="p-2.5">NOMBRE</th>
                      <th className="p-2.5">CATEGORÍA</th>
                      <th className="p-2.5">WHATSAPP / TEL</th>
                      <th className="p-2.5">UBICACIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/60'}>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Válido
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full" title={row.error}>
                              <AlertTriangle className="w-3 h-3" /> Duplicado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" title={row.error}>
                              <AlertCircle className="w-3 h-3" /> Inválido
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <div>{row.name || '(Sin Nombre)'}</div>
                          {row.error && <div className="text-[10px] font-medium text-rose-600">{row.error}</div>}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                            {row.categoryName}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {row.whatsapp || row.phone || '-'}
                        </td>
                        <td className="p-2.5 text-slate-500 truncate max-w-[160px]" title={row.address}>
                          {row.address || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full text-xs font-semibold"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSaveAll}
            disabled={isSaving || validRowsCount === 0}
            className="rounded-full font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-6 text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando en Supabase...</span>
              </>
            ) : (
              <>
                <span>Guardar {validRowsCount} Comercios Únicos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
