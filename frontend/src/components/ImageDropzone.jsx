import { useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

const MAX_IMAGES = 6;

const ImageDropzone = ({ files, onChange }) => {
  const inputRef = useRef(null);

  const addFiles = (newFiles) => {
    const combined = [...files, ...Array.from(newFiles)].slice(0, MAX_IMAGES);
    onChange(combined);
  };

  const removeAt = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div className="field">
      <label>Photos (up to {MAX_IMAGES})</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        style={{
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)',
          textAlign: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
        }}
      >
        <FiUpload size={20} />
        <p style={{ fontSize: '0.875rem', marginTop: 8 }}>Click or drag images here</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-4" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
          {files.map((file, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={URL.createObjectURL(file)}
                alt={`upload-${i}`}
                style={{
                  width: '100%',
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="btn btn-icon btn-ghost"
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  padding: 4,
                  background: 'var(--surface)',
                }}
                aria-label="Remove image"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
