import { FileText, Folder, Database, Users, Clock, Bot, Upload, ClipboardList, FileStack } from 'lucide-react';
import { type Document, type AuditSchedule, type WorkPaper } from '../lib/supabase';

interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  documentCount: number;
  personaCount: number;
  lastUpdated: string | null;
}

interface Department {
  id: string;
  name: string;
  created_at: string;
}

interface DocumentsDashboardProps {
  departmentStats: DepartmentStats[];
  totalDocuments: number;
  departments: Department[];
  departmentDocuments: Record<string, Document[]>;
  uploadingByDepartment: Record<string, boolean>;
  onDepartmentFileUpload: (e: React.ChangeEvent<HTMLInputElement>, departmentName: string) => void;
  auditSchedules: AuditSchedule[];
  uploadingAuditSchedule: boolean;
  onAuditScheduleUpload: (e: React.ChangeEvent<HTMLInputElement>, year: number) => void;
  onDeleteAuditSchedule: (id: string) => void;
  workPapers: WorkPaper[];
  uploadingWorkPaper: boolean;
  onWorkPaperUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteWorkPaper: (id: string) => void;
}

const DEPT_COLOR_MAP: Record<string, { border: string; from: string; to: string; bg: string; icon: string; text: string }> = {
  'Passenger Flow & Terminal':    { border: 'border-sky-200',    from: 'from-sky-500',    to: 'to-sky-600',    bg: 'bg-sky-50',    icon: 'text-sky-600',    text: 'text-sky-800' },
  'Flight Delay & Disruption':    { border: 'border-orange-200', from: 'from-orange-500', to: 'to-orange-600', bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-800' },
  'Baggage Flow & Tracking':      { border: 'border-emerald-200',from: 'from-emerald-500',to: 'to-emerald-600',bg: 'bg-emerald-50',icon: 'text-emerald-600',text: 'text-emerald-800' },
  'Airside Operations':           { border: 'border-blue-200',   from: 'from-blue-500',   to: 'to-blue-600',   bg: 'bg-blue-50',   icon: 'text-blue-600',   text: 'text-blue-800' },
  'Staff Scheduling & Workforce': { border: 'border-violet-200', from: 'from-violet-500', to: 'to-violet-600', bg: 'bg-violet-50', icon: 'text-violet-600', text: 'text-violet-800' },
  'Gate & Slot Revenue':          { border: 'border-amber-200',  from: 'from-amber-500',  to: 'to-amber-600',  bg: 'bg-amber-50',  icon: 'text-amber-600',  text: 'text-amber-800' },
  'Safety & Security AI':         { border: 'border-red-200',    from: 'from-red-500',    to: 'to-red-600',    bg: 'bg-red-50',    icon: 'text-red-600',    text: 'text-red-800' },
  'Weather Impact & Resilience':  { border: 'border-cyan-200',   from: 'from-cyan-500',   to: 'to-cyan-600',   bg: 'bg-cyan-50',   icon: 'text-cyan-600',   text: 'text-cyan-800' },
};

const FALLBACK_COLORS = [
  { border: 'border-blue-200',   from: 'from-blue-500',   to: 'to-blue-600',   bg: 'bg-blue-50',   icon: 'text-blue-600',   text: 'text-blue-800' },
  { border: 'border-emerald-200',from: 'from-emerald-500',to: 'to-emerald-600',bg: 'bg-emerald-50',icon: 'text-emerald-600',text: 'text-emerald-800' },
  { border: 'border-amber-200',  from: 'from-amber-500',  to: 'to-amber-600',  bg: 'bg-amber-50',  icon: 'text-amber-600',  text: 'text-amber-800' },
  { border: 'border-rose-200',   from: 'from-rose-500',   to: 'to-rose-600',   bg: 'bg-rose-50',   icon: 'text-rose-600',   text: 'text-rose-800' },
  { border: 'border-cyan-200',   from: 'from-cyan-500',   to: 'to-cyan-600',   bg: 'bg-cyan-50',   icon: 'text-cyan-600',   text: 'text-cyan-800' },
];

function getColor(name: string, idx: number) {
  return DEPT_COLOR_MAP[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

export default function DocumentsDashboard({
  departmentStats,
  totalDocuments,
  departments,
  auditSchedules,
  workPapers,
}: DocumentsDashboardProps) {
  const totalPersonas = departmentStats.reduce((sum, dept) => sum + dept.personaCount, 0);

  const weatherDept = departmentStats.find(d => d.departmentName === 'Weather Impact & Resilience');
  const otherDepts = departmentStats
    .filter(d => d.departmentName !== 'Weather Impact & Resilience')
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName));
  const orderedStats = [...(weatherDept ? [weatherDept] : []), ...otherDepts];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-1.5 rounded-lg">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Airport Operations Document Library</h2>
          <p className="text-xs text-slate-500">Real-time statistics across all operations tabs</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <FileText className="w-4 h-4 opacity-80" />
            <span className="text-2xl font-bold">{totalDocuments}</span>
          </div>
          <p className="text-xs font-semibold opacity-90 mt-1">Total Documents in Airport AI</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-3 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <Bot className="w-4 h-4 opacity-80" />
            <span className="text-2xl font-bold">{totalPersonas}</span>
          </div>
          <p className="text-xs font-semibold opacity-90 mt-1">Total Aviation Personas</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          Operations Unit Statistics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
          {/* USA # of Airports by State (work-papers tab) */}
          <div className="border border-teal-200 rounded-lg p-2.5 bg-teal-50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-1.5 rounded">
                <FileStack className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-xs font-bold text-teal-800 leading-tight">USA # of Airports by State</h3>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                <p className="text-base font-bold text-slate-800">{workPapers.length}</p>
                <p className="text-xs text-slate-500">Reports</p>
              </div>
              <div className="bg-white rounded p-1.5 border border-slate-200 text-center flex flex-col items-center justify-center">
                <Upload className="w-3.5 h-3.5 text-teal-500 mx-auto mb-0.5" />
                <p className="text-xs text-slate-500">Upload</p>
              </div>
            </div>
          </div>

          {/* Flight Schedules tab */}
          <div className="border border-sky-200 rounded-lg p-2.5 bg-sky-50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 p-1.5 rounded">
                <ClipboardList className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-xs font-bold text-sky-800 leading-tight">Flight Schedules Analysis</h3>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                <p className="text-base font-bold text-slate-800">{auditSchedules.length}</p>
                <p className="text-xs text-slate-500">Schedules</p>
              </div>
              <div className="bg-white rounded p-1.5 border border-slate-200 text-center flex flex-col items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-sky-500 mx-auto mb-0.5" />
                <p className="text-xs text-slate-500">
                  {auditSchedules.length > 0
                    ? `${new Set(auditSchedules.map(s => s.year)).size} yr${new Set(auditSchedules.map(s => s.year)).size !== 1 ? 's' : ''}`
                    : 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* One card per department, ordered to match tabs */}
          {orderedStats.map((dept, idx) => {
            const color = getColor(dept.departmentName, idx);
            return (
              <div key={dept.departmentId} className={`border ${color.border} rounded-lg p-2.5 ${color.bg} hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`bg-gradient-to-br ${color.from} ${color.to} p-1.5 rounded`}>
                    <Folder className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className={`text-xs font-bold ${color.text} leading-tight line-clamp-2`}>{dept.departmentName}</h3>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                    <p className="text-base font-bold text-slate-800">{dept.documentCount}</p>
                    <p className="text-xs text-slate-500">Docs</p>
                  </div>
                  <div className="bg-white rounded p-1.5 border border-slate-200 text-center">
                    <p className="text-base font-bold text-slate-800">{dept.personaCount}</p>
                    <p className="text-xs text-slate-500">Personas</p>
                  </div>
                  <div className="bg-white rounded p-1.5 border border-slate-200 text-center flex flex-col items-center justify-center">
                    <Users className="w-3 h-3 text-slate-400 mx-auto mb-0.5" />
                    <p className="text-xs text-slate-500">{dept.lastUpdated ? 'Active' : 'Empty'}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {departmentStats.length === 0 && (
            <div className="col-span-full text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No operations units created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
