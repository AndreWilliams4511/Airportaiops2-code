import { AlertTriangle, X } from 'lucide-react';
import { PIIDetectionResult } from '../lib/piiDetection';

interface PIIWarningPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  piiResult: PIIDetectionResult;
}

export default function PIIWarningPopup({ isOpen, onClose, onProceed, piiResult }: PIIWarningPopupProps) {
  if (!isOpen) return null;

  const getPIITypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      ssn: 'Social Security Number',
      phone: 'Phone Number',
      email: 'Email Address',
      credit_card: 'Credit Card Number',
      address: 'Physical Address',
      hateful: 'Hateful/Harmful Content',
      harmful: 'Potentially Harmful Content'
    };
    return typeNames[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Privacy & Security Warning</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <p className="text-red-900 font-semibold mb-2">
                ⚠️ Potentially Sensitive Information Detected
              </p>
              <p className="text-red-800 text-sm">
                Your prompt contains information that may compromise your privacy or violate our usage policies.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Detected Issues:</h3>
              <ul className="space-y-2">
                {piiResult.types.map((type, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span className="text-sm text-slate-700 font-medium">{getPIITypeName(type)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 mb-2">For Your Privacy & Security:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Do not include Social Security Numbers, credit card numbers, or other financial information</li>
                <li>• Avoid sharing phone numbers, email addresses, or physical addresses</li>
                <li>• Refrain from using hateful, harmful, or threatening language</li>
                <li>• Remove any personally identifiable information before submitting</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-6">
            <p className="text-xs text-yellow-900">
              <strong>Note:</strong> This prompt has been flagged and will be logged for compliance monitoring purposes.
              Repeated violations may result in restricted access.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel & Revise
            </button>
            <button
              onClick={onProceed}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Proceed Anyway
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-4">
            We strongly recommend revising your prompt to remove sensitive information
          </p>
        </div>
      </div>
    </div>
  );
}
