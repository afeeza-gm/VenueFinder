'use client';

import { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Link2,
  Sparkles,
} from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Venue Cover Photo',
  helpText = 'Upload directly to Cloudinary storage or provide a web image URL.',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Basic file validations
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
      setSuccessMsg('Uploaded to Cloudinary CDN successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload photo to Cloudinary. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const isCloudinary = value?.includes('cloudinary.com') || value?.includes('res.cloudinary.com');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block font-semibold text-neutral-800 text-xs">
            {label}
          </label>
          {helpText && (
            <p className="text-[11px] text-neutral-500 mt-0.5">{helpText}</p>
          )}
        </div>

        {/* Toggle between Direct Upload & Manual URL */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              mode === 'upload'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Cloudinary Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              mode === 'url'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Direct URL
          </button>
        </div>
      </div>

      {/* Main Upload / Input Region */}
      {mode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isUploading
              ? 'border-[#ff385c] bg-[#fff0f2]/50 cursor-wait'
              : 'border-neutral-200 hover:border-[#ff385c] bg-[#f7f7f7]/60 hover:bg-[#fff0f2]/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-[#ff385c] animate-spin" />
                <div className="text-xs font-semibold text-neutral-800">
                  Uploading to Cloudinary CDN...
                </div>
                <div className="text-[11px] text-neutral-500">
                  Optimizing resolution and responsive delivery
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-[#ff385c]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-neutral-800 text-xs text-[#ff385c] hover:underline">
                    Click to select photo
                  </span>{' '}
                  <span className="text-neutral-500 text-xs">or drag and drop</span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  PNG, JPG, or WEBP up to 10MB • Auto-stored in Cloudinary
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#ff385c] bg-white"
            />
            <Link2 className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Image Preview */}
      {value && (
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 group">
          <div className="aspect-video sm:aspect-21/9 w-full relative">
            <img
              src={value}
              alt="Venue preview"
              className="w-full h-full object-cover"
              onError={() => setError('Could not load image from this URL. Please verify the link or upload a new photo.')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          </div>

          {/* Badges & Actions Overlay */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            {isCloudinary ? (
              <span className="inline-flex items-center space-x-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20">
                <Sparkles className="w-3 h-3 text-[#ff385c]" />
                <span>Cloudinary CDN</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20">
                <ImageIcon className="w-3 h-3 text-neutral-300" />
                <span>Web URL</span>
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white text-[11px] truncate opacity-80 font-mono">
            {value}
          </div>
        </div>
      )}
    </div>
  );
}
