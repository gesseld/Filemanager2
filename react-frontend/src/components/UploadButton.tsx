import React, { useRef } from 'react';
import { useFileContext } from '../contexts/FileContext';

interface UploadButtonProps {
  onUploadSuccess: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileContext();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        await uploadFile(files[0]);
        onUploadSuccess();
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
      >
        Upload File
      </label>
    </div>
  );
};

export default UploadButton;
