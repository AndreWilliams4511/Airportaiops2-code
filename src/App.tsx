import { useState, useEffect } from 'react';
import { Upload, Send, FileText, Clock, AlertCircle, FolderOpen, ChevronDown, ChevronUp, MessageSquare, Folder, Settings, Trash2, ThumbsUp, ThumbsDown, BarChart3, Plus, ShieldCheck, ShieldAlert, ClipboardList, FileStack, Shield, AlertTriangle, Activity } from 'lucide-react';
import {
  uploadDocument,
  uploadDocumentVersion,
  saveEmbedding,
  savePromptResponse,
  checkDuplicatePrompt,
  searchEmbeddings,
  getPromptHistory,
  getAllDocuments,
  checkDuplicateFilename,
  getAllPersonas,
  getLatestVersionNumber,
  deleteDocument,
  deleteAllPromptHistory,
  deleteAllDocuments,
  getDocumentCountsByPersona,
  getAllDepartments,
  getPersonasByDepartment,
  getDepartmentStatistics,
  updatePromptFeedback,
  updatePromptBiasAnalysis,
  updatePromptChunkingScores,
  getFeedbackCounts,
  uploadAuditSchedule,
  getAllAuditSchedules,
  deleteAuditSchedule,
  uploadWorkPaper,
  getAllWorkPapers,
  deleteWorkPaper,
  type Document,
  type PromptResponse,
  type DocumentCountByPersona,
  type Department,
  type Persona,
  type DepartmentStats,
  type ChunkingStrategyScore,
  type AuditSchedule,
  type WorkPaper,
} from './lib/supabase';
import { extractTextFromFile, createChunks } from './lib/documentProcessor';
import {
  generateEmbedding,
  getLLMResponse,
  formatAccuracy,
  getAccuracyColor,
  setDynamicRoles,
  validateOpenAIKey,
  getAPIKeyStatus,
  analyzeBiasAndHallucination,
  isExactMatchScore,
  EXACT_MATCH_THRESHOLD,
  type PersonaRole,
  type BiasHallucinationAnalysis
} from './lib/embeddings';
import DocumentsList from './components/DocumentsList';
import DocumentManagement from './components/DocumentManagement';
import DocumentViewer from './components/DocumentViewer';
import ScanningPopup, { type MatchedChunk } from './components/ScanningPopup';
import ResultsPanel from './components/ResultsPanel';
import DocumentsDashboard from './components/DocumentsDashboard';
import ResultsPopup from './components/ResultsPopup';
import MetricsDashboard from './components/MetricsDashboard';
import AddDepartment from './components/AddDepartment';
import PIIWarningPopup from './components/PIIWarningPopup';
import { detectPII, type PIIDetectionResult } from './lib/piiDetection';
import ChunkingStrategySelector from './components/ChunkingStrategySelector';
import UploadStatusModal, { type UploadFileStatus } from './components/UploadStatusModal';

interface ChunkingStrategyResult {
  strategy: string;
  strategyNumber: string;
  accuracy: number;
  response: string;
  loading: boolean;
  error: string | null;
  context: string;
}

function App() {
  const getInitialChunkingResults = (): ChunkingStrategyResult[] => {
    return [
      { strategy: 'Fixed-Size Chunking', strategyNumber: '1', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Sentence-Based Chunking', strategyNumber: '2', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Paragraph-Based Chunking', strategyNumber: '3', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Semantic Chunking', strategyNumber: '4', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Recursive Chunking', strategyNumber: '5', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Structure-Aware Chunking', strategyNumber: '6', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Token-Based Chunking', strategyNumber: '7', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Sliding Window', strategyNumber: '8', accuracy: 0, response: '', loading: false, error: null, context: '' },
      { strategy: 'Hybrid Approaches', strategyNumber: '9', accuracy: 0, response: '', loading: false, error: null, context: '' },
    ];
  };

  const getDepartmentColor = (deptName: string): string => {
    if (deptName === 'Passenger Flow & Terminal') return '#0ea5e9';
    if (deptName === 'Flight Delay & Disruption') return '#f97316';
    if (deptName === 'Baggage Flow & Tracking') return '#10b981';
    if (deptName === 'Airside Operations') return '#3b82f6';
    if (deptName === 'Staff Scheduling & Workforce') return '#8b5cf6';
    if (deptName === 'Gate & Slot Revenue') return '#f59e0b';
    if (deptName === 'Safety & Security AI') return '#ef4444';
    if (deptName === 'Weather Impact & Resilience') return '#06b6d4';
    if (deptName === 'Airport Capacity Planning') return '#6366f1';
    if (deptName === 'Retail & Concessions Revenue') return '#ec4899';
    return '#64748b';
  };

  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDepartmentTab, setActiveDepartmentTab] = useState<string>('chat');
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [personas, setPersonas] = useState<PersonaRole[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<PromptResponse[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [uploadingByDepartment, setUploadingByDepartment] = useState<Record<string, boolean>>({});
  const [uploadModal, setUploadModal] = useState<{ isOpen: boolean; files: UploadFileStatus[]; isComplete: boolean }>({
    isOpen: false,
    files: [],
    isComplete: false,
  });
  const [showDocumentsList, setShowDocumentsList] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [deletedDocumentsCount, setDeletedDocumentsCount] = useState(0);
  const [totalUploadedCount, setTotalUploadedCount] = useState(0);
  const [showScanningPopup, setShowScanningPopup] = useState(false);
  const [matchedChunks, setMatchedChunks] = useState<MatchedChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocumentToView, setSelectedDocumentToView] = useState<any>(null);
  const [departmentDocuments, setDepartmentDocuments] = useState<Record<string, Document[]>>({});
  const [documentCounts, setDocumentCounts] = useState<DocumentCountByPersona[]>([]);
  const [totalDocumentCount, setTotalDocumentCount] = useState(0);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [feedbackCounts, setFeedbackCounts] = useState({ thumbsUp: 0, thumbsDown: 0 });
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [hasSeenResults, setHasSeenResults] = useState(false);
  const [chunkingStrategy, setChunkingStrategy] = useState('1');
  const [selectedChunkingStrategy, setSelectedChunkingStrategy] = useState<{
    strategy: string;
    strategyNumber: string;
  } | null>(null);
  const [apiKeyValidation, setApiKeyValidation] = useState<{ valid: boolean; error?: string; checked: boolean }>({
    valid: false,
    checked: false,
  });
  const [triggerBiasAnalysis, setTriggerBiasAnalysis] = useState(false);
  const [currentExactMatch, setCurrentExactMatch] = useState(false);
  const [triggerMetricsRefresh, setTriggerMetricsRefresh] = useState(false);
  const [currentBiasAnalysis, setCurrentBiasAnalysis] = useState<BiasHallucinationAnalysis | null>(null);
  const [savedContext, setSavedContext] = useState<string>('');
  const [showPIIWarning, setShowPIIWarning] = useState(false);
  const [isAnalyzingBias, setIsAnalyzingBias] = useState(false);
  const [currentPIIResult, setCurrentPIIResult] = useState<PIIDetectionResult | null>(null);
  const [pendingPromptSubmission, setPendingPromptSubmission] = useState(false);
  const [currentBiasScore, setCurrentBiasScore] = useState<number | undefined>(undefined);
  const [currentDriftScore, setCurrentDriftScore] = useState<number | undefined>(undefined);
  const [currentHallucinationScore, setCurrentHallucinationScore] = useState<number | undefined>(undefined);
  const [auditSchedules, setAuditSchedules] = useState<AuditSchedule[]>([]);
  const [uploadingAuditSchedule, setUploadingAuditSchedule] = useState(false);
  const [workPapers, setWorkPapers] = useState<WorkPaper[]>([]);
  const [uploadingWorkPaper, setUploadingWorkPaper] = useState(false);
  const [tabOrder, setTabOrder] = useState<string[]>([
    'chat',
    'metrics',
    'add-department',
    'audit-schedules',
    'work-papers'
  ]);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [chunkingResults, setChunkingResults] = useState<ChunkingStrategyResult[]>(getInitialChunkingResults());
  const [selectedStrategyForView, setSelectedStrategyForView] = useState<string | null>(null);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string>('');

  useEffect(() => {
    loadHistory();
    loadDepartments();
    loadDocumentCounts();
    loadDepartmentStats();
    loadAllPersonas();
    loadFeedbackCounts();
    loadAuditSchedules();
    loadWorkPapers();
    setSelectedRole('All Documents');
    checkAPIKey();
    loadTabOrder();
  }, []);

  function loadTabOrder() {
    const savedOrder = localStorage.getItem('tabOrder');
    if (savedOrder) {
      try {
        setTabOrder(JSON.parse(savedOrder));
      } catch (error) {
        console.error('Error loading tab order:', error);
      }
    }
  }

  function saveTabOrder(newOrder: string[]) {
    setTabOrder(newOrder);
    localStorage.setItem('tabOrder', JSON.stringify(newOrder));
  }

  function handleDragStart(tabId: string) {
    setDraggedTab(tabId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetTabId: string) {
    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null);
      return;
    }

    const newOrder = [...tabOrder];
    const draggedIndex = newOrder.indexOf(draggedTab);
    const targetIndex = newOrder.indexOf(targetTabId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTab);

    saveTabOrder(newOrder);
    setDraggedTab(null);
  }

  async function checkAPIKey() {
    const status = getAPIKeyStatus();
    if (status === 'missing') {
      setApiKeyValidation({ valid: false, error: 'OpenAI API key is missing', checked: true });
      return;
    }

    const result = await validateOpenAIKey();
    setApiKeyValidation({ ...result, checked: true });
  }

  useEffect(() => {
    if (departments.length > 0) {
      loadDocuments();
    }
  }, [departments]);

  useEffect(() => {
    if (pendingPromptSubmission) {
      handleSubmitPrompt();
    }
  }, [pendingPromptSubmission]);

  async function loadDepartments() {
    const depts = await getAllDepartments();
    setDepartments(depts);
  }

  async function loadAllPersonas() {
    const allPersonasList = await getAllPersonas();
    setAllPersonas(allPersonasList);

    if (allPersonasList.length > 0) {
      const personaRoles = allPersonasList.map(p => ({ name: p.name, prompt: p.prompt }));
      setPersonas(personaRoles);
      setDynamicRoles(personaRoles);
    }
  }

  async function handleDepartmentChange(departmentId: string) {
    setSelectedDepartmentId(departmentId);
    setSelectedRole('');

    if (departmentId === '') {
      const personaRoles = allPersonas.map(p => ({ name: p.name, prompt: p.prompt }));
      setPersonas(personaRoles);
      setDynamicRoles(personaRoles);
      setSelectedRole('All Documents');
    } else {
      const filteredPersonas = await getPersonasByDepartment(departmentId);
      const personaRoles = filteredPersonas.map(p => ({ name: p.name, prompt: p.prompt }));
      setPersonas(personaRoles);
      setDynamicRoles(personaRoles);
    }
  }

  async function loadDocuments() {
    const docs = await getAllDocuments();
    setDocuments(docs);

    const deptDocs: Record<string, Document[]> = {};
    for (const dept of departments) {
      const docs = await getAllDocuments(null, dept.id);
      deptDocs[dept.name] = docs;
    }
    setDepartmentDocuments(deptDocs);
  }

  async function loadDocumentCounts() {
    const { counts, total } = await getDocumentCountsByPersona();
    setDocumentCounts(counts);
    setTotalDocumentCount(total);
  }

  async function loadDepartmentStats() {
    const stats = await getDepartmentStatistics();
    setDepartmentStats(stats);
    const total = stats.reduce((sum, dept) => sum + dept.documentCount, 0);
    setTotalDocumentCount(total);
  }

  async function handleDocumentDeleted() {
    setDeletedDocumentsCount((prev) => prev + 1);
    await loadDocuments();
    await loadDocumentCounts();
    await loadDepartmentStats();
  }

  async function loadHistory() {
    const hist = await getPromptHistory();
    setHistory(hist);
  }

  async function loadFeedbackCounts() {
    const counts = await getFeedbackCounts();
    setFeedbackCounts(counts);
  }

  async function loadAuditSchedules() {
    const schedules = await getAllAuditSchedules();
    setAuditSchedules(schedules);
  }

  function getFileType(file: File): string {
    if (file.type) return file.type;
    const ext = file.name.toLowerCase().split('.').pop();
    const mimeMap: Record<string, string> = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pdf: 'application/pdf',
      txt: 'text/plain',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
    };
    return mimeMap[ext || ''] || 'application/octet-stream';
  }

  async function handleAuditScheduleUpload(e: React.ChangeEvent<HTMLInputElement>, year: number) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAuditSchedule(true);

    try {
      for (const file of Array.from(files)) {
        const fileContent = await extractTextFromFile(file);

        const result = await uploadAuditSchedule(
          year,
          file.name,
          getFileType(file),
          file.size,
          fileContent || undefined
        );

      }

      await loadAuditSchedules();
      alert('Audit schedule(s) uploaded successfully!');
    } catch (error) {
      console.error('Error uploading audit schedule:', error);
      alert('Failed to upload audit schedule. Please try again.');
    } finally {
      setUploadingAuditSchedule(false);
      e.target.value = '';
    }
  }

  async function handleDeleteAuditSchedule(id: string) {
    const confirmed = confirm('Are you sure you want to delete this audit schedule?');
    if (!confirmed) return;

    const success = await deleteAuditSchedule(id);
    if (success) {
      await loadAuditSchedules();
      alert('Audit schedule deleted successfully.');
    } else {
      alert('Failed to delete audit schedule. Please try again.');
    }
  }

  async function loadWorkPapers() {
    const papers = await getAllWorkPapers();
    setWorkPapers(papers);
  }

  async function handleWorkPaperUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!apiKeyValidation.checked || !apiKeyValidation.valid) {
      alert(
        'Cannot upload documents: OpenAI API connection is not available.\n\n' +
        (apiKeyValidation.error || 'Please ensure the OPENAI_API_KEY secret is configured.')
      );
      e.target.value = '';
      return;
    }

    setUploadingWorkPaper(true);

    const fileArray = Array.from(files);
    e.target.value = '';

    const airportCapacityDept = departments.find(d => d.name === 'Airport Capacity Planning');
    const departmentId = airportCapacityDept?.id || null;

    const initialFiles: UploadFileStatus[] = fileArray.map(f => ({
      filename: f.name,
      sizeBytes: f.size,
      status: 'uploading',
    }));
    setUploadModal({ isOpen: true, files: initialFiles, isComplete: false });

    let uploadedCount = 0;

    try {
      for (let fi = 0; fi < fileArray.length; fi++) {
        const file = fileArray[fi];
        let savedDocId: string | null = null;
        try {
          const text = await extractTextFromFile(file);

          if (!text || text.trim().length === 0) {
            throw new Error('No readable text could be extracted from this file.');
          }

          const chunks = createChunks(text, chunkingStrategy);
          const fileType = getFileType(file);

          await uploadWorkPaper(
            file.name,
            fileType,
            file.size,
            text,
            departmentId
          );

          const existingDoc = await checkDuplicateFilename(file.name);
          let doc: Document;

          if (existingDoc) {
            const latestVersion = await getLatestVersionNumber(file.name);
            doc = await uploadDocumentVersion(
              file.name,
              `/uploads/${file.name}`,
              fileType,
              existingDoc.id,
              latestVersion + 1,
              text,
              null,
              departmentId
            );
          } else {
            doc = await uploadDocument(file.name, `/uploads/${file.name}`, fileType, text, null, departmentId);
          }

          savedDocId = doc.id;
          uploadedCount++;

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk.text);
            await saveEmbedding(doc.id, chunk.text, embedding, i, chunk.level);
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          setUploadModal(prev => ({
            ...prev,
            files: prev.files.map((f, idx) => idx === fi ? { ...f, status: 'success' } : f),
          }));
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          if (savedDocId) {
            uploadedCount--;
            await deleteDocument(savedDocId).catch(() => {});
          }
          setUploadModal(prev => ({
            ...prev,
            files: prev.files.map((f, idx) => idx === fi ? { ...f, status: 'error', errorMessage: fileError.message } : f),
          }));
        }
      }

      await loadWorkPapers();
      await loadDocuments();
      await loadDocumentCounts();
      await loadDepartmentStats();
      setTotalUploadedCount(prev => prev + uploadedCount);

      setUploadModal(prev => ({ ...prev, isComplete: true }));
    } catch (error) {
      console.error('Error uploading work paper:', error);
      setUploadModal(prev => ({
        ...prev,
        files: prev.files.map(f => f.status === 'uploading' ? { ...f, status: 'error', errorMessage: 'Unexpected error. Please try again.' } : f),
        isComplete: true,
      }));
    } finally {
      setUploadingWorkPaper(false);
    }
  }

  async function handleDeleteWorkPaper(id: string) {
    const confirmed = confirm('Are you sure you want to delete this work paper?');
    if (!confirmed) return;

    const success = await deleteWorkPaper(id);
    if (success) {
      await loadWorkPapers();
      alert('Work paper deleted successfully.');
    } else {
      alert('Failed to delete work paper. Please try again.');
    }
  }

  async function handleFeedback(feedback: 'up' | 'down') {
    if (!currentPromptId) return;

    const success = await updatePromptFeedback(currentPromptId, feedback);
    if (success) {
      await loadHistory();
      await loadFeedbackCounts();
    }
  }

  async function handleClearHistory() {
    const confirmed = confirm('Are you sure you want to delete all prompt history? This action cannot be undone.');
    if (!confirmed) return;

    const success = await deleteAllPromptHistory();
    if (success) {
      setHistory([]);
      setCurrentResult(null);
      setChunkingResults(getInitialChunkingResults());
      alert('All prompt history has been cleared successfully.');
    } else {
      alert('Failed to clear prompt history. Please try again.');
    }
  }

  function handleViewDocument(doc: any) {
    setSelectedDocumentToView(doc);
    setShowDocumentViewer(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, departmentName: string) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!apiKeyValidation.checked || !apiKeyValidation.valid) {
      alert(
        'Cannot upload documents: OpenAI API connection is not available.\n\n' +
        (apiKeyValidation.error || 'Please ensure the OPENAI_API_KEY secret is configured in the Supabase Edge Function settings.')
      );
      e.target.value = '';
      return;
    }

    if (!departmentName) {
      alert('Please select a department tab before uploading documents.');
      return;
    }

    const fileArray = Array.from(files);
    e.target.value = '';

    const duplicates: { file: File; existingDoc: Document }[] = [];
    const filesToUpload: File[] = [];

    for (const file of fileArray) {
      const existingDoc = await checkDuplicateFilename(file.name);
      if (existingDoc) {
        duplicates.push({ file, existingDoc });
      } else {
        filesToUpload.push(file);
      }
    }

    if (duplicates.length > 0) {
      const response = confirm(
        `The following file(s) already exist:\n${duplicates.map(d => d.file.name).join('\n')}\n\n` +
        `Would you like to create new versions of these files?\n\n` +
        `Click OK to create new versions, or Cancel to skip these files.`
      );

      if (response) {
        for (const { file } of duplicates) {
          filesToUpload.push(file);
        }
      }
    }

    if (filesToUpload.length === 0) {
      return;
    }

    setUploadingByDepartment(prev => ({ ...prev, [departmentName]: true }));

    const initialFiles: UploadFileStatus[] = filesToUpload.map(f => ({
      filename: f.name,
      sizeBytes: f.size,
      status: 'uploading',
    }));
    setUploadModal({ isOpen: true, files: initialFiles, isComplete: false });

    try {
      const department = departments.find(d => d.name === departmentName);
      if (!department) {
        setUploadModal(prev => ({
          ...prev,
          files: prev.files.map(f => ({ ...f, status: 'error', errorMessage: 'Department not found.' })),
          isComplete: true,
        }));
        setUploadingByDepartment(prev => ({ ...prev, [departmentName]: false }));
        return;
      }
      const departmentId = department.id;

      let uploadedCount = 0;

      for (let fi = 0; fi < filesToUpload.length; fi++) {
        const file = filesToUpload[fi];
        let savedDocId: string | null = null;
        try {
          const text = await extractTextFromFile(file);

          if (!text || text.trim().length === 0) {
            throw new Error('No readable text could be extracted from this file.');
          }

          const chunks = createChunks(text, chunkingStrategy);
          const fileType = getFileType(file);

          const existingDoc = await checkDuplicateFilename(file.name);
          let doc: Document;

          if (existingDoc) {
            const latestVersion = await getLatestVersionNumber(file.name);
            doc = await uploadDocumentVersion(
              file.name,
              `/uploads/${file.name}`,
              fileType,
              existingDoc.id,
              latestVersion + 1,
              text,
              null,
              departmentId
            );
          } else {
            doc = await uploadDocument(file.name, `/uploads/${file.name}`, fileType, text, null, departmentId);
          }

          savedDocId = doc.id;
          uploadedCount++;

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk.text);
            await saveEmbedding(doc.id, chunk.text, embedding, i, chunk.level);

            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          setUploadModal(prev => ({
            ...prev,
            files: prev.files.map((f, idx) => idx === fi ? { ...f, status: 'success' } : f),
          }));
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          if (savedDocId) {
            uploadedCount--;
            await deleteDocument(savedDocId).catch(() => {});
          }
          setUploadModal(prev => ({
            ...prev,
            files: prev.files.map((f, idx) => idx === fi ? { ...f, status: 'error', errorMessage: fileError.message } : f),
          }));
        }
      }

      await loadDocuments();
      await loadDocumentCounts();
      await loadDepartmentStats();
      setTotalUploadedCount((prev) => prev + uploadedCount);

      setUploadModal(prev => ({ ...prev, isComplete: true }));
    } catch (error) {
      console.error('Error processing documents:', error);
      setUploadModal(prev => ({
        ...prev,
        files: prev.files.map(f => f.status === 'uploading' ? { ...f, status: 'error', errorMessage: 'Unexpected error. Please try again.' } : f),
        isComplete: true,
      }));
    } finally {
      setUploadingByDepartment(prev => ({ ...prev, [departmentName]: false }));
    }
  }

  async function handleSubmitPrompt() {
    if (!prompt.trim()) return;

    if (!apiKeyValidation.checked || !apiKeyValidation.valid) {
      alert(
        'Cannot process prompts: OpenAI API connection is not available.\n\n' +
        (apiKeyValidation.error || 'Please ensure the OPENAI_API_KEY secret is configured in the Supabase Edge Function settings.')
      );
      return;
    }

    if (personas.length === 0) {
      alert('Please go to the Document Management tab and upload your documents first.');
      return;
    }

    if (!selectedRole) {
      alert('Please select a persona role from the dropdown menu before submitting your prompt.');
      return;
    }

    const piiResult = detectPII(prompt);

    if (piiResult.detected && !pendingPromptSubmission) {
      setCurrentPIIResult(piiResult);
      setShowPIIWarning(true);
      return;
    }

    setPendingPromptSubmission(false);

    setProcessing(true);
    setCurrentResult(null);

    try {
      await loadDocuments();

      const duplicate = await checkDuplicatePrompt(prompt);

      if (duplicate) {
        setCurrentResult({
          response: duplicate.response,
          accuracy: 0.85,
          topDocs: duplicate.top_documents,
          accuracyScores: duplicate.accuracy_scores,
        });
        setProcessing(false);
        return;
      }

      setLastSubmittedPrompt(prompt);
      await processNewPrompt(piiResult, prompt);
    } catch (error) {
      console.error('Error processing prompt:', error);
      alert('Error processing prompt. Please check your API key.');
    } finally {
      setProcessing(false);
    }
  }

  async function processNewPrompt(piiResult: PIIDetectionResult, promptOverride?: string) {
    const promptText = promptOverride ?? prompt;
    setProcessing(true);
    setShowScanningPopup(true);
    setIsSearching(true);
    setMatchedChunks([]);

    // Reset all chunking results to loading state
    const loadingResults = getInitialChunkingResults().map(r => ({ ...r, loading: true }));
    setChunkingResults(loadingResults);

    try {
      const queryEmbedding = await generateEmbedding(promptText);

      let departmentIdToUse = selectedDepartmentId;

      if (!departmentIdToUse && selectedRole && selectedRole !== 'All Documents') {
        const persona = allPersonas.find(p => p.name === selectedRole);
        if (persona) {
          departmentIdToUse = persona.department_id;
        }
      }

      if (selectedRole === 'All Documents') {
        departmentIdToUse = '';
      }

      const allDocs = departmentIdToUse
        ? await getAllDocuments(null, departmentIdToUse)
        : await getAllDocuments();

      if (allDocs.length === 0) {
        alert('No documents found. Please upload documents first.');
        setProcessing(false);
        setIsSearching(false);
        setShowScanningPopup(false);
        setChunkingResults(getInitialChunkingResults());
        return;
      }

      const documentIds: string[] | null = null;



      const strategyNames = [
        'Fixed-Size Chunking',
        'Sentence-Based Chunking',
        'Paragraph-Based Chunking',
        'Semantic Chunking',
        'Recursive Chunking',
        'Structure-Aware Chunking',
        'Token-Based Chunking',
        'Sliding Window',
        'Hybrid Approaches'
      ];

      const strategyPromises = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(async (strategyNum, index) => {
        try {
          const strategyName = strategyNames[index];
          const result = await processStrategyInRealTime(strategyNum, promptText, departmentIdToUse);
          return {
            strategyNumber: strategyNum,
            strategyName,
            duration: 0,
            ...result,
          };
        } catch (error) {
          return {
            strategyNumber: strategyNum,
            strategyName: strategyNames[index],
            duration: 0,
            accuracy: 0,
            response: '',
            error: 'Processing failed',
            context: '',
          };
        }
      });

      const strategyResults = await Promise.all(strategyPromises);

      // Update chunking results as they complete
      const updatedResults = getInitialChunkingResults().map((initial, index) => {
        const result = strategyResults.find(r => r.strategyNumber === initial.strategyNumber);
        if (result) {
          return {
            ...initial,
            accuracy: result.accuracy,
            response: result.response,
            loading: false,
            error: result.error,
            context: result.context,
          };
        }
        return { ...initial, loading: false };
      });

      setChunkingResults(updatedResults);

      // Set the active strategy as the initially selected one for viewing
      setSelectedStrategyForView(chunkingStrategy);

      // Use the current active strategy result for display
      const activeStrategyResult = strategyResults.find(r => r.strategyNumber === chunkingStrategy);

      if (activeStrategyResult && activeStrategyResult.accuracy > 0) {
        const departmentIds = departmentIdToUse ? [departmentIdToUse] : undefined;
        const topDocs = await searchEmbeddings(queryEmbedding, 3, documentIds, departmentIds);

        if (!topDocs || topDocs.length === 0) {
          alert('No relevant documents found. Please upload documents that relate to your question.');
          setProcessing(false);
          setIsSearching(false);
          setShowScanningPopup(false);
          return;
        }

        const chunks: MatchedChunk[] = topDocs.map(doc => ({
          documentId: doc.document_id,
          documentName: doc.filename,
          text: doc.chunk_text,
          similarity: doc.similarity,
        }));

        setMatchedChunks(chunks);
        setIsSearching(false);

        const topDocInfo = topDocs.map((doc, idx) => ({
          index: idx,
          similarity: doc.similarity,
          text: doc.chunk_text,
          filename: doc.filename,
          file_type: doc.file_type,
          document_id: doc.document_id,
        }));

        setSavedContext(activeStrategyResult.context);

        const accuracyScores = topDocs.map((doc) => doc.similarity);

        const savedResponse = await savePromptResponse(
          promptText,
          activeStrategyResult.response,
          selectedRole,
          topDocInfo,
          accuracyScores,
          false,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          piiResult.detected,
          piiResult.types,
          piiResult.details,
          chunkingStrategy
        );

        if (savedResponse) {
          setCurrentPromptId(savedResponse.id);
        }

        const activeStrategy = chunkingResults.find(r => r.strategyNumber === chunkingStrategy);

        const result = {
          response: activeStrategyResult.response,
          accuracy: activeStrategyResult.accuracy,
          topDocs: topDocInfo,
          accuracyScores,
          promptId: savedResponse?.id,
          feedback: null,
          chunkingStrategy: activeStrategy?.strategy || 'Fixed-Size Chunking',
          chunkingStrategyNumber: chunkingStrategy,
        };

        setCurrentResult(result);
        setShowResultsPopup(true);

        await loadHistory();
        setTriggerMetricsRefresh(true);
        setIsAnalyzingBias(true);
        const isExactResult = activeStrategyResult.exactMatch || isExactMatchScore(accuracyScores);
        setCurrentExactMatch(isExactResult);
        setTriggerBiasAnalysis(true);

        // Calculate initial metrics
        if (activeStrategyResult.accuracy > 0) {
          const isExact = isExactResult;
          const initialBias = isExact ? 0 : (1 - activeStrategyResult.accuracy) * 0.40;
          const initialDrift = isExact ? 0 : (1 - activeStrategyResult.accuracy) * 0.30;
          const initialHallucination = isExact ? 0 : (1 - activeStrategyResult.accuracy) * 0.30;
          setCurrentBiasScore(initialBias);
          setCurrentDriftScore(initialDrift);
          setCurrentHallucinationScore(initialHallucination);
        }
      }
    } catch (error: any) {
      console.error('Error processing new prompt:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Error processing prompt: ${errorMessage}\n\nPlease check:\n- Your OpenAI API key is valid\n- You have documents uploaded\n- Your internet connection is stable`);
      setChunkingResults(getInitialChunkingResults());
    } finally {
      setProcessing(false);
      setIsSearching(false);
      setShowScanningPopup(false);
    }
  }

  const cosineSimilarity = (a: number[], b: number[]): number => {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitudeA = Math.sqrt(normA);
    const magnitudeB = Math.sqrt(normB);

    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    const similarity = dotProduct / (magnitudeA * magnitudeB);

    // Clamp to valid range [-1, 1] and ensure non-negative
    return Math.max(0, Math.min(1, similarity));
  };

  const calculateConfidenceScore = (similarities: number[]): number => {
    if (similarities.length === 0) {
      return 0.25;
    }

    // Weighted average - give more weight to top matches
    const weights = [0.5, 0.3, 0.2]; // Top chunk gets 50%, second 30%, third 20%
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < Math.min(similarities.length, weights.length); i++) {
      weightedSum += similarities[i] * weights[i];
      totalWeight += weights[i];
    }

    const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;

    if (weightedAvg === 0) {
      return 0.25;
    }

    // Enhanced transformation for better score distribution
    // Cosine similarity typically ranges from 0.1-0.9 for relevant docs
    // We want to map this to 30%-98% confidence range
    const transformedScore = Math.pow(weightedAvg, 0.7) * 1.3;

    // Ensure score is in reasonable range (30% - 98%)
    const finalConfidence = Math.max(0.30, Math.min(0.98, transformedScore));


    return finalConfidence;
  };

  const processStrategyInRealTime = async (
    strategyNumber: string,
    promptText: string,
    departmentId: string
  ): Promise<{ accuracy: number; response: string; error: string | null; context: string; exactMatch?: boolean }> => {
    try {
      const queryEmbedding = await generateEmbedding(promptText);

      if (!queryEmbedding || queryEmbedding.length === 0) {
        return {
          accuracy: 0,
          response: 'Failed to generate query embedding.',
          error: 'Embedding generation failed',
          context: '',
        };
      }

      const docsToProcess = departmentId
        ? await getAllDocuments(null, departmentId)
        : await getAllDocuments();

      if (docsToProcess.length === 0) {
        return {
          accuracy: 0,
          response: 'No documents available for this strategy.',
          error: null,
          context: '',
        };
      }

      const docsWithContent = docsToProcess.filter(d => d.file_content);

      if (docsWithContent.length === 0) {
        return {
          accuracy: 0,
          response: 'No document content available.',
          error: 'No content in documents',
          context: '',
        };
      }

      interface ChunkWithMetadata {
        text: string;
        embedding: number[];
        similarity: number;
        filename: string;
        documentId: string;
      }

      const allChunksWithSimilarity: ChunkWithMetadata[] = [];

      const chunkPromises: Promise<ChunkWithMetadata | null>[] = [];

      for (const doc of docsToProcess) {
        if (!doc.file_content) continue;

        const chunks = createChunks(doc.file_content, strategyNumber);

        for (const chunk of chunks) {
          const chunkPromise = (async () => {
            try {
              const chunkEmbedding = await generateEmbedding(chunk.text);
              const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

              return {
                text: chunk.text,
                embedding: chunkEmbedding,
                similarity,
                filename: doc.filename,
                documentId: doc.id,
              };
            } catch (embError) {
              console.error(`Error processing chunk for ${doc.filename}:`, embError);
              return null;
            }
          })();

          chunkPromises.push(chunkPromise);
        }
      }

      const processedChunks = await Promise.all(chunkPromises);

      for (const chunk of processedChunks) {
        if (chunk !== null) {
          allChunksWithSimilarity.push(chunk);
        }
      }

      if (allChunksWithSimilarity.length === 0) {
        return {
          accuracy: 0,
          response: 'No chunks could be processed for this strategy.',
          error: 'Chunk processing failed',
          context: '',
        };
      }

      allChunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);

      // Filter out very low similarity chunks (below threshold)
      const relevantChunks = allChunksWithSimilarity.filter(c => c.similarity > 0.1);

      if (relevantChunks.length === 0) {
        return {
          accuracy: 0.3,
          response: 'No sufficiently relevant information found in the documents for this query using this chunking strategy.',
          error: null,
          context: '',
        };
      }

      // Remove near-duplicate chunks (chunks that are very similar to each other)
      const uniqueChunks: ChunkWithMetadata[] = [];
      for (const chunk of relevantChunks) {
        const isDuplicate = uniqueChunks.some(existing => {
          const textSimilarity = chunk.text === existing.text ||
            (chunk.text.slice(0, 100) === existing.text.slice(0, 100) && chunk.filename === existing.filename);
          return textSimilarity;
        });

        if (!isDuplicate) {
          uniqueChunks.push(chunk);
        }

        if (uniqueChunks.length >= 5) break;
      }

      const topChunks = uniqueChunks.slice(0, 5);

      // Ensure we have at least some chunks to work with
      if (topChunks.length === 0) {
        return {
          accuracy: 0.25,
          response: 'Unable to generate a confident response with this chunking strategy.',
          error: null,
          context: '',
        };
      }

      const topSimilarities = topChunks.slice(0, 3).map(c => c.similarity);

      let calculatedConfidence = 0;
      if (topSimilarities.length > 0) {
        const weights = [0.5, 0.3, 0.2];
        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < Math.min(topSimilarities.length, weights.length); i++) {
          weightedSum += topSimilarities[i] * weights[i];
          totalWeight += weights[i];
        }

        const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const transformedScore = Math.pow(weightedAvg, 0.7) * 1.3;
        calculatedConfidence = Math.max(0.30, Math.min(0.98, transformedScore));
      } else {
        calculatedConfidence = 0.25;
      }

      // Use top 3 for context
      const contextChunks = topChunks.slice(0, 3);
      const accuracyScores = contextChunks.map(chunk => chunk.similarity);
      const context = contextChunks
        .map((chunk, idx) => `[Document ${idx + 1}: ${chunk.filename}]\n${chunk.text}`)
        .join('\n\n---\n\n');

      const { response, exactMatch } = await getLLMResponse(promptText, selectedRole, context, accuracyScores);

      let finalConfidence: number;
      if (exactMatch) {
        finalConfidence = 1.0;
      } else {
        finalConfidence = calculatedConfidence;
        const lowerResponse = response.toLowerCase();
        if (
          lowerResponse.includes("don't have enough information") ||
          lowerResponse.includes("cannot find") ||
          lowerResponse.includes("not mentioned") ||
          lowerResponse.includes("insufficient information")
        ) {
          finalConfidence = Math.max(0.3, finalConfidence * 0.7);
        }
      }

      return {
        accuracy: finalConfidence,
        response,
        error: null,
        context,
        exactMatch,
      };
    } catch (error: any) {
      console.error(`Error in processStrategyInRealTime for strategy ${strategyNumber}:`, error);
      return {
        accuracy: 0,
        response: '',
        error: error.message || 'Unknown error',
        context: '',
      };
    }
  };

  async function handleSelectStrategy(strategyNumber: string) {
    const strategyResult = chunkingResults.find(r => r.strategyNumber === strategyNumber);

    if (!strategyResult || strategyResult.accuracy === 0) {
      return;
    }

    // Track which strategy is currently being viewed
    setSelectedStrategyForView(strategyNumber);

    // Update current result to show the selected strategy's response
    setCurrentResult({
      response: strategyResult.response,
      accuracy: strategyResult.accuracy,
      topDocs: currentResult?.topDocs || [],
      accuracyScores: currentResult?.accuracyScores || [],
      promptId: currentResult?.promptId,
      feedback: currentResult?.feedback,
      chunkingStrategy: strategyResult.strategy,
      chunkingStrategyNumber: strategyResult.strategyNumber,
    });

    setSavedContext(strategyResult.context);

    // Trigger bias analysis for the new strategy's response
    setTriggerBiasAnalysis(true);
    setIsAnalyzingBias(true);
  }

  async function handleSetActiveStrategy(strategyNumber: string) {
    setChunkingStrategy(strategyNumber);

    // Also select this strategy to view its results
    await handleSelectStrategy(strategyNumber);
  }

  async function handleResubmitLastPrompt() {
    if (!lastSubmittedPrompt.trim()) return;
    if (!apiKeyValidation.checked || !apiKeyValidation.valid) return;
    if (personas.length === 0) return;
    if (!selectedRole) return;

    setPrompt(lastSubmittedPrompt);
    setProcessing(true);
    setCurrentResult(null);
    try {
      await loadDocuments();
      const piiResult = detectPII(lastSubmittedPrompt);
      await processNewPrompt(piiResult, lastSubmittedPrompt);
    } catch (error) {
      console.error('Error resubmitting prompt:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleClearAll() {
    const confirmed = window.confirm(
      'This will clear all chat history, cached results, search data, and ALL documents. This action cannot be undone.\n\nAre you sure you want to continue?'
    );

    if (!confirmed) return;

    try {
      const historySuccess = await deleteAllPromptHistory();
      const documentsSuccess = await deleteAllDocuments();

      if (historySuccess && documentsSuccess) {
        setHistory([]);
        setCurrentResult(null);
        setMatchedChunks([]);
        setShowResultsPopup(false);
        setCurrentPromptId(null);
        setHasSeenResults(false);
        setPrompt('');
        setFeedbackCounts({ thumbsUp: 0, thumbsDown: 0 });
        setDocuments([]);
        setDeletedDocumentsCount(0);
        setTotalUploadedCount(0);
        setChunkingResults(getInitialChunkingResults());
        await loadDocuments();

        alert('All chat history, documents, and results have been cleared successfully!');
      } else {
        alert('Failed to clear all data. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('An error occurred while clearing data. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-4 bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 rounded-lg p-4 border border-blue-200 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-md">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Airport Operations</span>{' '}
              <span className="bg-gradient-to-r from-sky-500 to-cyan-500 bg-clip-text text-transparent">AI Intelligence</span>{' '}
              <span className="text-slate-800">Command Center</span>
            </h1>
          </div>
          <p className="text-xs ml-9">
            <span className="text-slate-700 font-semibold">AI-powered airport operations analysis with</span>{' '}
            <span className="text-blue-700 font-semibold">specialized aviation personas</span>
          </p>
        </header>

        {apiKeyValidation.checked && !apiKeyValidation.valid && (
          <div className="mb-4 bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-900 font-semibold text-sm mb-1">OpenAI API Key Issue</h3>
                <p className="text-red-800 text-sm mb-2">
                  {apiKeyValidation.error || 'Unable to validate OpenAI API key'}
                </p>
                <div className="bg-red-100 border border-red-200 rounded p-3 text-xs">
                  <p className="font-semibold text-red-900 mb-1">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 text-red-800">
                    <li>Ensure the <code className="bg-red-200 px-1 rounded">OPENAI_API_KEY</code> secret is set in your Supabase Edge Function secrets</li>
                    <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-red-900 font-semibold underline hover:text-red-700">platform.openai.com/api-keys</a></li>
                    <li>Check that the <code className="bg-red-200 px-1 rounded">openai-proxy</code> Edge Function is deployed and running</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {apiKeyValidation.checked && apiKeyValidation.valid && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <p className="text-emerald-800 text-xs font-medium">OpenAI API Connected</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex flex-col gap-0">
            {/* Row 1: 4 primary tabs - no scrollbar */}
            <div className="flex gap-0.5 border-b border-slate-200 bg-slate-50 rounded-t-lg px-1 pt-1">
              {(['chat', 'metrics', 'add-department', 'audit-schedules'] as const).map((tabId) => {
                const tabConfig = {
                  'chat': {
                    icon: MessageSquare,
                    label: "Ops Command Center Analysis",
                    activeClasses: 'bg-white border-blue-600 text-blue-700 -mb-px',
                    inactiveClasses: 'bg-slate-100 border-transparent text-blue-600 hover:bg-slate-200'
                  },
                  'metrics': {
                    icon: BarChart3,
                    label: 'Prompt Metrics',
                    activeClasses: 'bg-white border-emerald-600 text-emerald-700 -mb-px',
                    inactiveClasses: 'bg-slate-100 border-transparent text-emerald-600 hover:bg-slate-200'
                  },
                  'add-department': {
                    icon: Plus,
                    label: 'Add Operations Unit',
                    activeClasses: 'bg-white border-orange-600 text-orange-700 -mb-px',
                    inactiveClasses: 'bg-slate-100 border-transparent text-orange-600 hover:bg-slate-200'
                  },
                  'audit-schedules': {
                    icon: ClipboardList,
                    label: 'Flight Schedules Analysis',
                    activeClasses: 'bg-white border-sky-600 text-sky-700 -mb-px',
                    inactiveClasses: 'bg-slate-100 border-transparent text-sky-600 hover:bg-slate-200'
                  },
                }[tabId];

                const Icon = tabConfig.icon;
                const isActive = activeDepartmentTab === tabId;
                const isDragging = draggedTab === tabId;

                return (
                  <button
                    key={tabId}
                    draggable
                    onDragStart={() => handleDragStart(tabId)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(tabId)}
                    onClick={() => setActiveDepartmentTab(tabId)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 rounded-t-md border-t-2 border-x cursor-move min-h-[3rem] ${
                      isActive ? tabConfig.activeClasses : tabConfig.inactiveClasses
                    } ${isDragging ? 'opacity-50' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-semibold text-center leading-tight">{tabConfig.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 2: work-papers + first 3 department tabs (Weather Impact first) */}
            <div className="flex gap-0.5 border-b border-slate-200 bg-slate-100 px-1 pt-1">
              {(() => {
                const weatherDept = departments.find(d => d.name === 'Weather Impact & Resilience');
                const otherDepts = departments
                  .filter(d => d.name !== 'Weather Impact & Resilience')
                  .sort((a, b) => a.name.localeCompare(b.name));
                const row2Depts = [
                  ...(weatherDept ? [weatherDept] : []),
                  ...otherDepts
                ].slice(0, 3);

                return (
                  <>
                    <button
                      draggable
                      onDragStart={() => handleDragStart('work-papers')}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('work-papers')}
                      onClick={() => setActiveDepartmentTab('work-papers')}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 rounded-t-md border-t-2 border-x cursor-move min-h-[3rem] ${
                        activeDepartmentTab === 'work-papers'
                          ? 'bg-white border-teal-600 text-teal-700 -mb-px'
                          : 'bg-slate-200 border-transparent text-teal-600 hover:bg-slate-300'
                      } ${draggedTab === 'work-papers' ? 'opacity-50' : ''}`}
                    >
                      <FileStack className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-semibold text-center leading-tight">USA # of Airports by State</span>
                    </button>
                    {row2Depts.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => setActiveDepartmentTab(dept.name)}
                        className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 rounded-t-md border-t-2 border-x min-h-[3rem] ${
                          activeDepartmentTab === dept.name
                            ? 'bg-white -mb-px shadow-sm'
                            : 'bg-slate-200 border-transparent hover:bg-slate-300'
                        }`}
                        style={{
                          borderTopColor: activeDepartmentTab === dept.name ? getDepartmentColor(dept.name) : 'transparent',
                          color: getDepartmentColor(dept.name)
                        }}
                      >
                        <Folder className="w-3 h-3 flex-shrink-0" />
                        <span className="font-semibold text-center leading-tight">{dept.name} Analysis</span>
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>

            {/* Row 3: next batch of department tabs */}
            {departments.length > 3 && (
              <div className="flex gap-0.5 border-b border-slate-200 bg-slate-200 px-1 pt-1">
                {(() => {
                  const weatherDept = departments.find(d => d.name === 'Weather Impact & Resilience');
                  const otherDepts = departments
                    .filter(d => d.name !== 'Weather Impact & Resilience')
                    .sort((a, b) => a.name.localeCompare(b.name));
                  const allOrdered = [
                    ...(weatherDept ? [weatherDept] : []),
                    ...otherDepts
                  ];
                  const row3Depts = allOrdered.slice(3, 7);

                  return row3Depts.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setActiveDepartmentTab(dept.name)}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 rounded-t-md border-t-2 border-x min-h-[3rem] ${
                        activeDepartmentTab === dept.name
                          ? 'bg-white -mb-px shadow-sm'
                          : 'bg-slate-300 border-transparent hover:bg-slate-400/60'
                      }`}
                      style={{
                        borderTopColor: activeDepartmentTab === dept.name ? getDepartmentColor(dept.name) : 'transparent',
                        color: getDepartmentColor(dept.name)
                      }}
                    >
                      <Folder className="w-3 h-3 flex-shrink-0" />
                      <span className="font-semibold text-center leading-tight">{dept.name} Analysis</span>
                    </button>
                  ));
                })()}
              </div>
            )}

            {/* Row 4: remaining department tabs */}
            {departments.length > 7 && (
              <div className="flex gap-0.5 border-b-2 border-slate-300 bg-slate-200 rounded-b-md px-1 pt-1">
                {(() => {
                  const weatherDept = departments.find(d => d.name === 'Weather Impact & Resilience');
                  const otherDepts = departments
                    .filter(d => d.name !== 'Weather Impact & Resilience')
                    .sort((a, b) => a.name.localeCompare(b.name));
                  const allOrdered = [
                    ...(weatherDept ? [weatherDept] : []),
                    ...otherDepts
                  ];
                  const row4Depts = allOrdered.slice(7);

                  return row4Depts.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setActiveDepartmentTab(dept.name)}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 rounded-t-md border-t-2 border-x min-h-[3rem] ${
                        activeDepartmentTab === dept.name
                          ? 'bg-white -mb-0.5 shadow-sm'
                          : 'bg-slate-300 border-transparent hover:bg-slate-400/60'
                      }`}
                      style={{
                        borderTopColor: activeDepartmentTab === dept.name ? getDepartmentColor(dept.name) : 'transparent',
                        color: getDepartmentColor(dept.name)
                      }}
                    >
                      <Folder className="w-3 h-3 flex-shrink-0" />
                      <span className="font-semibold text-center leading-tight">{dept.name} Analysis</span>
                    </button>
                  ));
                })()}
              </div>
            )}

          </div>
        </div>

        {activeDepartmentTab === 'chat' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-blue-900 font-medium text-center leading-relaxed">
                <span className="font-semibold">Instructions:</span> 1. Click on the above tabs to upload real-time data by department.&nbsp;&nbsp;2. Select the Drop down department you want to analyze and then select a persona for the analysis.&nbsp;&nbsp;3. Then enter a prompt/question and click submit. The Default will search all departments with a default generic persona.
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl shadow-lg p-3 border border-blue-400 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gradient-to-br from-white/30 to-white/10 p-1.5 rounded-lg backdrop-blur-md shadow-md border border-white/20">
                    <MessageSquare className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                  <h2 className="text-sm font-bold text-white drop-shadow-lg tracking-tight">Airport Operations AI — Ask your question</h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    {personas.length === 0 && (
                      <div className="mb-2 p-2 bg-gradient-to-r from-amber-50 to-amber-100/90 border border-amber-300 rounded-lg shadow-sm">
                        <p className="text-[10px] text-amber-900 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Please go to an Operations Unit tab and upload airport documents first
                        </p>
                      </div>
                    )}
                    {personas.length > 0 && !selectedRole && (
                      <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-blue-100/90 border border-blue-300 rounded-lg shadow-sm">
                        <p className="text-[10px] text-blue-900 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Select a persona role first
                        </p>
                      </div>
                    )}
                    {personas.length > 0 && (
                      <>
                        <div className="mb-2">
                          <label className="block text-white text-xs font-semibold mb-1 drop-shadow">Operations Unit</label>
                          <select
                            value={selectedDepartmentId}
                            onChange={(e) => handleDepartmentChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-white/40 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                            style={{ color: selectedDepartmentId ? getDepartmentColor(departments.find(d => d.id === selectedDepartmentId)?.name || '') : '#475569' }}
                          >
                            <option value="" style={{ color: '#475569' }}>All Operations Units</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id} style={{ color: getDepartmentColor(dept.name), fontWeight: 'bold' }}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="block text-white text-xs font-semibold mb-1 drop-shadow">Persona</label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-white/40 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                            style={{
                              color: selectedRole
                                ? (() => {
                                    if (selectedRole === 'All Documents') return '#6366f1';
                                    const selectedPersona = allPersonas.find(p => p.name === selectedRole);
                                    const dept = departments.find(d => d.id === selectedPersona?.department_id);
                                    return getDepartmentColor(dept?.name || '');
                                  })()
                                : '#475569'
                            }}
                          >
                            <option value="" style={{ color: '#475569' }}>Choose a persona...</option>
                            {!selectedDepartmentId && (
                              <option value="All Documents" style={{ color: '#6366f1', fontWeight: 'bold' }}>
                                All Documents - Search Everywhere
                              </option>
                            )}
                            {personas
                              .slice()
                              .sort((a, b) => {
                                const fullPersonaA = allPersonas.find(p => p.name === a.name);
                                const fullPersonaB = allPersonas.find(p => p.name === b.name);
                                const deptA = departments.find(d => d.id === fullPersonaA?.department_id);
                                const deptB = departments.find(d => d.id === fullPersonaB?.department_id);

                                if (!deptA && !deptB) return 0;
                                if (!deptA) return 1;
                                if (!deptB) return -1;

                                return deptA.name.localeCompare(deptB.name);
                              })
                              .map((persona) => {
                                const fullPersona = allPersonas.find(p => p.name === persona.name);
                                const department = departments.find(d => d.id === fullPersona?.department_id);
                                const departmentSuffix = department
                                  ? ` - ${department.name.replace('Department', 'Dept')}`
                                  : '';
                                return (
                                  <option
                                    key={persona.name}
                                    value={persona.name}
                                    style={{ color: getDepartmentColor(department?.name || ''), fontWeight: 'bold' }}
                                  >
                                    {persona.name}{departmentSuffix}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="mb-2">
                      <label className="block text-white text-xs font-semibold mb-1 drop-shadow">Your Question</label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full h-24 max-h-40 min-h-24 px-3 py-2 border border-white/40 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white backdrop-blur-md resize-y text-xs text-slate-800 placeholder-slate-400 shadow-md hover:shadow-lg transition-all duration-200 overflow-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 font-medium"
                        style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                      />
                    </div>
                    <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1 drop-shadow">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Drag bottom-right corner to resize
                    </p>
                  </div>
                  <div className="flex lg:flex-col gap-2 lg:w-32">
                    <button
                      onClick={handleSubmitPrompt}
                      disabled={processing || !prompt.trim() || !selectedRole || personas.length === 0}
                      className="flex-1 lg:flex-initial bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-white disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-blue-700 font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 disabled:transform-none disabled:hover:scale-100 text-xs border border-white/50"
                    >
                      <Send className="w-3 h-3" />
                      {processing ? 'Searching...' : 'Submit'}
                    </button>
                    <button
                      onClick={handleClearAll}
                      disabled={processing}
                      className="flex-1 lg:flex-initial bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 disabled:transform-none disabled:hover:scale-100 text-xs border border-red-400"
                      title="Clear all chat history, cache, and results"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                    {documents.length > 0 && (
                      <div className="hidden lg:block bg-white/20 backdrop-blur-sm rounded-md p-1.5 border border-white/30">
                        <p className="text-[10px] text-white font-medium text-center">
                          {documents.length} doc{documents.length !== 1 ? 's' : ''} ready
                        </p>
                      </div>
                    )}
                    {personas.length > 0 && (
                      <div className="hidden lg:block bg-white/20 backdrop-blur-sm rounded-md p-1.5 border border-white/30">
                        <p className="text-[10px] text-white font-medium text-center">
                          {personas.length} persona{personas.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <ResultsPanel
                response={currentResult?.response}
                accuracy={currentResult?.accuracy}
                topDocs={currentResult?.topDocs}
                onViewDocument={handleViewDocument}
                promptId={currentResult?.promptId}
                currentFeedback={currentResult?.feedback}
                onFeedback={handleFeedback}
                userPrompt={currentResult ? prompt : undefined}
                chunkingStrategy={currentResult?.chunkingStrategy}
                chunkingStrategyNumber={currentResult?.chunkingStrategyNumber}
              />
            </div>


            {chunkingResults.some(r => r.accuracy > 0 || r.loading) && (
              <ChunkingStrategySelector
                results={chunkingResults}
                selectedStrategy={selectedStrategyForView}
                onSelectStrategy={handleSelectStrategy}
                isProcessing={processing}
                activeStrategy={chunkingStrategy}
                onSetActiveStrategy={handleSetActiveStrategy}
              />
            )}

            <DocumentsDashboard
              departmentStats={departmentStats}
              totalDocuments={totalDocumentCount}
              departments={departments}
              departmentDocuments={departmentDocuments}
              uploadingByDepartment={uploadingByDepartment}
              onDepartmentFileUpload={handleFileUpload}
              auditSchedules={auditSchedules}
              uploadingAuditSchedule={uploadingAuditSchedule}
              onAuditScheduleUpload={handleAuditScheduleUpload}
              onDeleteAuditSchedule={handleDeleteAuditSchedule}
              workPapers={workPapers}
              uploadingWorkPaper={uploadingWorkPaper}
              onWorkPaperUpload={handleWorkPaperUpload}
              onDeleteWorkPaper={handleDeleteWorkPaper}
            />

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg p-3 border-2 border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="bg-slate-500 p-1 rounded-lg">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Query History & Config</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                    <ThumbsUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-bold text-green-700">{feedbackCounts.thumbsUp}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                    <ThumbsDown className="w-3 h-3 text-red-600" />
                    <span className="text-xs font-bold text-red-700">{feedbackCounts.thumbsDown}</span>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="p-1 hover:bg-red-100 rounded-lg transition bg-red-50 border border-red-200"
                      title="Clear all history"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    className="p-1 hover:bg-slate-200 rounded-lg transition bg-slate-100"
                    title={historyExpanded ? 'Collapse' : 'Expand'}
                  >
                    {historyExpanded ? (
                      <ChevronUp className="w-3 h-3 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {historyExpanded && (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">No history yet</p>
                    </div>
                  ) : (
                    history.slice(0, 10).map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2 bg-gradient-to-br from-slate-50 to-white rounded-lg hover:from-blue-50 hover:to-white transition cursor-pointer border border-slate-200 hover:border-blue-300"
                        onClick={() => {
                          setPrompt(entry.prompt);
                          setSelectedRole(entry.role);
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-800 truncate mb-1">{entry.prompt}</p>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-500">
                            {entry.role} • {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1">
                            {entry.pii_detected !== undefined && (
                              <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${
                                entry.pii_detected ? 'bg-red-100' : 'bg-green-100'
                              }`} title={entry.pii_detected ? `PII Detected: ${entry.pii_details}` : 'No PII Detected'}>
                                {entry.pii_detected ? (
                                  <ShieldAlert className="w-2.5 h-2.5 text-red-600" />
                                ) : (
                                  <ShieldCheck className="w-2.5 h-2.5 text-green-600" />
                                )}
                              </div>
                            )}
                            {entry.feedback && (
                              <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${
                                entry.feedback === 'up' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {entry.feedback === 'up' ? (
                                  <ThumbsUp className="w-2.5 h-2.5 text-green-600" />
                                ) : (
                                  <ThumbsDown className="w-2.5 h-2.5 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {(entry.bias_score !== undefined || entry.hallucination_score !== undefined || entry.drift_score !== undefined) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {entry.bias_score !== undefined && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                <Shield className="w-2.5 h-2.5 text-slate-600" />
                                <span className="text-xs font-semibold text-slate-700">B: {(entry.bias_score * 100).toFixed(0)}%</span>
                              </div>
                            )}
                            {entry.hallucination_score !== undefined && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                <AlertTriangle className="w-2.5 h-2.5 text-slate-600" />
                                <span className="text-xs font-semibold text-slate-700">H: {(entry.hallucination_score * 100).toFixed(0)}%</span>
                              </div>
                            )}
                            {entry.drift_score !== undefined && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                <Activity className="w-2.5 h-2.5 text-slate-600" />
                                <span className="text-xs font-semibold text-slate-700">D: {(entry.drift_score * 100).toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        <div style={{ display: activeDepartmentTab === 'metrics' ? 'block' : 'none' }}>
          <MetricsDashboard
            documents={documents}
            selectedRole={selectedRole}
            selectedDepartmentId={selectedDepartmentId}
            departments={departments}
            personas={personas}
            allPersonas={allPersonas}
            onDepartmentChange={handleDepartmentChange}
            onRoleChange={setSelectedRole}
            getDepartmentColor={getDepartmentColor}
            userPrompt={prompt}
            triggerEvaluation={false}
            onEvaluationComplete={() => {}}
            currentResponse={currentResult?.response || ''}
            currentContext={savedContext}
            triggerBiasAnalysis={triggerBiasAnalysis}
            currentExactMatch={currentExactMatch}
            onBiasAnalysisComplete={(analysis) => {
              setCurrentBiasAnalysis(analysis);
              setCurrentBiasScore(analysis.biasScore);
              setCurrentDriftScore(analysis.driftScore);
              setCurrentHallucinationScore(analysis.hallucinationScore);
              setTriggerBiasAnalysis(false);
              setIsAnalyzingBias(false);
            }}
            triggerMetricsRefresh={triggerMetricsRefresh}
            onMetricsRefreshComplete={() => setTriggerMetricsRefresh(false)}
            currentPromptId={currentPromptId}
            currentActiveStrategy={chunkingStrategy}
            chunkingResultsFromChat={chunkingResults}
            onChunkingStrategyScores={async (scores) => {
              if (currentPromptId) {
                await updatePromptChunkingScores(currentPromptId, scores);
                await loadHistory();
              }
            }}
            onChunkingResultsUpdate={(results) => {
              setChunkingResults(results);
            }}
            onStrategySelect={(strategyData) => {

              setCurrentResult({
                ...currentResult,
                response: strategyData.response,
                accuracy: strategyData.accuracy,
                chunkingStrategy: strategyData.strategy,
                chunkingStrategyNumber: strategyData.strategyNumber,
              });
              setSelectedChunkingStrategy({
                strategy: strategyData.strategy,
                strategyNumber: strategyData.strategyNumber,
              });
              setSavedContext(strategyData.context);
              setActiveDepartmentTab('chat');
              const newExact = strategyData.exactMatch || false;
              setCurrentExactMatch(newExact);
              setTriggerBiasAnalysis(true);
              setIsAnalyzingBias(true);

            }}
            onSetActiveStrategy={(strategyNumber) => {
              setChunkingStrategy(strategyNumber);
            }}
            onStrategyActivated={handleResubmitLastPrompt}
            lastSubmittedPrompt={lastSubmittedPrompt}
          />
        </div>

        {activeDepartmentTab === 'add-department' && (
          <AddDepartment
            onDepartmentCreated={async () => {
              await loadDepartments();
              await loadAllPersonas();
              await loadDocuments();
              await loadDepartmentStats();
            }}
            onFileUpload={handleFileUpload}
            uploading={Object.values(uploadingByDepartment).some(v => v)}
          />
        )}

        {activeDepartmentTab === 'audit-schedules' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-sky-50 via-sky-100 to-sky-50 border-2 border-sky-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ClipboardList className="w-8 h-8 text-sky-700" />
                <h2 className="text-2xl font-bold text-sky-900">Flight Schedules</h2>
              </div>
              <p className="text-sm text-sky-800">
                Upload and manage flight schedules and operational timetables for the current year and next year.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-sky-200">
                <h3 className="text-lg font-bold text-sky-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Current Year ({new Date().getFullYear()})
                </h3>
                <label className="block">
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    uploadingAuditSchedule
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-sky-300 hover:border-sky-500 hover:bg-sky-50'
                  }`}>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-sky-600" />
                    <p className="text-sm text-sky-700 font-medium mb-1">
                      {uploadingAuditSchedule ? 'Uploading...' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-sky-600">PDF, DOCX, TXT, CSV, XLSX, XLS files supported</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.csv,.xlsx,.xls"
                    multiple
                    onChange={(e) => handleAuditScheduleUpload(e, new Date().getFullYear())}
                    disabled={uploadingAuditSchedule}
                  />
                </label>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-sky-200">
                <h3 className="text-lg font-bold text-sky-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Next Year ({new Date().getFullYear() + 1})
                </h3>
                <label className="block">
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    uploadingAuditSchedule
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-sky-300 hover:border-sky-500 hover:bg-sky-50'
                  }`}>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-sky-600" />
                    <p className="text-sm text-sky-700 font-medium mb-1">
                      {uploadingAuditSchedule ? 'Uploading...' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-sky-600">PDF, DOCX, TXT, CSV, XLSX, XLS files supported</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.csv,.xlsx,.xls"
                    multiple
                    onChange={(e) => handleAuditScheduleUpload(e, new Date().getFullYear() + 1)}
                    disabled={uploadingAuditSchedule}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border-2 border-sky-200">
              <div className="p-4 border-b border-sky-200 bg-sky-50">
                <h3 className="text-lg font-bold text-sky-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Flight Schedules ({auditSchedules.length})
                </h3>
              </div>
              <div className="p-6">
                {auditSchedules.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No flight schedules uploaded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {[new Date().getFullYear() + 1, new Date().getFullYear()].map(year => {
                      const yearSchedules = auditSchedules.filter(s => s.year === year);
                      if (yearSchedules.length === 0) return null;

                      return (
                        <div key={year} className="border border-sky-200 rounded-lg overflow-hidden">
                          <div className="bg-sky-50 px-4 py-2 border-b border-sky-200">
                            <h4 className="font-bold text-sky-900">{year} Flight Schedules</h4>
                          </div>
                          <div className="divide-y divide-sky-100">
                            {yearSchedules.map(schedule => (
                              <div key={schedule.id} className="p-4 hover:bg-sky-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <FileText className="w-5 h-5 text-sky-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">{schedule.file_name}</p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span>{(schedule.file_size / 1024).toFixed(1)} KB</span>
                                        <span>•</span>
                                        <span>{new Date(schedule.uploaded_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{new Date(schedule.uploaded_at).toLocaleTimeString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteAuditSchedule(schedule.id)}
                                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete schedule"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeDepartmentTab === 'work-papers' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-50 via-teal-100 to-teal-50 border-2 border-teal-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <FileStack className="w-8 h-8 text-teal-700" />
                <h2 className="text-2xl font-bold text-teal-900">Operations Reports</h2>
              </div>
              <p className="text-sm text-teal-800">
                Upload and manage operations reports, data analyses, and airport performance documentation.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-teal-200">
              <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Operations Reports
              </h3>
              <label className="block">
                <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  uploadingWorkPaper
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-teal-300 hover:border-teal-500 hover:bg-teal-50'
                }`}>
                  <Upload className="w-12 h-12 mx-auto mb-3 text-teal-600" />
                  <p className="text-sm text-teal-700 font-medium mb-1">
                    {uploadingWorkPaper ? 'Uploading...' : 'Click to upload operations reports'}
                  </p>
                  <p className="text-xs text-teal-600">PDF, DOCX, TXT, CSV, XLSX, XLS files supported</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.csv,.xlsx,.xls"
                  multiple
                  onChange={handleWorkPaperUpload}
                  disabled={uploadingWorkPaper}
                />
              </label>
            </div>

            <div className="bg-white rounded-lg shadow-md border-2 border-teal-200">
              <div className="p-4 border-b border-teal-200 bg-teal-50">
                <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Operations Reports ({workPapers.length})
                </h3>
              </div>
              <div className="p-6">
                {workPapers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No operations reports uploaded yet.</p>
                ) : (
                  <div className="divide-y divide-teal-100">
                    {workPapers.map(paper => (
                      <div key={paper.id} className="py-4 hover:bg-teal-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{paper.file_name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span>{(paper.file_size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span>{new Date(paper.uploaded_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(paper.uploaded_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteWorkPaper(paper.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete work paper"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeDepartmentTab !== 'chat' && activeDepartmentTab !== 'metrics' && activeDepartmentTab !== 'add-department' && activeDepartmentTab !== 'audit-schedules' && activeDepartmentTab !== 'work-papers' && departments.find(d => d.name === activeDepartmentTab) && (
          <DocumentManagement
            documents={departmentDocuments[activeDepartmentTab] || []}
            uploadingDocs={uploadingByDepartment[activeDepartmentTab] || false}
            onFileUpload={(e) => handleFileUpload(e, activeDepartmentTab)}
            onDocumentDeleted={handleDocumentDeleted}
            totalUploadedCount={totalUploadedCount}
            deletedDocumentsCount={deletedDocumentsCount}
            departmentName={activeDepartmentTab}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            chunkingStrategy={chunkingStrategy}
            selectedChunkingStrategy={selectedChunkingStrategy}
          />
        )}
      </div>

      {showDocumentsList && (
        <DocumentsList
          documents={documents}
          personas={personas}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onDocumentDeleted={loadDocuments}
          onClose={() => setShowDocumentsList(false)}
        />
      )}

      {showDocumentViewer && selectedDocumentToView && (
        <DocumentViewer
          topDocument={{
            filename: selectedDocumentToView.filename,
            text: selectedDocumentToView.text,
            similarity: selectedDocumentToView.similarity,
            file_type: selectedDocumentToView.file_type,
          }}
          onClose={() => {
            setShowDocumentViewer(false);
            setSelectedDocumentToView(null);
          }}
        />
      )}

      <ScanningPopup
        isOpen={showScanningPopup}
        onClose={() => setShowScanningPopup(false)}
        matchedChunks={matchedChunks}
        isSearching={isSearching}
      />

      {currentResult && (
        <ResultsPopup
          isOpen={showResultsPopup}
          onClose={() => {
            setShowResultsPopup(false);
            setHasSeenResults(true);
          }}
          response={currentResult.response}
          accuracy={currentResult.accuracy}
          topDocs={currentResult.topDocs}
          onViewDocument={handleViewDocument}
          promptId={currentResult.promptId}
          currentFeedback={currentResult.feedback}
          onFeedback={handleFeedback}
          userPrompt={prompt}
        />
      )}

      {currentPIIResult && (
        <PIIWarningPopup
          isOpen={showPIIWarning}
          onClose={() => {
            setShowPIIWarning(false);
            setCurrentPIIResult(null);
          }}
          onProceed={() => {
            setShowPIIWarning(false);
            setPendingPromptSubmission(true);
          }}
          piiResult={currentPIIResult}
        />
      )}

      <UploadStatusModal
        isOpen={uploadModal.isOpen}
        files={uploadModal.files}
        isComplete={uploadModal.isComplete}
        onClose={() => setUploadModal({ isOpen: false, files: [], isComplete: false })}
      />
    </div>
  );
}

export default App;
