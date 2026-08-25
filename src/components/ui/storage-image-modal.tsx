'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder, Image as ImageIcon, Search, Check, RefreshCw, X, Loader2, HardDrive,
  Building2, Globe
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StorageImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (publicUrl: string) => void;
  initialFolder?: string;
  businessId?: string;
  businessName?: string;
}

interface StorageFileItem {
  name: string;
  id?: string | null;
  publicUrl: string;
  folder: string;
  isFolder: boolean;
  size?: number;
}

const BUCKET_NAME = 'residential-directory';

export function StorageImageModal({
  isOpen,
  onClose,
  onSelectImage,
  initialFolder = '',
  businessId,
  businessName,
}: StorageImageModalProps) {
  const [filterMode, setFilterMode] = useState<'business' | 'all'>(businessId ? 'business' : 'all');
  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      let foldersToQuery: string[] = [];

      if (filterMode === 'business' && businessId) {
        // Query business-specific folders
        foldersToQuery = [
          `businesses/${businessId}`,
          `products/${businessId}`,
          `promotions/${businessId}`,
          `logos/${businessId}`,
        ];
      } else {
        // Query general folders
        foldersToQuery = currentFolder ? [currentFolder] : ['', 'businesses', 'products', 'promotions', 'logos'];
      }

      const allItems: StorageFileItem[] = [];

      for (const folder of foldersToQuery) {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list(folder, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (!error && data) {
          data.forEach((item) => {
            if (item.name === '.emptyFolderPlaceholder') return;
            const isFolder = !item.id && !item.metadata;
            const fullPath = folder ? `${folder}/${item.name}` : item.name;
            const { data: urlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(fullPath);

            allItems.push({
              name: item.name,
              id: item.id,
              folder: folder || 'raíz',
              isFolder,
              publicUrl: urlData?.publicUrl || '',
              size: item.metadata?.size,
            });
          });
        }
      }

      // Also if businessId filter is active, fetch images linked to this business from DB if bucket subfolders are empty
      if (filterMode === 'business' && businessId && allItems.length === 0) {
        // Query business images from DB
        const [{ data: biz }, { data: items }, { data: promos }] = await Promise.all([
          supabase.from('businesses').select('image, logo, gallery').eq('id', businessId).maybeSingle(),
          supabase.from('menu_items').select('image').eq('business_id', businessId),
          supabase.from('promotions').select('image').eq('business_id', businessId),
        ]);

        const dbUrls = new Set<string>();
        if (biz?.image) dbUrls.add(biz.image);
        if (biz?.logo) dbUrls.add(biz.logo);
        if (biz?.gallery && Array.isArray(biz.gallery)) {
          biz.gallery.forEach((u: string) => u && dbUrls.add(u));
        }
        items?.forEach((i) => i.image && dbUrls.add(i.image));
        promos?.forEach((p) => p.image && dbUrls.add(p.image));

        dbUrls.forEach((url) => {
          const parts = url.split('/');
          const filename = parts[parts.length - 1]?.split('?')[0] || 'imagen';
          allItems.push({
            name: filename,
            publicUrl: url,
            folder: 'vinculada',
            isFolder: false,
          });
        });
      }

      const filtered = allItems.filter(
        (item) => item.isFolder || item.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || item.publicUrl.startsWith('http')
      );

      setFiles(filtered);
    } catch (err: any) {
      console.error('Error fetching storage:', err);
      toast.error('Error al conectar con Supabase Storage');
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, businessId, currentFolder]);

  useEffect(() => {
    if (isOpen) {
      setFilterMode(businessId ? 'business' : 'all');
      setSelectedUrl(null);
    }
  }, [isOpen, businessId]);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, fetchFiles]);

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
  };

  const handleConfirm = () => {
    if (!selectedUrl) return;
    onSelectImage(selectedUrl);
    toast.success('Imagen seleccionada del Storage');
    onClose();
  };

  const displayedFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Galería de Supabase Storage
              </DialogTitle>
              <p className="text-xs text-slate-500">
                {businessName ? (
                  <span>
                    Comercio activo: <strong className="text-blue-700">{businessName}</strong>
                  </span>
                ) : (
                  <span>Bucket: <strong className="font-mono">{BUCKET_NAME}</strong></span>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Mode Selector: Business vs All */}
        {businessId && (
          <div className="px-6 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('business')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'business'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Solo fotos de este comercio ({businessName || 'Comercio'})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explorar todo el Storage</span>
            </button>
          </div>
        )}

        {/* Toolbar: Search, Folder Switcher & Refresh */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          {filterMode === 'all' && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              {[
                { id: '', label: 'Todas' },
                { id: 'businesses', label: 'Comercios' },
                { id: 'products', label: 'Productos' },
                { id: 'promotions', label: 'Promociones' },
                { id: 'logos', label: 'Logos' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCurrentFolder(f.id)}
                  className={`px-3 py-1 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
                    currentFolder === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Search and Refresh */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Input
                placeholder="Buscar imagen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs w-44 pl-8"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={fetchFiles}
              disabled={isLoading}
              title="Recargar archivos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Gallery Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[260px] max-h-[400px]">
          {isLoading ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-2 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Cargando imágenes de Supabase...</span>
            </div>
          ) : displayedFiles.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <ImageIcon className="w-10 h-10 stroke-1" />
              <p className="text-xs font-medium">
                {filterMode === 'business'
                  ? `No hay imágenes subidas aún para "${businessName}". Puedes subir una nueva desde el formulario o explorar todo el Storage.`
                  : 'No se encontraron imágenes en esta carpeta.'}
              </p>
              {filterMode === 'business' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterMode('all')}
                  className="rounded-full text-xs font-bold text-blue-600 border-blue-200 mt-2"
                >
                  Ver todas las imágenes del Storage
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedFiles.map((file, idx) => {
                const isSelected = selectedUrl === file.publicUrl;

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(file.publicUrl)}
                    className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="h-28 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-2 bg-white border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      {file.size && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-full text-xs font-semibold"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!selectedUrl}
            className="rounded-full font-bold bg-blue-600 hover:bg-blue-500 text-white px-6 text-xs shadow-md shadow-blue-600/20"
          >
            Usar Imagen Seleccionada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
