import { MessageSquare, FileText, ThumbsUp, ThumbsDown, Sparkles, BarChart3 } from 'lucide-react';
import { getAccuracyColor } from '../lib/embeddings';
import { useState } from 'react';

interface ResultDocument {
  index: number;
  similarity: number;
  text: string;
  filename: string;
  file_type: string;
  document_id: string;
}

interface ResultsPanelProps {
  response?: string;
  accuracy?: number;
  topDocs?: ResultDocument[];
  onViewDocument?: (doc: ResultDocument) => void;
  promptId?: string;
  currentFeedback?: string | null;
  onFeedback?: (feedback: 'up' | 'down') => void;
  userPrompt?: string;
  chunkingStrategy?: string;
  chunkingStrategyNumber?: string;
}

export default function ResultsPanel({ response, accuracy, topDocs, onViewDocument, promptId, currentFeedback, onFeedback, userPrompt, chunkingStrategy, chunkingStrategyNumber }: ResultsPanelProps) {
  const [feedback, setFeedback] = useState<string | null>(currentFeedback || null);

  const formatResponse = (text: string): JSX.Element[] => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
        elements.push(
          <li key={idx} className="ml-4 text-slate-800 leading-relaxed">
            {trimmedLine.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, '')}
          </li>
        );
      } else if (trimmedLine.length > 0) {
        const boldPattern = /\*\*(.*?)\*\*/g;
        const parts = trimmedLine.split(boldPattern);

        elements.push(
          <p key={idx} className="text-slate-800 leading-relaxed mb-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 bg-yellow-100 px-1 rounded">{part}</strong> : part
            )}
          </p>
        );
      }
    });

    return elements;
  };

  const handleFeedback = (newFeedback: 'up' | 'down') => {
    setFeedback(newFeedback);
    if (onFeedback) {
      onFeedback(newFeedback);
    }
  };

  if (!response) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-xl shadow-xl p-4 border-2 border-blue-200 h-full flex flex-col overflow-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 via-emerald-500 to-purple-500 p-4 rounded-xl shadow-lg mx-auto w-fit animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-bounce shadow-lg flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 bg-clip-text text-transparent">
                Ready to Help!
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Follow these steps to get started:
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-blue-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Select a Department</p>
                <p className="text-xs text-slate-600 mt-0.5">Choose your department from the dropdown above</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Select a Persona</p>
                <p className="text-xs text-slate-600 mt-0.5">Pick the AI persona that fits your needs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Enter Your Prompt</p>
                <p className="text-xs text-slate-600 mt-0.5">Type your question in the text area</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                4
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Click Submit</p>
                <p className="text-xs text-slate-600 mt-0.5">A popup will show source documents. Close it to see formatted results here</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                5
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Optimize (Optional)</p>
                <p className="text-xs text-slate-600 mt-0.5">If confidence is low, go to Metrics tab to select a better chunking strategy, then return here</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-blue-200">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-slate-700">AI Ready</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-emerald-200">
              <FileText className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-medium text-slate-700">Docs Loaded</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-xl p-4 border-2 border-slate-200 h-full flex flex-col">
      <div className="mb-3 pb-3 border-b-2 border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-1.5 rounded-lg shadow-md">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Results</h2>
          </div>
          {accuracy !== undefined && (
            <div className={`px-3 py-1 rounded-xl font-bold text-xs shadow-md border-2 ${getAccuracyColor(accuracy)}`}>
              {(accuracy * 100).toFixed(1)}% Confidence
            </div>
          )}
        </div>
      </div>

      {chunkingStrategy && chunkingStrategyNumber && (
        <div className="mb-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 rounded-xl p-4 shadow-lg border-2 border-emerald-400 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">Selected Chunking Strategy</p>
                <p className="text-sm font-bold text-white">Strategy {chunkingStrategyNumber}: {chunkingStrategy}</p>
              </div>
            </div>
            {accuracy !== undefined && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                <p className="text-xs text-white/80 font-semibold mb-0.5">Confidence Score</p>
                <p className="text-2xl font-bold text-white">{(accuracy * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
        {userPrompt && (
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl p-4 shadow-lg border-2 border-blue-500">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-2 tracking-wide uppercase">Your Question</h3>
                <p className="text-base text-white leading-relaxed font-medium">{userPrompt}</p>
              </div>
            </div>
          </div>
        )}

        {topDocs && topDocs.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 border-2 border-emerald-300 rounded-lg">
            <p className="text-xs text-emerald-900 font-medium flex items-center gap-2">
              <div className="bg-emerald-200 p-1 rounded">
                <FileText className="w-4 h-4 text-emerald-700" />
              </div>
              Analysis based on {topDocs.length} relevant source document{topDocs.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Professional Analysis</h3>
          </div>
          <div className="prose max-w-none p-5 bg-white rounded-xl border-2 border-slate-200 shadow-lg">
            <div className="text-sm space-y-2">
              {formatResponse(response)}
            </div>
          </div>
          {onFeedback && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-slate-600">Rate this response:</span>
              <button
                onClick={() => handleFeedback('up')}
                className={`p-1.5 rounded-lg transition-all ${
                  feedback === 'up'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600'
                }`}
                title="Thumbs up"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                className={`p-1.5 rounded-lg transition-all ${
                  feedback === 'down'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600'
                }`}
                title="Thumbs down"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {topDocs && topDocs.length > 0 && onViewDocument && (
          <div className="border-t-2 border-slate-300 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="bg-blue-500 p-1 rounded-lg">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Source Documents
              </h3>
            </div>
            <div className="space-y-2">
              {topDocs.slice(0, 3).map((doc, idx) => (
                <div
                  key={idx}
                  onClick={() => onViewDocument(doc)}
                  className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-3 border-2 border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="bg-blue-200 group-hover:bg-blue-300 p-1 rounded-lg transition-colors">
                        <FileText className="w-3 h-3 text-blue-700" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition-colors">
                        {doc.filename}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-0.5 rounded-lg shadow-md group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
                      {(doc.similarity * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors">
                    <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed whitespace-pre-wrap break-words">
                      {doc.text}
                    </p>
                  </div>
                  <div className="mt-1 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to view full document section
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
