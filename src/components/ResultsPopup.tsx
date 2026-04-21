import { X } from 'lucide-react';
import ResultsPanel from './ResultsPanel';

interface ResultDocument {
  index: number;
  similarity: number;
  text: string;
  filename: string;
  file_type: string;
  document_id: string;
}

interface ResultsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  response: string;
  accuracy: number;
  topDocs: ResultDocument[];
  onViewDocument: (doc: ResultDocument) => void;
  promptId?: string;
  currentFeedback?: string | null;
  onFeedback?: (feedback: 'up' | 'down') => void;
  userPrompt?: string;
}

export default function ResultsPopup({
  isOpen,
  onClose,
  response,
  accuracy,
  topDocs,
  onViewDocument,
  promptId,
  currentFeedback,
  onFeedback,
  userPrompt,
}: ResultsPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Your Results Are Ready!</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ResultsPanel
            response={response}
            accuracy={accuracy}
            topDocs={topDocs}
            onViewDocument={onViewDocument}
            promptId={promptId}
            currentFeedback={currentFeedback}
            onFeedback={onFeedback}
            userPrompt={userPrompt}
          />
        </div>
      </div>
    </div>
  );
}
