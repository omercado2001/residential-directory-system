'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder, Image as ImageIcon, Search, Check, RefreshCw, X, Loader2, HardDrive,
  Building2, Globe, FolderOpen, ArrowLeft, Layers
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Business } from '@/types/database';
import { toast } from 'sonner';

interface StorageImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (publicUrl: string) => void;
  initialFolder?: string;
  businessId?: string;
  businessName?: string;
  businesses?: Business[];
}

interface StorageImageFile {
  name: string;
  id?: string | null;
  publicUrl: string;
  folder: string;
  size?: number;
  businessId?: string | null;
  businessName?: string | null;
}

interface BusinessFolderInfo {
  id: string;
  name: string;
  folderPath: string;
  fileCount: number;
}

const BUCKET_NAME = 'residential-directory';

export function StorageImageModal({
  isOpen,
  onClose,
  onSelectImage,
  initialFolder = 'businesses',
  businessId,
  businessName,
  businesses: propBusinesses,
}: StorageImageModalProps) {
  // Tabs: 'this-business' | 'by-business' | 'all'
  const [activeTab, setActiveTab] = useState<'this-business' | 'by-business' | 'all'>(
    businessId && businessId !== 'new' ? 'this-business' : 'by-business'
  );

  // When exploring a specific folder inside 'by-business'
  const [selectedFolderBiz, setSelectedFolderBiz] = useState<BusinessFolderInfo | null>(null);

  const [businessesList, setBusinessesList] = useState<{ id: string; name: string }[]>([]);
  const [allImages, setAllImages] = useState<StorageImageFile[]>([]);
  const [businessFolders, setBusinessFolders] = useState<BusinessFolderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Load businesses & Storage files
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch businesses list
      let bizList: { id: string; name: string }[] = [];
      if (propBusinesses && propBusinesses.length > 0) {
        bizList = propBusinesses.map((b) => ({ id: b.id, name: b.name }));
      } else {
        const { data: dbBiz } = await supabase.from('businesses').select('id, name').order('name');
        bizList = dbBiz || [];
      }
      setBusinessesList(bizList);
      const bizMap = new Map<string, string>(bizList.map((b) => [b.id, b.name]));

      // 2. Discover business folders in Storage
      const { data: baseItems } = await supabase.storage.from(BUCKET_NAME).list('businesses', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

      const discoveredFolders: string[] = [];
      const rootFiles: StorageImageFile[] = [];

      (baseItems || []).forEach((item) => {
        if (item.name === '.emptyFolderPlaceholder') return;
        const isFolder = !item.id && !item.metadata;

        if (isFolder) {
          discoveredFolders.push(item.name);
        } else if (item.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`businesses/${item.name}`);
          rootFiles.push({
            name: item.name,
            id: item.id,
            publicUrl: urlData?.publicUrl || '',
            folder: 'businesses',
            size: item.metadata?.size,
          });
        }
      });

      // Query each discovered business subfolder in parallel
      const subfolderResults = await Promise.all(
        discoveredFolders.map(async (folderId) => {
          try {
            const folderPath = `businesses/${folderId}`;
            const { data: files } = await supabase.storage
              .from(BUCKET_NAME)
              .list(folderPath, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' },
              });

            const validImages: StorageImageFile[] = [];
            (files || []).forEach((f) => {
              if (f.name === '.emptyFolderPlaceholder') return;
              if (f.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
                const { data: urlData } = supabase.storage
                  .from(BUCKET_NAME)
                  .getPublicUrl(`${folderPath}/${f.name}`);

                validImages.push({
                  name: f.name,
                  id: f.id,
                  publicUrl: urlData?.publicUrl || '',
                  folder: folderPath,
                  size: f.metadata?.size,
                  businessId: folderId,
                  businessName: bizMap.get(folderId) || `Comercio ${folderId.slice(0, 8)}`,
                });
              }
            });

            return {
              folderId,
              folderPath,
              images: validImages,
            };
          } catch {
            return { folderId, folderPath: `businesses/${folderId}`, images: [] };
          }
        })
      );

      // Build business folders registry
      const foldersList: BusinessFolderInfo[] = [];
      const allCollectedImages: StorageImageFile[] = [...rootFiles];

      // Add folders that exist in Storage
      subfolderResults.forEach((res) => {
        const bName = bizMap.get(res.folderId) || `Negocio (${res.folderId.slice(0, 8)})`;
        foldersList.push({
          id: res.folderId,
          name: bName,
          folderPath: res.folderPath,
          fileCount: res.images.length,
        });
        allCollectedImages.push(...res.images);
      });

      // Add businesses that are registered in database but don't have files yet
      bizList.forEach((b) => {
        const alreadyListed = foldersList.some((f) => f.id === b.id);
        if (!alreadyListed) {
          foldersList.push({
            id: b.id,
            name: b.name,
            folderPath: `businesses/${b.id}`,
            fileCount: 0,
          });
        }
      });

      // Sort folders alphabetically by business name
      foldersList.sort((a, b) => a.name.localeCompare(b.name));

      // Also check DB linked images if current business has images saved in entities
      if (businessId && businessId !== 'new') {
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
          const alreadyExists = allCollectedImages.some((img) => img.publicUrl === url);
          if (!alreadyExists) {
            const parts = url.split('/');
            const filename = parts[parts.length - 1]?.split('?')[0] || 'imagen';
            allCollectedImages.push({
              name: filename,
              publicUrl: url,
              folder: `businesses/${businessId}`,
              businessId,
              businessName: businessName || bizMap.get(businessId) || 'Comercio',
            });
          }
        });
      }

      setBusinessFolders(foldersList);
      setAllImages(allCollectedImages);
    } catch (err: any) {
      console.error('Error loading storage:', err);
      toast.error('Error al explorar el Storage de Supabase');
    } finally {
      setIsLoading(false);
    }
  }, [propBusinesses, businessId, businessName]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(businessId && businessId !== 'new' ? 'this-business' : 'by-business');
      setSelectedFolderBiz(null);
      setSelectedUrl(null);
      loadData();
    }
  }, [isOpen, businessId, loadData]);

  const handleSelect = (url: string) => {
    setSelectedUrl(url);
  };

  const handleConfirm = () => {
    if (!selectedUrl) return;
    onSelectImage(selectedUrl);
    toast.success('Imagen seleccionada del Storage');
    onClose();
  };

  // Filtered files for display based on activeTab & folder selection
  const getImagesToDisplay = (): StorageImageFile[] => {
    let list: StorageImageFile[] = [];

    if (activeTab === 'this-business' && businessId) {
      list = allImages.filter(
        (img) => img.businessId === businessId || img.folder.includes(businessId)
      );
    } else if (activeTab === 'by-business') {
      if (selectedFolderBiz) {
        list = allImages.filter(
          (img) =>
            img.businessId === selectedFolderBiz.id ||
            img.folder.includes(selectedFolderBiz.id)
        );
      } else {
        list = [];
      }
    } else {
      // 'all' tab
      list = allImages;
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (img) =>
        img.name.toLowerCase().includes(term) ||
        (img.businessName && img.businessName.toLowerCase().includes(term))
    );
  };

  const displayedImages = getImagesToDisplay();

  const filteredFolders = businessFolders.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl lg:max-w-6xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Galería de Supabase Storage
              </DialogTitle>
              <p className="text-xs text-slate-500">
                {businessName ? (
                  <span>
                    Comercio activo: <strong className="text-blue-700">{businessName}</strong>
                  </span>
                ) : (
                  <span>Organizado por carpetas de comercios</span>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {businessId && businessId !== 'new' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('this-business');
                  setSelectedFolderBiz(null);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'this-business'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100/50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Fotos de este comercio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab('by-business');
                setSelectedFolderBiz(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'by-business'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>Explorar por Negocios (Carpetas)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSelectedFolderBiz(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Todas las Fotos ({allImages.length})</span>
            </button>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl shrink-0 ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white"
            onClick={loadData}
            disabled={isLoading}
            title="Recargar archivos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>

        {/* Toolbar: Breadcrumb & Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Breadcrumb / Back button when inside a business folder */}
          {activeTab === 'by-business' && selectedFolderBiz ? (
            <button
              type="button"
              onClick={() => setSelectedFolderBiz(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-1.5 rounded-full cursor-pointer transition shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a todas las carpetas</span>
              <span className="text-slate-400 font-normal">/ {selectedFolderBiz.name}</span>
            </button>
          ) : (
            <div className="text-xs font-semibold text-slate-500">
              {activeTab === 'this-business'
                ? `Fotos asignadas a ${businessName || 'este comercio'}`
                : activeTab === 'by-business'
                ? `Mostrando ${filteredFolders.length} carpetas de comercios registrados`
                : `Mostrando ${displayedImages.length} fotos disponibles`}
            </div>
          )}

          {/* Live Search */}
          <div className="relative ml-auto">
            <Input
              placeholder={activeTab === 'by-business' && !selectedFolderBiz ? 'Buscar carpeta de comercio...' : 'Buscar foto por nombre o comercio...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-xs w-64 md:w-80 pl-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-3 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Cargando carpetas e imágenes de Supabase Storage...</span>
            </div>
          ) : activeTab === 'by-business' && !selectedFolderBiz ? (
            /* FOLDER VIEW: Render Business Folders */
            filteredFolders.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-2 text-slate-400 text-center">
                <Folder className="w-12 h-12 stroke-1 text-slate-300" />
                <p className="text-sm font-medium">No se encontraron carpetas con ese nombre.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderBiz(folder)}
                    className="group p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 cursor-pointer transition-all shadow-xs hover:shadow-md flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-amber-600 transition shrink-0 shadow-2xs">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition" title={folder.name}>
                          {folder.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {folder.fileCount} {folder.fileCount === 1 ? 'imagen' : 'imágenes'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition shrink-0 bg-blue-50 px-2.5 py-1 rounded-full">
                      Abrir →
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* IMAGE GRID VIEW */
            displayedImages.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-3 text-slate-400 text-center">
                <ImageIcon className="w-14 h-14 stroke-1 text-slate-300" />
                <p className="text-sm font-medium max-w-md">
                  {selectedFolderBiz
                    ? `La carpeta de "${selectedFolderBiz.name}" no tiene imágenes aún.`
                    : activeTab === 'this-business'
                    ? `No hay imágenes subidas aún para "${businessName}". Puedes subir una nueva desde el formulario.`
                    : 'No se encontraron imágenes con los filtros de búsqueda actuales.'}
                </p>
                {activeTab === 'this-business' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('by-business')}
                    className="rounded-full text-xs font-bold text-blue-600 border-blue-200 mt-2"
                  >
                    Explorar carpetas de otros comercios
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayedImages.map((file, idx) => {
                  const isSelected = selectedUrl === file.publicUrl;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelect(file.publicUrl)}
                      className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all bg-white flex flex-col ${
                        isSelected
                          ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-lg scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="h-32 w-full bg-slate-100 overflow-hidden flex items-center justify-center relative">
                        <img
                          src={file.publicUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>

                      {/* File details & business badge */}
                      <div className="p-2.5 bg-white border-t border-slate-100 space-y-1 flex-1 flex flex-col justify-between">
                        <p className="text-[11px] font-bold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.businessName && (
                          <span className="inline-block text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md truncate max-w-full" title={file.businessName}>
                            🏢 {file.businessName}
                          </span>
                        )}
                        {file.size && (
                          <p className="text-[9px] text-slate-400 font-mono">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-full text-xs font-semibold px-5"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!selectedUrl}
            className="rounded-full font-bold bg-blue-600 hover:bg-blue-500 text-white px-7 text-xs shadow-md shadow-blue-600/20 h-10"
          >
            Usar Imagen Seleccionada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
