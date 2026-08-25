'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HardDrive, UploadCloud, Trash2, Search, Filter, RefreshCw, CheckCircle2,
  AlertTriangle, Lock, Eye, Download, X, Loader2, Folder, Image as ImageIcon,
  Check, FileCheck, Layers, Plus, CheckSquare, Square, Building2, RotateCcw,
  Gauge, AlertCircle, ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/lib/supabase';
import { Business, MenuItem, Promotion, Profile, Category, CommunityEvent } from '@/types/database';
import { calculateFileHash } from '@/lib/image-hash';
import { toast } from 'sonner';

interface StorageModuleProps {
  businesses: Business[];
  menuItems: MenuItem[];
  promotions: Promotion[];
  events?: CommunityEvent[];
  profiles: Profile[];
  categories: Category[];
  searchTerm: string;
  canEdit?: boolean;
}

interface StorageFileDetail {
  name: string;
  id?: string | null;
  folder: string;
  fullPath: string;
  publicUrl: string;
  size?: number;
  updatedAt?: string;
  isFolder: boolean;
  isInUse: boolean;
  usedBy?: string[];
  associatedBusinessId?: string | null;
  associatedBusinessName?: string | null;
}

const BUCKET_NAME = 'residential-directory';
const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB (1,024 MB) - Límite de Supabase Storage
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB límite por archivo

export default function StorageModule({
  businesses,
  menuItems,
  promotions,
  events = [],
  profiles,
  categories,
  searchTerm,
  canEdit = true,
}: StorageModuleProps) {
  const [files, setFiles] = useState<StorageFileDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>('ALL');
  const [usageFilter, setUsageFilter] = useState<'ALL' | 'IN_USE' | 'UNUSED'>('ALL');

  // Direct Upload State: Always targets 'businesses'
  const [uploadBusinessId, setUploadBusinessId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-selection & Delete State (Only unused files can be selected for deletion)
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<StorageFileDetail | null>(null);
  const [confirmDeleteMultiple, setConfirmDeleteMultiple] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // 1. Build In-Use & Business Association Index from DB Entities
  const buildUsageMap = useCallback(() => {
    const usageMap = new Map<string, { usedBy: string[]; bizId?: string; bizName?: string }>();

    const recordUsage = (url: string | null | undefined, label: string, bizId?: string, bizName?: string) => {
      if (!url) return;
      const cleanUrl = url.trim();
      if (!cleanUrl) return;

      const parts = cleanUrl.split('/');
      const filename = parts[parts.length - 1]?.split('?')[0]?.toLowerCase();

      if (filename) {
        const existing = usageMap.get(filename) || { usedBy: [], bizId, bizName };
        existing.usedBy.push(label);
        if (bizId) existing.bizId = bizId;
        if (bizName) existing.bizName = bizName;
        usageMap.set(filename, existing);
      }
    };

    // Businesses
    businesses.forEach((b) => {
      if (b.image) recordUsage(b.image, `Comercio: ${b.name} (Foto principal)`, b.id, b.name);
      if (b.logo) recordUsage(b.logo, `Comercio: ${b.name} (Logo)`, b.id, b.name);
      if (b.gallery && Array.isArray(b.gallery)) {
        b.gallery.forEach((img) => recordUsage(img, `Comercio: ${b.name} (Galería)`, b.id, b.name));
      }
    });

    // Menu items
    menuItems.forEach((m) => {
      const b = businesses.find((biz) => biz.id === m.business_id);
      if (m.image) recordUsage(m.image, `Producto: ${m.name} (${b?.name || 'Comercio'})`, m.business_id, b?.name);
    });

    // Promotions
    promotions.forEach((p) => {
      const b = businesses.find((biz) => biz.id === p.business_id);
      if (p.image) recordUsage(p.image, `Promoción: ${p.title} (${b?.name || 'Comercio'})`, p.business_id, b?.name);
    });

    // Events
    if (events && Array.isArray(events)) {
      events.forEach((ev) => {
        if (ev.image) recordUsage(ev.image, `Evento: ${ev.title}`);
      });
    }

    // Profiles
    profiles.forEach((pr) => {
      if (pr.avatar_url) recordUsage(pr.avatar_url, `Usuario: ${pr.full_name || pr.email}`);
    });

    return usageMap;
  }, [businesses, menuItems, promotions, events, profiles]);

  // 2. Fetch files in fast parallel queries
  const loadStorageFiles = useCallback(async () => {
    setIsLoading(true);
    const usageMap = buildUsageMap();

    try {
      const baseFolders = ['businesses', '', 'products', 'promotions', 'logos'];

      // Query primary folders in parallel
      const baseResults = await Promise.all(
        baseFolders.map(async (folder) => {
          try {
            const { data } = await supabase.storage
              .from(BUCKET_NAME)
              .list(folder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
              });
            return { folder, items: data || [] };
          } catch {
            return { folder, items: [] };
          }
        })
      );

      // Collect any subdirectories (e.g. businesses/{id})
      const subfolderRequests: { parentFolder: string; subfolderName: string }[] = [];
      baseResults.forEach(({ folder, items }) => {
        items.forEach((item) => {
          const isFolder = !item.id && !item.metadata;
          if (isFolder && item.name !== '.emptyFolderPlaceholder') {
            subfolderRequests.push({
              parentFolder: folder ? `${folder}/${item.name}` : item.name,
              subfolderName: item.name,
            });
          }
        });
      });

      // Query discovered subfolders in parallel
      const subfolderResults = await Promise.all(
        subfolderRequests.map(async ({ parentFolder }) => {
          try {
            const { data } = await supabase.storage
              .from(BUCKET_NAME)
              .list(parentFolder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
              });
            return { folder: parentFolder, items: data || [] };
          } catch {
            return { folder: parentFolder, items: [] };
          }
        })
      );

      const allResults = [...baseResults, ...subfolderResults];
      const allFetchedFiles: StorageFileDetail[] = [];
      const seenPaths = new Set<string>();

      allResults.forEach(({ folder, items }) => {
        items.forEach((item) => {
          if (item.name === '.emptyFolderPlaceholder') return;
          const isFolder = !item.id && !item.metadata;
          if (isFolder) return;

          const fullPath = folder ? `${folder}/${item.name}` : item.name;
          if (seenPaths.has(fullPath)) return;
          seenPaths.add(fullPath);

          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fullPath);

          const filenameLower = item.name.toLowerCase();
          const usageInfo = usageMap.get(filenameLower);
          const isInUse = Boolean(usageInfo && usageInfo.usedBy.length > 0);

          // Determine associated business
          let assocBizId: string | null = null;
          let assocBizName: string | null = null;

          if (folder.includes('/')) {
            const potentialBizId = folder.split('/')[1];
            const matchedBiz = businesses.find((b) => b.id === potentialBizId);
            if (matchedBiz) {
              assocBizId = matchedBiz.id;
              assocBizName = matchedBiz.name;
            }
          }

          if (!assocBizId && usageInfo?.bizId) {
            assocBizId = usageInfo.bizId;
            assocBizName = usageInfo.bizName || null;
          }

          allFetchedFiles.push({
            name: item.name,
            id: item.id,
            folder: folder || 'businesses',
            fullPath,
            publicUrl: urlData?.publicUrl || '',
            size: item.metadata?.size,
            updatedAt: item.updated_at || item.created_at || undefined,
            isFolder: false,
            isInUse,
            usedBy: usageInfo?.usedBy,
            associatedBusinessId: assocBizId,
            associatedBusinessName: assocBizName,
          });
        });
      });

      setFiles(allFetchedFiles);
    } catch (err: any) {
      console.error('Error loading storage files:', err);
      toast.error('Error al cargar archivos de Supabase Storage');
    } finally {
      setIsLoading(false);
    }
  }, [buildUsageMap, businesses]);

  useEffect(() => {
    loadStorageFiles();
  }, [loadStorageFiles]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSelectedBusinessFilter('ALL');
    setUsageFilter('ALL');
    setCurrentPage(1);
    toast.info('Filtros restablecidos');
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.associatedBusinessName && f.associatedBusinessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.usedBy && f.usedBy.some((u) => u.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesBusiness =
      selectedBusinessFilter === 'ALL' ||
      selectedBusinessFilter === '' ||
      f.associatedBusinessId === selectedBusinessFilter;

    const matchesUsage =
      usageFilter === 'ALL' ||
      (usageFilter === 'IN_USE' && f.isInUse) ||
      (usageFilter === 'UNUSED' && !f.isInUse);

    return matchesSearch && matchesBusiness && matchesUsage;
  });

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // File Upload Handlers: Validates Duplicates and Supabase Storage Limits (1 GB & 50 MB)
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const rawFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));

    if (rawFiles.length === 0) {
      toast.error('Por favor selecciona archivos de imagen válidos (PNG, JPG, WEBP, etc.)');
      return;
    }

    // 1. Check Total Supabase Storage Limit (1 GB = 1,024 MB)
    const newFilesTotalSize = rawFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes + newFilesTotalSize > MAX_STORAGE_BYTES) {
      const remainingMB = Math.max(0, (MAX_STORAGE_BYTES - totalBytes) / (1024 * 1024)).toFixed(2);
      toast.error(
        `Límite de almacenamiento de Supabase Storage alcanzado (Máx 1 GB). Espacio restante: ${remainingMB} MB.`
      );
      return;
    }

    // 2. Check Individual File Limit (50 MB max per file)
    const oversized = rawFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      toast.error(`El archivo "${oversized[0].name}" supera el límite permitido por archivo (50 MB).`);
      return;
    }

    // 3. Prevent Duplicates with SHA-256 Fingerprint + Exact Size Matching
    const seenBatchHashes = new Set<string>();
    const duplicateNames: string[] = [];
    const filesToUpload: { file: File; cleanName: string }[] = [];

    // Index existing storage files by size and hash
    const existingFileSignatures = new Set<string>();
    files.forEach((f) => {
      if (f.size) existingFileSignatures.add(`size-${f.size}`);
      existingFileSignatures.add(f.name.toLowerCase());
      const rawName = f.name.split('.')[0]?.toLowerCase();
      if (rawName) existingFileSignatures.add(rawName);
    });

    for (const file of rawFiles) {
      const fullHash = await calculateFileHash(file);
      const hashKey = fullHash.slice(0, 24);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const cleanName = `${hashKey}.${fileExt}`;

      // Check if identical file (by hash, name, or exact byte size) already exists
      const isDuplicateInStorage =
        files.some(
          (f) =>
            f.name.includes(hashKey) ||
            f.fullPath.includes(hashKey) ||
            (f.size === file.size && f.size > 0 && f.name.endsWith(`.${fileExt}`))
        ) ||
        existingFileSignatures.has(cleanName.toLowerCase()) ||
        existingFileSignatures.has(`size-${file.size}`);

      const isDuplicateInBatch = seenBatchHashes.has(hashKey) || seenBatchHashes.has(`size-${file.size}`);

      if (isDuplicateInStorage || isDuplicateInBatch) {
        duplicateNames.push(file.name);
      } else {
        seenBatchHashes.add(hashKey);
        seenBatchHashes.add(`size-${file.size}`);
        existingFileSignatures.add(cleanName.toLowerCase());
        existingFileSignatures.add(`size-${file.size}`);
        filesToUpload.push({ file, cleanName });
      }
    }

    if (duplicateNames.length > 0) {
      toast.warning(
        `Se detectaron ${duplicateNames.length} imagen(es) duplicada(s) y no se subieron: ${duplicateNames.slice(0, 3).join(', ')}${
          duplicateNames.length > 3 ? '...' : ''
        }`
      );
    }

    if (filesToUpload.length === 0) {
      if (duplicateNames.length > 0) {
        toast.info('Ninguna imagen nueva fue subida porque todas ya existen en el Storage.');
      }
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const { file, cleanName } = filesToUpload[i];
      setUploadProgress({ current: i + 1, total: filesToUpload.length });

      try {
        // Fixed folder: 'businesses' or 'businesses/{businessId}'
        const filePath = uploadBusinessId && uploadBusinessId !== 'ALL'
          ? `businesses/${uploadBusinessId}/${cleanName}`
          : `businesses/${cleanName}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (!error) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      const targetBiz = businesses.find((b) => b.id === uploadBusinessId);
      const bizMsg = targetBiz ? ` para el comercio "${targetBiz.name}"` : '';
      toast.success(`${successCount} imagen(es) nueva(s) subida(s) exitosamente${bizMsg}`);
      loadStorageFiles();
    }
    if (failCount > 0) {
      toast.error(`Hubo un error al subir ${failCount} archivo(s)`);
    }
  };

  // Dropzone drag events
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Strict Single File Deletion: Blocks if image is in use
  const executeSingleDelete = async () => {
    if (!confirmDeleteFile) return;

    if (confirmDeleteFile.isInUse) {
      toast.error('Acción bloqueada: No se puede eliminar una imagen que está en uso en el sistema.');
      setConfirmDeleteFile(null);
      return;
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([confirmDeleteFile.fullPath]);

      if (error) {
        toast.error(`Error al eliminar archivo: ${error.message}`);
        return;
      }

      toast.success(`Archivo "${confirmDeleteFile.name}" eliminado del Storage`);
      setSelectedPaths((prev) => prev.filter((p) => p !== confirmDeleteFile.fullPath));
      setConfirmDeleteFile(null);
      await loadStorageFiles();
    } catch (err: any) {
      toast.error(`Error de conexión: ${err?.message || 'Fallo de red'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Strict Multiple Files Deletion: Filters out in-use images
  const executeMultipleDelete = async () => {
    if (selectedPaths.length === 0) return;

    // Only allow deleting files that are NOT in use
    const deletablePaths = selectedPaths.filter((path) => {
      const file = files.find((f) => f.fullPath === path);
      return file && !file.isInUse;
    });

    if (deletablePaths.length === 0) {
      toast.error('Acción bloqueada: Todas las imágenes seleccionadas están en uso y no se pueden eliminar.');
      setConfirmDeleteMultiple(false);
      return;
    }

    if (deletablePaths.length < selectedPaths.length) {
      toast.warning(
        `Se omitieron ${selectedPaths.length - deletablePaths.length} imagen(es) en uso protegidas.`
      );
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(deletablePaths);

      if (error) {
        toast.error(`Error al eliminar imágenes: ${error.message}`);
        return;
      }

      toast.success(`${deletablePaths.length} imagen(es) eliminada(s) del Storage`);
      setSelectedPaths([]);
      setConfirmDeleteMultiple(false);
      await loadStorageFiles();
    } catch (err: any) {
      toast.error(`Error de conexión: ${err?.message || 'Fallo de red'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection toggle: Only allow selecting images that are NOT in use
  const toggleSelectPath = (path: string, isInUse: boolean) => {
    if (isInUse) {
      toast.error('Esta imagen está en uso por un comercio o producto y no se puede seleccionar para eliminar.');
      return;
    }
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  // Select all unused images only
  const deletablePaginatedFiles = paginatedFiles.filter((f) => !f.isInUse);
  const toggleSelectAll = () => {
    if (selectedPaths.length === deletablePaginatedFiles.length && deletablePaginatedFiles.length > 0) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(deletablePaginatedFiles.map((f) => f.fullPath));
    }
  };

  // Options for SearchableSelect
  const businessOptions = businesses.map((b) => ({
    value: b.id,
    label: b.name,
    sublabel: b.tags || undefined,
    icon: Building2,
  }));

  // Stats and Storage Limit Calculations
  const totalFilesCount = files.length;
  const inUseCount = files.filter((f) => f.isInUse).length;
  const unusedCount = files.filter((f) => !f.isInUse).length;
  const totalBytes = files.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const totalMegabytes = (totalBytes / (1024 * 1024)).toFixed(2);
  const storagePercentage = Math.min(100, Number(((totalBytes / MAX_STORAGE_BYTES) * 100).toFixed(2)));

  const hasActiveFilters =
    (selectedBusinessFilter !== 'ALL' && selectedBusinessFilter !== '') ||
    usageFilter !== 'ALL' ||
    searchTerm.trim() !== '';

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Top Stats Cards with Storage Limit Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Archivos</p>
            <p className="text-xl font-black text-slate-900">{totalFilesCount}</p>
          </div>
        </Card>

        {/* Storage Capacity Gauge Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Límite Storage</span>
            </div>
            <span className="text-[11px] font-bold text-purple-700 font-mono">{storagePercentage}%</span>
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs mb-1">
              <span className="font-black text-slate-900">{totalMegabytes} MB</span>
              <span className="text-[10px] text-slate-400 font-semibold">de 1,024 MB (1 GB)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePercentage > 90
                    ? 'bg-rose-500'
                    : storagePercentage > 70
                    ? 'bg-amber-500'
                    : 'bg-purple-600'
                }`}
                style={{ width: `${Math.max(1, storagePercentage)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">En Uso (Protegidas)</p>
            <p className="text-xl font-black text-emerald-700">{inUseCount}</p>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sin Usar (Liberables)</p>
            <p className="text-xl font-black text-amber-700">{unusedCount}</p>
          </div>
        </Card>
      </div>

      {/* Direct Upload Dropzone for Businesses */}
      {canEdit && (
        <Card className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Cargar Archivos de Imágenes a Comercios</h3>
                <p className="text-xs text-slate-500">Protegido contra duplicados • Límite máximo por archivo: 50 MB</p>
              </div>
            </div>

            {/* Business Selector with Searchable Combobox */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Vincular a:</span>
              <SearchableSelect
                options={businessOptions}
                value={uploadBusinessId}
                onChange={setUploadBusinessId}
                allOptionLabel="(Comercio General)"
                placeholder="Elegir comercio..."
                searchPlaceholder="Escribe para buscar comercio..."
                icon={Building2}
                className="w-56"
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesSelected(e.target.files)}
            multiple
            accept="image/*"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/60 hover:border-slate-400'
            } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
          >
            {isUploading && uploadProgress ? (
              <div className="flex flex-col items-center space-y-2 py-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-bold text-slate-800">
                  Subiendo archivo {uploadProgress.current} de {uploadProgress.total} a Supabase...
                </p>
                <div className="w-48 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Haz clic aquí o arrastra imágenes para subirlas
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {uploadBusinessId && uploadBusinessId !== 'ALL'
                      ? `Se guardarán directamente asociadas a: ${businesses.find((b) => b.id === uploadBusinessId)?.name}`
                      : 'Todas las imágenes se guardarán en la carpeta de comercios (PNG, JPG, JPEG, WEBP, GIF)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Toolbar & Filter Bar with Searchable Combobox */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Searchable Business Filter Combobox */}
          <SearchableSelect
            options={businessOptions}
            value={selectedBusinessFilter}
            onChange={(val) => {
              setSelectedBusinessFilter(val);
              setCurrentPage(1);
            }}
            allOptionLabel="Todos los Comercios"
            placeholder="Buscar comercio..."
            searchPlaceholder="Escribe para buscar comercio..."
            icon={Building2}
            className="w-56"
          />

          {/* Usage Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 h-9 rounded-xl text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={usageFilter}
              onChange={(e) => {
                setUsageFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="IN_USE">🔒 En Uso (Referenciadas)</option>
              <option value="UNUSED">✨ Sin Usar (Libres)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Filtros</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={loadStorageFiles}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl text-slate-600"
            title="Recargar archivos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Selection actions */}
        <div className="flex items-center gap-2">
          {canEdit && selectedPaths.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteMultiple(true)}
              className="font-bold shadow-md bg-rose-600 hover:bg-rose-500 text-white rounded-full px-4 h-9 text-xs flex items-center gap-1.5 animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar {selectedPaths.length} Sin Usar</span>
            </Button>
          )}

          {canEdit && deletablePaginatedFiles.length > 0 && (
            <Button
              variant="outline"
              onClick={toggleSelectAll}
              className="text-xs font-bold h-9 rounded-xl text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              {selectedPaths.length === deletablePaginatedFiles.length && deletablePaginatedFiles.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  Deseleccionar
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Square className="w-4 h-4 text-slate-400" />
                  Seleccionar Libres ({deletablePaginatedFiles.length})
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Files Grid View */}
      {paginatedFiles.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center text-slate-500 text-xs rounded-2xl shadow-xs space-y-3">
          <ImageIcon className="w-12 h-12 mx-auto stroke-1 text-slate-400" />
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm">No hay imágenes con los filtros seleccionados</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Los filtros actuales (Comercio o Estado) no arrojaron coincidencias.'
                : 'Aún no hay archivos subidos en el Storage de Supabase.'}
            </p>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={handleResetFilters}
              className="font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 h-9 text-xs gap-1.5 shadow-md shadow-blue-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mostrar Todas las Imágenes</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedFiles.map((file, idx) => {
            const isSelected = selectedPaths.includes(file.fullPath);

            return (
              <Card
                key={idx}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Thumbnail Header */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden flex items-center justify-center group">
                  <img
                    src={file.publicUrl}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80';
                    }}
                  />

                  {/* Multi-select checkbox: Only active for unused files */}
                  {canEdit && (
                    <div
                      onClick={() => toggleSelectPath(file.fullPath, file.isInUse)}
                      className={`absolute top-2.5 left-2.5 z-20 cursor-pointer ${
                        file.isInUse ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                      title={file.isInUse ? 'Imagen en uso: no se puede seleccionar para eliminar' : 'Seleccionar para eliminar'}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition shadow-md ${
                          file.isInUse
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/90 text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        {file.isInUse ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    {file.isInUse ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md">
                        <Lock className="w-3 h-3" /> En Uso (Bloqueada)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-md">
                        Sin Usar (Liberable)
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <CardContent className="p-3.5 space-y-2">
                  <p className="font-bold text-xs text-slate-900 truncate" title={file.name}>
                    {file.name}
                  </p>

                  {/* Associated Business Tag */}
                  {file.associatedBusinessName && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold truncate">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate" title={file.associatedBusinessName}>
                        {file.associatedBusinessName}
                      </span>
                    </div>
                  )}

                  {file.size && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Tamaño: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  )}

                  {/* Usage detail */}
                  {file.isInUse && file.usedBy ? (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 space-y-0.5">
                      <span className="font-bold block flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Protegida por uso en:
                      </span>
                      <span className="truncate block font-medium" title={file.usedBy.join(', ')}>
                        {file.usedBy[0]} {file.usedBy.length > 1 ? `(+${file.usedBy.length - 1} más)` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-[10px] text-amber-900">
                      Archivo libre (se puede eliminar de forma segura)
                    </div>
                  )}
                </CardContent>

                {/* Actions Footer */}
                <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver original</span>
                  </a>

                  {canEdit && (
                    file.isInUse ? (
                      <div
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-lg select-none cursor-not-allowed"
                        title="No se puede eliminar porque está en uso"
                      >
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>En uso</span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteFile(file)}
                        className="h-7 px-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredFiles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[12, 24, 48, 96]}
        />
      </div>

      {/* Confirmation Dialog for Single File Delete (Only applies to UNUSED files) */}
      <Dialog open={Boolean(confirmDeleteFile)} onOpenChange={() => setConfirmDeleteFile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>¿Eliminar imagen libre de Supabase Storage?</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-slate-600">
            <p>
              Estás a punto de eliminar el archivo libre <strong className="text-slate-900 font-mono">{confirmDeleteFile?.name}</strong>.
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Imagen sin dependencias</span>
              </div>
              <p className="text-[11px]">
                Esta imagen no está vinculada a ningún comercio o producto, por lo que se puede eliminar de forma segura para liberar espacio.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteFile(null)}
              disabled={isDeleting}
              className="rounded-full text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={executeSingleDelete}
              disabled={isDeleting}
              className="rounded-full font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, Eliminar del Storage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Multiple Files Delete (Only applies to UNUSED files) */}
      <Dialog open={confirmDeleteMultiple} onOpenChange={setConfirmDeleteMultiple}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>¿Eliminar {selectedPaths.length} imágenes sin usar?</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-slate-600">
            <p>
              Se eliminarán permanentemente las <strong>{selectedPaths.length} imágenes libres</strong> seleccionadas del bucket de Supabase Storage. Esta acción liberará espacio en el servidor de forma segura sin afectar ningún comercio.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteMultiple(false)}
              disabled={isDeleting}
              className="rounded-full text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={executeMultipleDelete}
              disabled={isDeleting}
              className="rounded-full font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white"
            >
              {isDeleting ? 'Eliminando...' : `Eliminar ${selectedPaths.length} Archivos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
