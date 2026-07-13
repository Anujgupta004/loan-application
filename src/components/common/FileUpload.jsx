import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { compressImage, formatFileSize, generatePreview } from '../../utils/imageCompression';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};

export default function FileUpload({
  id,
  label,
  required,
  accept = ACCEPTED_TYPES,
  maxSize = 5 * 1024 * 1024,
  maxFiles = 1,
  value = [],
  onChange,
  error,
  helpText,
  compress = true,
}) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  // Track object URLs so we can revoke them on unmount (prevent memory leaks)
  const objectUrlsRef = useRef([]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const processed = [];
      setCompressionInfo(null);

      for (const file of acceptedFiles) {
        let finalFile = file;
        let info = null;

        if (compress && file.type.startsWith('image/')) {
          setIsCompressing(true);
          try {
            const result = await compressImage(file);
            finalFile = result.compressedFile;
            info = {
              originalSize: formatFileSize(result.originalSize),
              compressedSize: formatFileSize(result.compressedSize),
              saved: Math.round((1 - result.compressedSize / result.originalSize) * 100),
            };
            setCompressionInfo(info);
          } catch {
            // Use original if compression fails
          }
          setIsCompressing(false);
        }

        const preview = generatePreview(finalFile);
        // Track URL so we can revoke it on unmount
        if (preview) objectUrlsRef.current.push(preview);
        processed.push({ file: finalFile, preview, name: file.name, type: file.type, size: finalFile.size, info });
      }

      const newFiles = maxFiles === 1 ? processed : [...value, ...processed].slice(0, maxFiles);
      onChange && onChange(newFiles);
    },
    [value, onChange, maxFiles, compress]
  );

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      });
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple: maxFiles > 1,
  });

  const removeFile = (idx) => {
    const updated = value.filter((_, i) => i !== idx);
    // Revoke the object URL of the removed file to free memory
    if (value[idx]?.preview) {
      try { URL.revokeObjectURL(value[idx].preview); } catch { /* ignore */ }
    }
    onChange && onChange(updated);
    setCompressionInfo(null);
  };

  const rejectionMessages = fileRejections.flatMap(({ file, errors: errs }) =>
    errs.map((e) => {
      if (e.code === 'file-too-large') return `${file.name}: exceeds ${formatFileSize(maxSize)} limit`;
      if (e.code === 'file-invalid-type') return `${file.name}: unsupported file type`;
      return `${file.name}: ${e.message}`;
    })
  );

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}

      {/* Drop Zone */}
      {(value.length < maxFiles) && (
        <div
          {...getRootProps()}
          id={id}
          role="button"
          tabIndex={0}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
            ${error ? 'border-error' : ''}
          `}
          aria-label={`Upload ${label || 'file'}. Press Enter or Space to open file picker.`}
        >
          <input
            {...getInputProps()}
            id={`${id}-input`}
            data-cy={`${id}-input`}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <div className="flex flex-col items-center gap-2">
            {isCompressing ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <p className="text-sm text-gray-500">Compressing image...</p>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive ? 'Drop file here...' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {helpText || `PDF, JPG, PNG up to ${formatFileSize(maxSize)}`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compression info */}
      {compressionInfo && (
        <div className="mt-2 text-xs text-accent bg-green-50 border border-green-200 rounded px-3 py-1.5 flex items-center gap-2" aria-live="polite">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Image compressed: {compressionInfo.originalSize} → {compressionInfo.compressedSize} ({compressionInfo.saved}% saved)
        </div>
      )}

      {/* Previews */}
      {value.length > 0 && (
        <div className="mt-3 space-y-2" aria-live="polite">
          {value.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
              {item.preview ? (
                <img src={item.preview} alt={item.name} className="w-12 h-12 object-cover rounded border" />
              ) : (
                <div className="w-12 h-12 bg-red-50 border border-red-200 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 rounded text-gray-400 hover:text-error hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Remove ${item.name}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rejection errors */}
      {rejectionMessages.length > 0 && (
        <div className="mt-2 space-y-1" aria-live="polite">
          {rejectionMessages.map((msg, i) => (
            <p key={i} role="alert" className="text-xs text-error flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Validation error */}
      {error && (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="mt-1 text-xs text-error flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
