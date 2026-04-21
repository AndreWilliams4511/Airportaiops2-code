import { FileText, Upload, Trash2, AlertCircle, Download, Folder } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Document, deleteDocument, getDocumentVersionCount, deleteAllDocuments } from '../lib/supabase';

interface DocumentManagementProps {
  documents: Document[];
  uploadingDocs: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentDeleted: () => void;
  totalUploadedCount: number;
  deletedDocumentsCount: number;
  departmentName: string;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  chunkingStrategy: string;
  selectedChunkingStrategy?: {
    strategy: string;
    strategyNumber: string;
  } | null;
}

export default function DocumentManagement({
  documents,
  uploadingDocs,
  onFileUpload,
  onDocumentDeleted,
  totalUploadedCount,
  deletedDocumentsCount,
  departmentName,
  selectedRole,
  onRoleChange,
  chunkingStrategy,
  selectedChunkingStrategy,
}: DocumentManagementProps) {

  const getStrategyName = (strategy: string): string => {
    const strategies: Record<string, string> = {
      '1': 'Fixed-Size Chunking',
      '2': 'Sentence-Based Chunking',
      '3': 'Paragraph-Based Chunking',
      '4': 'Semantic Chunking',
      '5': 'Recursive Chunking',
      '6': 'Document Structure-Aware',
      '7': 'Token-Based Chunking',
      '8': 'Sliding Window',
      '9': 'Hybrid Approaches',
    };
    return strategies[strategy] || 'Fixed-Size Chunking';
  };
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [versionCounts, setVersionCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVersionCounts();
  }, [documents, departmentName]);

  async function loadVersionCounts() {
    const counts: Record<string, number> = {};
    for (const doc of documents) {
      const count = await getDocumentVersionCount(doc.filename);
      counts[doc.id] = count;
    }
    setVersionCounts(counts);
  }

  function handleViewDocument(doc: Document) {
    if (!doc.file_content) {
      alert('File content not available for this document.');
      return;
    }

    const byteCharacters = atob(doc.file_content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: doc.file_type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUserId = (userId: string | null) => {
    if (!userId) return 'anonymous';
    return userId.substring(0, 8) + '...';
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also remove all associated embeddings.')) {
      return;
    }

    setDeletingId(documentId);
    const success = await deleteDocument(documentId);
    setDeletingId(null);

    if (success) {
      onDocumentDeleted();
    } else {
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${documents.length} documents from ${departmentName}? This will also remove all associated embeddings. This action cannot be undone.`)) {
      return;
    }

    setDeletingAll(true);

    for (const doc of documents) {
      await deleteDocument(doc.id);
    }

    setDeletingAll(false);
    onDocumentDeleted();
    alert(`All documents from ${departmentName} have been deleted successfully.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
            <Folder className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">{departmentName}</h2>
            <p className="text-sm text-slate-600">Document Management</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Current Documents</p>
                <p className="text-3xl font-bold text-blue-900">{documents.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-60" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Uploaded</p>
                <p className="text-3xl font-bold text-green-900">{totalUploadedCount}</p>
              </div>
              <Upload className="w-10 h-10 text-green-500 opacity-60" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Documents Deleted</p>
                <p className="text-3xl font-bold text-red-900">{deletedDocumentsCount}</p>
              </div>
              <Trash2 className="w-10 h-10 text-red-500 opacity-60" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <Upload className="inline w-5 h-5 mr-2" />
            Upload New Documents
          </label>
          <input
            key={`file-input-${departmentName}`}
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.docx,.csv,.xlsx,.xls"
            onChange={onFileUpload}
            disabled={uploadingDocs}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploadingDocs && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Processing documents...
              </p>
            </div>
          )}
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Supported formats: PDF, TXT, DOCX, CSV, XLSX, XLS
          </p>
          {selectedChunkingStrategy && (
            <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg shadow-md">
              <p className="text-sm text-emerald-900 font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-600" />
                Selected Best Chunking Strategy from Metrics Analysis
              </p>
              <div className="mt-2 p-3 bg-white/60 rounded-md border border-emerald-200">
                <p className="text-base font-bold text-emerald-800">
                  Strategy {selectedChunkingStrategy.strategyNumber}: {selectedChunkingStrategy.strategy}
                </p>
              </div>
              <p className="text-xs text-emerald-700 mt-2">
                {chunkingStrategy === selectedChunkingStrategy.strategyNumber
                  ? '✓ This strategy is now ACTIVE and will be used for all new document uploads'
                  : 'This strategy was selected but is not yet active for uploads'}
              </p>
            </div>
          )}
          {!selectedChunkingStrategy && (
            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Active Chunking Strategy: {getStrategyName(chunkingStrategy)}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Go to the Metrics tab to compare all 9 chunking strategies and select the best one
              </p>
            </div>
          )}
          <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-bold flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Documents uploaded here will be available to all personas in {departmentName}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Uploaded Documents ({documents.length})
            </h3>
            {documents.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition border-2 border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Delete all documents"
              >
                {deletingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </>
                )}
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No documents uploaded yet for {departmentName}</p>
              <p className="text-slate-400 text-sm mt-2">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      File Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Version
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Uploaded At
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      User ID
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                          <span className="text-slate-700 font-medium">
                            {doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 text-sm">
                          {doc.file_type || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 text-sm font-semibold">
                          v{doc.version || 1} {versionCounts[doc.id] > 1 && `(${versionCounts[doc.id]} total)`}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 text-sm">
                          {formatDate(doc.uploaded_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 text-sm font-mono">
                          {formatUserId(doc.user_id)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Download document"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete document"
                          >
                            {deletingId === doc.id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
