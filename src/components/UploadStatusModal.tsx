import { CheckCircle, XCircle, Upload, X, FileText } from 'lucide-react';

export interface UploadFileStatus {
  filename: string;
  sizeBytes: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface UploadStatusModalProps {
  isOpen: boolean;
  files: UploadFileStatus[];
  onClose: () => void;
  isComplete: boolean;
}

function formatMB(bytes: number): string {
  if (bytes === 0) return '0.00 MB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function UploadStatusModal({ isOpen, files, onClose, isComplete }: UploadStatusModalProps) {
  if (!isOpen) return null;

  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Document Upload</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isComplete
                  ? `${successCount} of ${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully`
                  : `Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...`}
              </p>
            </div>
          </div>
          {isComplete && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
          {files.map((file, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                file.status === 'success'
                  ? 'bg-emerald-50 border-emerald-100'
                  : file.status === 'error'
                  ? 'bg-red-50 border-red-100'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <FileText className="w-4 h-4 text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{file.filename}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatMB(file.sizeBytes)}</p>
              </div>

              <div className="flex-shrink-0">
                {file.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {file.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
                {file.status === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        {isComplete && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              {successCount > 0 && (
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {successCount} uploaded
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errorCount} failed
                </span>
              )}
              {uploadingCount === 0 && errorCount === 0 && (
                <span className="text-xs font-medium text-slate-500">All files processed</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
