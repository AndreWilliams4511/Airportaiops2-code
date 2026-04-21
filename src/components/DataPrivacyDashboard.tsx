import { Shield, AlertTriangle, CheckCircle, TrendingUp, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPIIStatistics } from '../lib/supabase';

export default function DataPrivacyDashboard() {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    piiDetected: 0,
    piiClean: 0,
    piiByType: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPIIStats();
  }, []);

  async function loadPIIStats() {
    setLoading(true);
    const data = await getPIIStatistics();
    setStats(data);
    setLoading(false);
  }

  const getPIITypeName = (type: string): { name: string; icon: string } => {
    const typeInfo: Record<string, { name: string; icon: string }> = {
      ssn: { name: 'Social Security Numbers', icon: '🔢' },
      phone: { name: 'Phone Numbers', icon: '📱' },
      email: { name: 'Email Addresses', icon: '📧' },
      credit_card: { name: 'Credit Card Numbers', icon: '💳' },
      address: { name: 'Physical Addresses', icon: '🏠' },
      hateful: { name: 'Hateful Content', icon: '⚠️' },
      harmful: { name: 'Harmful Content', icon: '🚫' }
    };
    return typeInfo[type] || { name: type, icon: '📋' };
  };

  const complianceRate = stats.totalPrompts > 0
    ? ((stats.piiClean / stats.totalPrompts) * 100).toFixed(1)
    : 100;

  const violationRate = stats.totalPrompts > 0
    ? ((stats.piiDetected / stats.totalPrompts) * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Airport Data Privacy & Security Dashboard</h2>
          <p className="text-xs text-slate-600">PII Detection & Compliance Monitoring for Airport Operations</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-2">Loading privacy statistics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <span className="text-3xl font-bold text-blue-700">{stats.piiClean}</span>
              </div>
              <p className="text-sm font-semibold text-blue-800">Clean Prompts</p>
              <p className="text-xs text-blue-600 mt-1">No PII detected</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <span className="text-3xl font-bold text-red-700">{stats.piiDetected}</span>
              </div>
              <p className="text-sm font-semibold text-red-800">PII Violations</p>
              <p className="text-xs text-red-600 mt-1">Sensitive data detected</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <span className="text-3xl font-bold text-emerald-700">{complianceRate}%</span>
              </div>
              <p className="text-sm font-semibold text-emerald-800">Compliance Rate</p>
              <p className="text-xs text-emerald-600 mt-1">Privacy adherence</p>
            </div>
          </div>

          {stats.piiDetected > 0 && (
            <div className="mb-4">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-800">PII Types Detected</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(stats.piiByType).map(([type, count]) => {
                    const typeInfo = getPIITypeName(type);
                    return (
                      <div
                        key={type}
                        className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{typeInfo.icon}</span>
                            <span className="text-sm font-semibold text-slate-700">{typeInfo.name}</span>
                          </div>
                          <span className="text-lg font-bold text-red-600">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-yellow-900 mb-1">Privacy Guidelines</h3>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• Never include Social Security Numbers, credit card numbers, or financial data</li>
                      <li>• Avoid sharing phone numbers, email addresses, or physical addresses</li>
                      <li>• Do not use hateful, harmful, or threatening language</li>
                      <li>• Remove all personally identifiable information before submitting prompts</li>
                      <li>• Violations are logged and monitored for compliance purposes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats.totalPrompts === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 mt-4">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">No prompts submitted yet</p>
              <p className="text-xs text-slate-500 mt-1">Privacy monitoring will begin when you start using the chatbot</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
