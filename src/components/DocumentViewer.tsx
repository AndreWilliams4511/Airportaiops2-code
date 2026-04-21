import { X, FileText, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  topDocument: {
    filename: string;
    text: string;
    similarity: number;
    file_type?: string;
  };
  onClose: () => void;
}

export default function DocumentViewer({ topDocument, onClose }: DocumentViewerProps) {
  const cleanText = (text: string): string => {
    if (!text) return '';

    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  };

  const formatText = (text: string) => {
    const cleanedText = cleanText(text);
    const lines = cleanedText.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: JSX.Element[] = [];
    let listType: 'bullet' | 'numbered' | null = null;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentList.length > 0) {
          elements.push(
            listType === 'bullet' ? (
              <ul key={`list-${idx}`} className="ml-6 mb-4 list-disc list-outside">
                {currentList}
              </ul>
            ) : (
              <ol key={`list-${idx}`} className="ml-6 mb-4 list-decimal list-outside">
                {currentList}
              </ol>
            )
          );
          currentList = [];
          listType = null;
        }
        return;
      }

      const isBullet = /^[•\-*]\s/.test(trimmed);
      const isNumbered = /^\d+[\.\)]\s/.test(trimmed);
      const isHeading = /^#{1,6}\s/.test(trimmed) || (trimmed.length < 100 && trimmed.endsWith(':'));

      if (isHeading) {
        if (currentList.length > 0) {
          elements.push(
            listType === 'bullet' ? (
              <ul key={`list-${idx}`} className="ml-6 mb-4 list-disc list-outside">
                {currentList}
              </ul>
            ) : (
              <ol key={`list-${idx}`} className="ml-6 mb-4 list-decimal list-outside">
                {currentList}
              </ol>
            )
          );
          currentList = [];
          listType = null;
        }
        elements.push(
          <h3 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3 first:mt-0">
            {trimmed.replace(/^#{1,6}\s/, '').replace(/:$/, '')}
          </h3>
        );
      } else if (isBullet) {
        if (listType === 'numbered' && currentList.length > 0) {
          elements.push(
            <ol key={`list-${idx}`} className="ml-6 mb-4 list-decimal list-outside">
              {currentList}
            </ol>
          );
          currentList = [];
        }
        listType = 'bullet';
        currentList.push(
          <li key={idx} className="text-slate-700 leading-relaxed mb-2">
            {trimmed.replace(/^[•\-*]\s/, '')}
          </li>
        );
      } else if (isNumbered) {
        if (listType === 'bullet' && currentList.length > 0) {
          elements.push(
            <ul key={`list-${idx}`} className="ml-6 mb-4 list-disc list-outside">
              {currentList}
            </ul>
          );
          currentList = [];
        }
        listType = 'numbered';
        currentList.push(
          <li key={idx} className="text-slate-700 leading-relaxed mb-2">
            {trimmed.replace(/^\d+[\.\)]\s/, '')}
          </li>
        );
      } else {
        if (currentList.length > 0) {
          elements.push(
            listType === 'bullet' ? (
              <ul key={`list-${idx}`} className="ml-6 mb-4 list-disc list-outside">
                {currentList}
              </ul>
            ) : (
              <ol key={`list-${idx}`} className="ml-6 mb-4 list-decimal list-outside">
                {currentList}
              </ol>
            )
          );
          currentList = [];
          listType = null;
        }
        elements.push(
          <p key={idx} className="text-slate-700 leading-relaxed mb-4">
            {trimmed}
          </p>
        );
      }
    });

    if (currentList.length > 0) {
      elements.push(
        listType === 'bullet' ? (
          <ul key="list-final" className="ml-6 mb-4 list-disc list-outside">
            {currentList}
          </ul>
        ) : (
          <ol key="list-final" className="ml-6 mb-4 list-decimal list-outside">
            {currentList}
          </ol>
        )
      );
    }

    return elements;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border-2 border-blue-200 animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Most Relevant Document Section</h2>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                <span className="font-medium">From:</span>
                <span className="font-bold text-blue-600">{topDocument.filename}</span>
                {topDocument.file_type && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    {topDocument.file_type}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-xl transition-all hover:rotate-90"
            title="Close"
          >
            <X className="w-6 h-6 text-slate-600 hover:text-red-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-white to-slate-50">
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 via-emerald-50 to-blue-50 border-2 border-blue-200 rounded-xl shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-200 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  Relevance Score
                </span>
              </div>
              <span className="text-xl font-bold text-blue-600 bg-white px-4 py-2 rounded-lg border-2 border-blue-300 shadow-sm">
                {(topDocument.similarity * 100).toFixed(1)}% Match
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border-2 border-slate-200 shadow-lg">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-slate-200">
              <div className="bg-slate-200 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Document Content
              </h3>
            </div>
            <div className="max-w-none">
              <div className="text-base font-normal text-slate-800 whitespace-pre-wrap break-words">
                {formatText(topDocument.text)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Close Document Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
