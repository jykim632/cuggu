'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PersonRole, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/types/ai';

interface AIPhotoUploaderProps {
  role: PersonRole;
  image: File | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
}

export function AIPhotoUploader({
  role,
  image,
  onImageChange,
  disabled = false,
}: AIPhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleLabel = role === 'GROOM' ? '💙 신랑' : '💗 신부';
  const roleColor = role === 'GROOM' ? 'blue' : 'pink';

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'JPG, PNG, WebP 파일만 업로드 가능합니다';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '파일 크기는 10MB 이하여야 합니다';
    }
    return null;
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    onImageChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{roleLabel} 사진</h3>
        {image && (
          <span className="text-sm text-gray-500">
            {formatFileSize(image.size)} / 10 MB
          </span>
        )}
      </div>

      {/* Upload Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging
            ? roleColor === 'blue'
              ? '#3b82f6'
              : '#ec4899'
            : '#d1d5db',
        }}
        className={`
          relative rounded-lg border-2 border-dashed p-6 transition-colors
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isDragging ? 'bg-gray-50' : 'bg-white'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {image ? (
          /* Preview */
          <div className="space-y-3">
            <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-lg">
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{image.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={disabled}
                className="mt-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                제거
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 text-gray-400">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="mb-1 text-sm font-medium text-gray-700">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-500">
              1명의 얼굴만 업로드해주세요 (JPG, PNG, WebP, 최대 10MB)
            </p>
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
