import { X, FileText, Search } from 'lucide-react';

export interface MatchedChunk {
  documentId: string;
  documentName: string;
  text: string;
  similarity: number;
}

interface ScanningPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchedChunks: MatchedChunk[];
  isSearching: boolean;
}

export default function ScanningPopup({ isOpen, onClose, matchedChunks, isSearching }: ScanningPopupProps) {
  if (!isOpen) return null;

  const groupedByDocument = matchedChunks.reduce((acc, chunk) => {
    if (!acc[chunk.documentName]) {
      acc[chunk.documentName] = [];
    }
    acc[chunk.documentName].push(chunk);
    return acc;
  }, {} as Record<string, MatchedChunk[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Document Scanning</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isSearching && matchedChunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-lg font-bold text-slate-800 mb-2">Evaluating All 9 Chunking Strategies</p>
              <p className="text-sm text-slate-600 mb-6">Processing in parallel for maximum speed...</p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                  <p className="text-sm font-semibold text-blue-900">Parallel Strategy Evaluation</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  {[
                    'Fixed-Size',
                    'Sentence-Based',
                    'Paragraph-Based',
                    'Semantic',
                    'Recursive',
                    'Structure-Aware',
                    'Token-Based',
                    'Sliding Window',
                    'Hybrid'
                  ].map((strategy, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/50 rounded px-2 py-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${idx * 100}ms` }} />
                      <span className="text-slate-700 font-medium">{strategy}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-blue-700 mt-4 text-center">
                  ⚡ All strategies are being evaluated simultaneously
                </p>
              </div>
            </div>
          ) : matchedChunks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">No matching content found</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Found {matchedChunks.length} relevant text chunk{matchedChunks.length !== 1 ? 's' : ''} across{' '}
                  {Object.keys(groupedByDocument).length} document{Object.keys(groupedByDocument).length !== 1 ? 's' : ''}
                </p>
              </div>

              {Object.entries(groupedByDocument).map(([docName, chunks]) => (
                <div key={docName} className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-3 border-b-2 border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold text-slate-800">{docName}</h3>
                      <span className="ml-auto text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-medium">
                        {chunks.length} match{chunks.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {chunks.map((chunk, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-yellow-800 uppercase">
                            Matched Content
                          </span>
                          <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded-full font-bold">
                            {Math.round(chunk.similarity * 100)}% match
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {chunk.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
