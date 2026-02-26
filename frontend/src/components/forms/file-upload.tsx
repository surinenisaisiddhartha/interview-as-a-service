import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (files: FileList) => void;
    accept?: string;
    multiple?: boolean;
}

export function FileUpload({ onFileSelect, accept, multiple }: FileUploadProps) {
    return (
        <div
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-upload-input')?.click()}
        >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <span className="text-sm font-medium text-gray-600">Click or drag and drop to upload</span>
            <input
                id="file-upload-input"
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={(e) => e.target.files && onFileSelect(e.target.files)}
            />
        </div>
    );
}
