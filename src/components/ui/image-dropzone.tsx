'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, CheckCircle2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { StorageImageModal } from './storage-image-modal';
import { calculateFileHash } from '@/lib/image-hash';
import { toast } from 'sonner';

interface ImageDropzoneProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
  businessId?: string;
  businessName?: string;
}

const STORAGE_BUCKET = 'residential-directory';

export function ImageDropzone({
  label,
  value,
  onChange,
  folder = 'uploads',
  className = '',
  businessId,
  businessName,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 50 MB permitidos por Supabase.');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Procesando imagen...');

    try {
      const fullHash = await calculateFileHash(file);
      const hashKey = fullHash.slice(0, 24);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const cleanFileName = `${hashKey}.${fileExt}`;
      
      const targetFolder = businessId ? `${folder}/${businessId}` : folder;
      const filePath = `${targetFolder}/${cleanFileName}`;

      // Check if this exact file already exists in the bucket
      const { data: existingList } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(targetFolder, { limit: 100, search: hashKey });

      const foundExisting = existingList?.find((item) => item.name.includes(hashKey));

      if (foundExisting) {
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(`${targetFolder}/${foundExisting.name}`);

        onChange(publicUrlData.publicUrl);
        toast.info('Imagen existente detectada en el Storage: se reutilizó sin duplicar.');
        return;
      }

      // If not existing, upload with deterministic hash name
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      const publicUrl = publicUrlData.publicUrl;
      onChange(publicUrl);
      toast.success('Imagen subida a Supabase Storage con éxito');
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      toast.error(`Error al subir imagen a Supabase: ${err?.message || 'Error de almacenamiento'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        {label && <label className="text-slate-700 text-xs font-semibold block">{label}</label>}
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1 cursor-pointer"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Elegir del Storage</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* If an image is already uploaded or provided */}
      {value ? (
        <div className="relative group rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300 relative">
            <img
              src={value}
              alt="Vista previa"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px] mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Imagen en Storage</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 truncate" title={value}>
              {value}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGalleryOpen(true)}
              className="h-8 text-xs font-semibold px-2 rounded-lg gap-1 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
              title="Abrir galería de Supabase"
            >
              <HardDrive className="w-3 h-3" />
              <span className="hidden sm:inline">Storage</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 text-xs font-semibold px-2.5 rounded-lg"
            >
              Subir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange('')}
              disabled={isUploading}
              className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
              title="Quitar imagen"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Dropzone area */
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2 py-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">{uploadProgress}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    Arrastra o haz clic para subir imagen
                  </p>
                  <p className="text-[10px] text-slate-500">
                    PNG, JPG o WEBP a Supabase Storage
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGalleryOpen(true)}
              className="w-full text-xs font-bold h-8 rounded-xl border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100 flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>
                {businessName
                  ? `Elegir de fotos de "${businessName}" o Storage`
                  : 'O seleccionar imagen existente del Storage'}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Storage Image Selection Modal */}
      <StorageImageModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectImage={onChange}
        initialFolder={folder}
        businessId={businessId}
        businessName={businessName}
      />
    </div>
  );
}
