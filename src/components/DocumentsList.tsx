import { FileText, X, AlertCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Document, deleteDocument } from '../lib/supabase';
import { PersonaRole } from '../lib/embeddings';

interface DocumentsListProps {
  documents: Document[];
  personas: PersonaRole[];
  selectedRole: string;
  onRoleChange: (role: string) => void;
  onDocumentDeleted: () => void;
  onClose: () => void;
}

export default function DocumentsList({ documents, personas, selectedRole, onRoleChange, onDocumentDeleted, onClose }: DocumentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const formatUserId = (userId: string) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Uploaded Documents</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {personas.length > 0 && (
          <div className="p-6 pb-0">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Select AI Persona Role
                </label>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {personas.length} personas ready
                </span>
              </div>
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-slate-800"
              >
                <option value="">Choose a persona...</option>
                {personas.map((persona) => (
                  <option key={persona.name} value={persona.name}>
                    {persona.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                AI personas generated from your document content
              </p>
            </div>
          </div>
        )}

        <div className="overflow-auto flex-1 p-6">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      File Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Type
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
                        <div className="flex justify-center">
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

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Total Documents: {documents.length}</span>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
