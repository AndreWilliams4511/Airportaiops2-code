import { useState } from 'react';
import { Building2, Upload, Check, Sparkles, Plus } from 'lucide-react';
import { createDepartmentWithPersona } from '../lib/supabase';

interface AddDepartmentProps {
  onDepartmentCreated: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, departmentName: string) => void;
  uploading: boolean;
}

function AddDepartment({ onDepartmentCreated, onFileUpload, uploading }: AddDepartmentProps) {
  const [departmentName, setDepartmentName] = useState('');
  const [personaName, setPersonaName] = useState('');
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreateDepartment() {
    if (!departmentName.trim()) {
      alert('Please enter a department name.');
      return;
    }

    if (!personaName.trim()) {
      alert('Please enter a persona name.');
      return;
    }

    if (!personaPrompt.trim()) {
      alert('Please enter a persona description.');
      return;
    }

    setCreating(true);
    try {
      const { success } = await createDepartmentWithPersona(
        departmentName.trim(),
        personaName.trim(),
        personaPrompt.trim()
      );

      if (success) {
        setShowFileUpload(true);
        onDepartmentCreated();
      } else {
        alert('Failed to create department. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating department:', error);
      alert(`Error creating department: ${error.message}`);
    } finally {
      setCreating(false);
    }
  }

  function handleReset() {
    setDepartmentName('');
    setPersonaName('');
    setPersonaPrompt('');
    setShowFileUpload(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Operations Unit</h2>
              <p className="text-blue-100 text-sm mt-0.5">Add a new airport operations unit with a custom AI persona</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {!showFileUpload ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Operations Unit Name
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="e.g., Runway Operations, Terminal Services, Ground Transport"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Persona Name
                </label>
                <input
                  type="text"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="e.g., Runway Ops Analyst, Terminal Flow Specialist, Ground Safety Officer"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Persona Description
                </label>
                <textarea
                  value={personaPrompt}
                  onChange={(e) => setPersonaPrompt(e.target.value)}
                  placeholder="Describe the persona's role, expertise, and how it should respond to queries..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all resize-none"
                />
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Example: "You are an airport operations analyst who specializes in analyzing runway throughput and providing strategic insights for capacity optimization..."
                </p>
              </div>

              <button
                onClick={handleCreateDepartment}
                disabled={!departmentName.trim() || !personaName.trim() || !personaPrompt.trim() || creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Operations Unit
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-1">Operations Unit Created!</h3>
                <p className="text-sm text-green-700">
                  <span className="font-semibold">{departmentName}</span> with persona <span className="font-semibold">{personaName}</span> is now available in the Ops Command Center
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-5 h-5 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-800">Upload Documents (Optional)</h3>
                </div>

                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                    onChange={(e) => onFileUpload(e, departmentName)}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className={`w-full py-3 px-6 rounded-lg border-2 border-dashed transition-all cursor-pointer text-center ${
                    uploading
                      ? 'border-slate-300 bg-slate-100 cursor-not-allowed'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
                          <span className="text-sm font-medium text-slate-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">Choose Files</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, TXT, CSV, XLSX, XLS</p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Operations Unit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddDepartment;
