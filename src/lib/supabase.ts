import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  user_id: string | null;
  uploaded_at: string;
  created_at: string;
  file_content?: string | null;
  version?: number;
  parent_document_id?: string | null;
  is_latest?: boolean;
  persona_id?: string | null;
}

export interface Embedding {
  id: string;
  document_id: string;
  chunk_text: string;
  embedding: number[];
  chunk_index: number;
  hierarchy_level: number;
  created_at: string;
}

export interface PromptResponse {
  id: string;
  prompt: string;
  response: string;
  role: string;
  top_documents: TopDocument[];
  accuracy_scores: number[];
  is_cached: boolean;
  cached_response_id: string | null;
  created_at: string;
  feedback?: string | null;
  bias_score?: number;
  hallucination_score?: number;
  drift_score?: number;
  bias_analysis?: string;
  hallucination_analysis?: string;
  drift_analysis?: string;
  pii_detected?: boolean;
  pii_types?: string[];
  pii_details?: string;
}

export interface TopDocument {
  index: number;
  similarity: number;
}

export interface ChunkingStrategyScore {
  strategy: string;
  name: string;
  score: number;
}

export interface Persona {
  id: string;
  name: string;
  prompt: string;
  department_id: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export async function uploadDocument(
  filename: string,
  filePath: string,
  fileType: string,
  fileContent?: string,
  personaId?: string | null,
  departmentId?: string | null
): Promise<Document> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        filename,
        file_path: filePath,
        file_type: fileType || 'application/octet-stream',
        user_id: user?.id || null,
        file_content: fileContent,
        version: 1,
        is_latest: true,
        persona_id: personaId || null,
        department_id: departmentId || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error uploading document:', error);
    throw new Error(`Failed to save document record: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after document insert');
  }

  return data;
}

export async function uploadDocumentVersion(
  filename: string,
  filePath: string,
  fileType: string,
  parentDocumentId: string,
  newVersion: number,
  fileContent?: string,
  personaId?: string | null,
  departmentId?: string | null
): Promise<Document> {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from('documents')
    .update({ is_latest: false })
    .eq('filename', filename)
    .eq('is_latest', true);

  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        filename,
        file_path: filePath,
        file_type: fileType || 'application/octet-stream',
        user_id: user?.id || null,
        file_content: fileContent,
        version: newVersion,
        parent_document_id: parentDocumentId,
        is_latest: true,
        persona_id: personaId || null,
        department_id: departmentId || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error uploading document version:', error);
    throw new Error(`Failed to save document version: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned after document version insert');
  }

  return data;
}

export async function saveEmbedding(
  documentId: string,
  chunkText: string,
  embedding: number[],
  chunkIndex: number,
  hierarchyLevel: number
): Promise<Embedding> {
  const { data, error } = await supabase
    .from('embeddings')
    .insert([
      {
        document_id: documentId,
        chunk_text: chunkText,
        embedding,
        chunk_index: chunkIndex,
        hierarchy_level: hierarchyLevel,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving embedding:', error);
    throw new Error(`Failed to save embedding chunk ${chunkIndex}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No data returned after embedding insert for chunk ${chunkIndex}`);
  }

  return data;
}

export async function savePromptResponse(
  prompt: string,
  response: string,
  role: string,
  topDocuments: TopDocument[],
  accuracyScores: number[],
  isCached: boolean = false,
  cachedResponseId: string | null = null,
  biasScore?: number,
  hallucinationScore?: number,
  biasAnalysis?: string,
  hallucinationAnalysis?: string,
  piiDetected?: boolean,
  piiTypes?: string[],
  piiDetails?: string,
  activeChunkingStrategy?: string
): Promise<PromptResponse | null> {
  const { data, error } = await supabase
    .from('prompt_responses')
    .insert([
      {
        prompt,
        response,
        role,
        top_documents: topDocuments,
        accuracy_scores: accuracyScores,
        is_cached: isCached,
        cached_response_id: cachedResponseId,
        bias_score: biasScore,
        hallucination_score: hallucinationScore,
        bias_analysis: biasAnalysis,
        hallucination_analysis: hallucinationAnalysis,
        pii_detected: piiDetected,
        pii_types: piiTypes,
        pii_details: piiDetails,
        active_chunking_strategy: activeChunkingStrategy || '1',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving prompt response:', error);
    return null;
  }

  return data;
}

export async function checkDuplicatePrompt(
  prompt: string
): Promise<PromptResponse | null> {
  const { data, error } = await supabase
    .from('prompt_responses')
    .select('*')
    .eq('prompt', prompt)
    .maybeSingle();

  if (error) {
    console.error('Error checking duplicate prompt:', error);
    return null;
  }

  return data;
}

export async function getAllDocuments(personaId?: string | null, departmentId?: string | null): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('is_latest', true);

  if (personaId) {
    query = query.eq('persona_id', personaId);
  } else if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data || [];
}

export async function searchEmbeddings(
  queryEmbedding: number[],
  matchCount: number = 3,
  documentIds?: string[] | null,
  departmentIds?: string[]
): Promise<
  Array<{
    id: string;
    document_id: string;
    filename: string;
    file_type: string;
    chunk_text: string;
    similarity: number;
    hierarchy_level: number;
  }>
> {
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    document_ids: documentIds === null || documentIds === undefined ? null : documentIds,
    department_ids: departmentIds || null,
  });

  if (error) {
    console.error('Error searching embeddings:', error);
    return [];
  }

  return data || [];
}

export async function getPromptHistory(): Promise<PromptResponse[]> {
  const { data, error } = await supabase
    .from('prompt_responses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching prompt history:', error);
    return [];
  }

  return data || [];
}

export async function getAllPromptResponses(): Promise<PromptResponse[]> {
  const { data, error } = await supabase
    .from('prompt_responses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all prompt responses:', error);
    return [];
  }

  return data || [];
}

const EXACT_MATCH_THRESHOLD = 0.95;

export async function recalculateAllMetrics(): Promise<{ success: boolean; updated: number; errors: number }> {
  const transformSimilarityToConfidence = (similarity: number): number => {
    const scaled = Math.pow(similarity, 0.5);
    const boosted = scaled + (similarity - 0.3) * 0.3;
    return Math.max(0.5, Math.min(0.98, boosted));
  };

  try {
    const prompts = await getAllPromptResponses();
    let updated = 0;
    let errors = 0;

    for (const prompt of prompts) {
      try {
        const accuracyScores = prompt.accuracy_scores || [];
        const isExactMatch = accuracyScores.length > 0 && Math.max(...accuracyScores) >= EXACT_MATCH_THRESHOLD;

        let confidence: number;
        let biasScore: number;
        let driftScore: number;
        let hallucinationScore: number;
        let biasAnalysis: string;
        let driftAnalysis: string;
        let hallucinationAnalysis: string;

        if (isExactMatch) {
          confidence = 1.0;
          biasScore = 0;
          driftScore = 0;
          hallucinationScore = 0;
          biasAnalysis = 'Exact match detected — response is directly grounded in retrieved content. No bias present.';
          driftAnalysis = 'Exact match detected — response perfectly aligns with retrieved context. No drift.';
          hallucinationAnalysis = 'Exact match detected — all response content is fully supported by the source documents. No hallucination.';
        } else {
          confidence = accuracyScores.length > 0
            ? accuracyScores.reduce((sum, score) => sum + transformSimilarityToConfidence(score), 0) / accuracyScores.length
            : 0;

          const remainingQuality = 1 - confidence;
          biasScore = remainingQuality * 0.40;
          driftScore = remainingQuality * 0.30;
          hallucinationScore = remainingQuality * 0.30;

          biasAnalysis = biasScore < 0.3
            ? 'Low bias detected - response appears balanced and fair'
            : biasScore < 0.6
            ? 'Moderate bias - some potential for skewed perspective'
            : 'High bias detected - response may show significant bias';

          driftAnalysis = driftScore < 0.3
            ? 'Low drift - response aligns well with source documents'
            : driftScore < 0.6
            ? 'Moderate drift - some deviation from source material'
            : 'High drift - significant deviation from source context';

          hallucinationAnalysis = hallucinationScore < 0.3
            ? 'Low hallucination risk - response grounded in provided context'
            : hallucinationScore < 0.6
            ? 'Moderate hallucination risk - some unverified claims possible'
            : 'High hallucination risk - response may contain fabricated information';
        }

        const success = await updatePromptBiasAnalysis(
          prompt.id,
          biasScore,
          hallucinationScore,
          biasAnalysis,
          hallucinationAnalysis,
          driftScore,
          driftAnalysis
        );

        if (success) {
          updated++;
        } else {
          errors++;
        }
      } catch (err) {
        console.error(`Error updating prompt ${prompt.id}:`, err);
        errors++;
      }
    }

    return { success: true, updated, errors };
  } catch (error) {
    console.error('Error recalculating all metrics:', error);
    return { success: false, updated: 0, errors: 0 };
  }
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const { error: embeddingsError } = await supabase
    .from('embeddings')
    .delete()
    .eq('document_id', documentId);

  if (embeddingsError) {
    console.error('Error deleting embeddings:', embeddingsError);
    return false;
  }

  const { error: documentError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (documentError) {
    console.error('Error deleting document:', documentError);
    return false;
  }

  return true;
}

export async function checkDuplicateFilename(filename: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('filename', filename)
    .eq('is_latest', true)
    .maybeSingle();

  if (error) {
    console.error('Error checking duplicate filename:', error);
    return null;
  }

  return data;
}

export async function getDocumentVersionCount(filename: string): Promise<number> {
  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('filename', filename);

  if (error) {
    console.error('Error getting version count:', error);
    return 0;
  }

  return count || 0;
}

export async function getLatestVersionNumber(filename: string): Promise<number> {
  const { data, error } = await supabase
    .from('documents')
    .select('version')
    .eq('filename', filename)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return data.version || 0;
}

export async function getAllPersonas(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching personas:', error);
    return [];
  }

  return data || [];
}

export async function getAllDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*');

  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }

  const departmentOrder = [
    "Policy Doc's",
    "Risk Doc's",
    "TPRM Doc's",
    "Regulation Doc's",
    "Audit Issues",
    "Audit Findings",
    "Audit Approval Doc's",
    "Assessment Doc's",
    "Control Procedure Doc's",
    "Testing Doc's",
    "Exception Doc's",
    "Reporting Doc's",
    "Audit Procedures",
    "Audit Guide",
    "Audit Stds"
  ];

  const sorted = (data || []).sort((a, b) => {
    const indexA = departmentOrder.indexOf(a.name);
    const indexB = departmentOrder.indexOf(b.name);

    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  return sorted;
}

export async function createDepartmentWithPersona(
  departmentName: string,
  personaName: string,
  personaPrompt: string
): Promise<{ success: boolean; departmentId?: string }> {
  const { data: existing, error: checkError } = await supabase
    .from('departments')
    .select('id')
    .eq('name', departmentName)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking for existing department:', checkError);
    return { success: false };
  }

  if (existing) {
    alert('A department with this name already exists.');
    return { success: false };
  }

  const { data: newDepartment, error: deptError } = await supabase
    .from('departments')
    .insert([{ name: departmentName }])
    .select()
    .single();

  if (deptError || !newDepartment) {
    console.error('Error creating department:', deptError);
    return { success: false };
  }

  const { error: personaError } = await supabase
    .from('personas')
    .insert([{ name: personaName, prompt: personaPrompt, department_id: newDepartment.id }]);

  if (personaError) {
    console.error('Error creating persona:', personaError);
    return { success: false };
  }

  return { success: true, departmentId: newDepartment.id };
}

export async function getPersonasByDepartment(departmentId: string): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('department_id', departmentId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching personas by department:', error);
    return [];
  }

  return data || [];
}

export async function deleteAllPromptHistory(): Promise<boolean> {
  const { error } = await supabase
    .from('prompt_responses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error deleting all prompt history:', error);
    return false;
  }

  return true;
}

export async function deleteAllDocuments(): Promise<boolean> {
  const { error: embeddingsError } = await supabase
    .from('embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (embeddingsError) {
    console.error('Error deleting all embeddings:', embeddingsError);
    return false;
  }

  const { error: documentsError } = await supabase
    .from('documents')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (documentsError) {
    console.error('Error deleting all documents:', documentsError);
    return false;
  }

  return true;
}

export interface DocumentCountByPersona {
  personaName: string;
  count: number;
}

export async function getDocumentCountsByPersona(): Promise<{ counts: DocumentCountByPersona[]; total: number }> {
  const { data, error } = await supabase
    .from('documents')
    .select('persona_id, personas(name)')
    .eq('is_latest', true)
    .not('persona_id', 'is', null);

  if (error) {
    console.error('Error fetching document counts by persona:', error);
    return { counts: [], total: 0 };
  }

  const countMap = new Map<string, number>();

  (data || []).forEach((doc: any) => {
    const personaName = doc.personas?.name;
    if (!personaName) return;

    countMap.set(personaName, (countMap.get(personaName) || 0) + 1);
  });

  const counts: DocumentCountByPersona[] = Array.from(countMap.entries()).map(([personaName, count]) => ({
    personaName,
    count,
  }));

  const total = data?.length || 0;

  return { counts, total };
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  documentCount: number;
  personaCount: number;
  lastUpdated: string | null;
}

export interface AuditSchedule {
  id: string;
  year: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_content: string | null;
  uploaded_at: string;
  user_id: string | null;
  department_id: string | null;
}

export interface WorkPaper {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_content: string | null;
  uploaded_at: string;
  user_id: string | null;
  department_id: string | null;
  category: string | null;
}

export async function updatePromptFeedback(promptId: string, feedback: 'up' | 'down'): Promise<boolean> {
  const { error } = await supabase
    .from('prompt_responses')
    .update({ feedback })
    .eq('id', promptId);

  if (error) {
    console.error('Error updating prompt feedback:', error);
    return false;
  }

  return true;
}

export async function updatePromptBiasAnalysis(
  promptId: string,
  biasScore: number,
  hallucinationScore: number,
  biasAnalysis: string,
  hallucinationAnalysis: string,
  driftScore?: number,
  driftAnalysis?: string
): Promise<boolean> {
  const updateData: any = {
    bias_score: biasScore,
    hallucination_score: hallucinationScore,
    bias_analysis: biasAnalysis,
    hallucination_analysis: hallucinationAnalysis,
  };

  if (driftScore !== undefined) {
    updateData.drift_score = driftScore;
  }
  if (driftAnalysis !== undefined) {
    updateData.drift_analysis = driftAnalysis;
  }

  const { error } = await supabase
    .from('prompt_responses')
    .update(updateData)
    .eq('id', promptId);

  if (error) {
    console.error('Error updating prompt bias analysis:', error);
    return false;
  }

  return true;
}

export async function updatePromptChunkingScores(
  promptId: string,
  chunkingStrategyScores: ChunkingStrategyScore[]
): Promise<boolean> {
  const { error } = await supabase
    .from('prompt_responses')
    .update({
      chunking_strategy_scores: chunkingStrategyScores,
    })
    .eq('id', promptId);

  if (error) {
    console.error('Error updating chunking strategy scores:', error);
    return false;
  }

  return true;
}

export async function getHistoricalBiasMetrics(days: number = 5, activeStrategy?: string): Promise<Array<{
  created_at: string;
  prompt: string;
  response: string;
  bias_score: number;
  hallucination_score: number;
  drift_score: number;
  bias_analysis: string;
  hallucination_analysis: string;
  drift_analysis: string;
  accuracy_scores: number[];
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('prompt_responses')
    .select('created_at, prompt, response, bias_score, hallucination_score, drift_score, bias_analysis, hallucination_analysis, drift_analysis, accuracy_scores')
    .not('bias_score', 'is', null)
    .not('hallucination_score', 'is', null)
    .gte('created_at', startDate.toISOString());

  if (activeStrategy) {
    query = query.eq('active_chunking_strategy', activeStrategy);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching historical bias metrics:', error);
    return [];
  }

  return data || [];
}

export async function getPromptConfidenceHistory(): Promise<Array<{
  id: string;
  prompt: string;
  confidence: number;
  bias_score: number;
  hallucination_score: number;
  drift_score: number;
  created_at: string;
}>> {
  const { data, error } = await supabase
    .from('prompt_responses')
    .select('id, prompt, accuracy_scores, bias_score, hallucination_score, drift_score, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching prompt confidence history:', error);
    return [];
  }

  if (!data) return [];

  const transformSimilarityToConfidence = (similarity: number): number => {
    const scaled = Math.pow(similarity, 0.5);
    const boosted = scaled + (similarity - 0.3) * 0.3;
    return Math.max(0.5, Math.min(0.98, boosted));
  };

  return data.map(item => {
    const accuracyScores = item.accuracy_scores as number[] || [];
    const weights = [0.5, 0.3, 0.2];
    let weightedSum = 0;
    let totalWeight = 0;
    const sorted = [...accuracyScores].sort((a, b) => b - a);
    for (let i = 0; i < Math.min(sorted.length, weights.length); i++) {
      weightedSum += transformSimilarityToConfidence(sorted[i]) * weights[i];
      totalWeight += weights[i];
    }
    const confidence = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      id: item.id,
      prompt: item.prompt,
      confidence,
      bias_score: item.bias_score ?? 0,
      hallucination_score: item.hallucination_score ?? 0,
      drift_score: item.drift_score ?? 0,
      created_at: item.created_at
    };
  }).filter(item => item.confidence > 0);
}

export async function getFeedbackCounts(): Promise<{ thumbsUp: number; thumbsDown: number }> {
  const [upResult, downResult] = await Promise.all([
    supabase.from('prompt_responses').select('*', { count: 'exact', head: true }).eq('feedback', 'up'),
    supabase.from('prompt_responses').select('*', { count: 'exact', head: true }).eq('feedback', 'down'),
  ]);

  return {
    thumbsUp: upResult.count || 0,
    thumbsDown: downResult.count || 0,
  };
}

export async function getPIIStatistics(): Promise<{
  totalPrompts: number;
  piiDetected: number;
  piiClean: number;
  piiByType: Record<string, number>;
}> {
  const { data: allPrompts, count: totalCount } = await supabase
    .from('prompt_responses')
    .select('*', { count: 'exact', head: true });

  const { data: piiPrompts, count: piiCount } = await supabase
    .from('prompt_responses')
    .select('*', { count: 'exact', head: true })
    .eq('pii_detected', true);

  const { data: detailedPII } = await supabase
    .from('prompt_responses')
    .select('pii_types')
    .eq('pii_detected', true);

  const piiByType: Record<string, number> = {};

  if (detailedPII) {
    detailedPII.forEach((record: any) => {
      const types = record.pii_types || [];
      types.forEach((type: string) => {
        piiByType[type] = (piiByType[type] || 0) + 1;
      });
    });
  }

  const totalPrompts = totalCount || 0;
  const piiDetected = piiCount || 0;
  const piiClean = totalPrompts - piiDetected;

  return { totalPrompts, piiDetected, piiClean, piiByType };
}

export async function getDepartmentStatistics(): Promise<DepartmentStats[]> {
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .order('name', { ascending: true });

  if (deptError || !departments) {
    console.error('Error fetching departments:', deptError);
    return [];
  }

  const stats: DepartmentStats[] = [];

  for (const dept of departments) {
    const { data: personas, error: personaError } = await supabase
      .from('personas')
      .select('id')
      .eq('department_id', dept.id);

    const personaCount = personas?.length || 0;

    let documentCount = 0;
    let lastUpdated: string | null = null;

    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('uploaded_at')
      .eq('department_id', dept.id)
      .eq('is_latest', true);

    documentCount = docs?.length || 0;

    if (docs && docs.length > 0) {
      const sortedDocs = docs.sort((a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
      lastUpdated = sortedDocs[0].uploaded_at;
    }

    stats.push({
      departmentId: dept.id,
      departmentName: dept.name,
      documentCount,
      personaCount,
      lastUpdated,
    });
  }

  return stats;
}

export async function uploadAuditSchedule(
  year: number,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileContent?: string,
  departmentId?: string | null
): Promise<AuditSchedule | null> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('audit_schedules')
    .insert([
      {
        year,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_content: fileContent,
        user_id: user?.id || null,
        department_id: departmentId || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error uploading audit schedule:', error);
    return null;
  }

  return data;
}

export async function getAllAuditSchedules(): Promise<AuditSchedule[]> {
  const { data, error } = await supabase
    .from('audit_schedules')
    .select('*')
    .order('year', { ascending: false })
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit schedules:', error);
    return [];
  }

  return data || [];
}

export async function deleteAuditSchedule(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('audit_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting audit schedule:', error);
    return false;
  }

  return true;
}

export async function uploadWorkPaper(
  fileName: string,
  fileType: string,
  fileSize: number,
  fileContent?: string,
  departmentId?: string | null,
  category?: string | null
): Promise<WorkPaper | null> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('work_papers')
    .insert([
      {
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_content: fileContent,
        user_id: user?.id || null,
        department_id: departmentId || null,
        category: category || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error uploading work paper:', error);
    return null;
  }

  return data;
}

export async function getAllWorkPapers(): Promise<WorkPaper[]> {
  const { data, error } = await supabase
    .from('work_papers')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching work papers:', error);
    return [];
  }

  return data || [];
}

export async function deleteWorkPaper(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('work_papers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting work paper:', error);
    return false;
  }

  return true;
}
