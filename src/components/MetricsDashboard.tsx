import { useState, useEffect } from 'react';
import { Send, AlertCircle, TrendingUp, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { generateEmbedding, getLLMResponse, formatAccuracy, getAccuracyColor, analyzeBiasAndHallucination, isExactMatchScore, type BiasHallucinationAnalysis } from '../lib/embeddings';
import { searchEmbeddings, getAllDocuments, updatePromptBiasAnalysis, getHistoricalBiasMetrics, getPromptConfidenceHistory, recalculateAllMetrics, type Document, type ChunkingStrategyScore } from '../lib/supabase';
import { extractTextFromFile, createChunks } from '../lib/documentProcessor';
import BiasHallucinationGraph from './BiasHallucinationGraph';
import ConfidenceQualityGraph from './ConfidenceQualityGraph';
import DataPrivacyDashboard from './DataPrivacyDashboard';
import PromptMetricsTrend from './PromptMetricsTrend';
import ChunkingStrategyComparison from './ChunkingStrategyComparison';

interface ChunkingResult {
  strategy: string;
  strategyNumber: string;
  accuracy: number;
  response: string;
  loading: boolean;
  error: string | null;
  context: string;
  exactMatch?: boolean;
}

interface MetricsDashboardProps {
  documents: Document[];
  selectedRole: string;
  selectedDepartmentId: string;
  departments: any[];
  personas: any[];
  allPersonas: any[];
  onDepartmentChange: (deptId: string) => void;
  onRoleChange: (role: string) => void;
  getDepartmentColor: (deptName: string) => string;
  userPrompt: string;
  triggerEvaluation: boolean;
  onEvaluationComplete: () => void;
  currentResponse: string;
  currentContext: string;
  triggerBiasAnalysis: boolean;
  currentExactMatch?: boolean;
  onBiasAnalysisComplete: (analysis: BiasHallucinationAnalysis) => void;
  triggerMetricsRefresh: boolean;
  onMetricsRefreshComplete: () => void;
  currentPromptId: string | null;
  onChunkingStrategyScores?: (scores: ChunkingStrategyScore[]) => void;
  onChunkingResultsUpdate?: (results: ChunkingResult[]) => void;
  onStrategySelect?: (strategyData: { strategy: string; strategyNumber: string; accuracy: number; response: string; context: string; exactMatch?: boolean }) => void;
  onSetActiveStrategy?: (strategyNumber: string) => void;
  currentActiveStrategy?: string;
  chunkingResultsFromChat?: ChunkingResult[];
  onStrategyActivated?: () => void;
  lastSubmittedPrompt?: string;
}

const CHUNKING_STRATEGIES = [
  { number: '1', name: 'Fixed-Size Chunking' },
  { number: '2', name: 'Sentence-Based Chunking' },
  { number: '3', name: 'Paragraph-Based Chunking' },
  { number: '4', name: 'Semantic Chunking' },
  { number: '5', name: 'Recursive Chunking' },
  { number: '6', name: 'Document Structure-Aware' },
  { number: '7', name: 'Token-Based Chunking' },
  { number: '8', name: 'Sliding Window' },
  { number: '9', name: 'Hybrid Approaches' },
];

export default function MetricsDashboard({
  documents,
  selectedRole,
  selectedDepartmentId,
  userPrompt,
  triggerEvaluation,
  onEvaluationComplete,
  currentResponse,
  currentContext,
  triggerBiasAnalysis,
  currentExactMatch,
  onBiasAnalysisComplete,
  triggerMetricsRefresh,
  onMetricsRefreshComplete,
  currentPromptId,
  onChunkingStrategyScores,
  onChunkingResultsUpdate,
  onStrategySelect,
  onSetActiveStrategy,
  currentActiveStrategy,
  chunkingResultsFromChat,
  onStrategyActivated,
  lastSubmittedPrompt
}: MetricsDashboardProps) {
  const [results, setResults] = useState<ChunkingResult[]>(initializeResults());
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showDetailsFor, setShowDetailsFor] = useState<string | null>(null);
  const [biasAnalysis, setBiasAnalysis] = useState<BiasHallucinationAnalysis | null>(null);
  const [isAnalyzingBias, setIsAnalyzingBias] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [strategyJustActivated, setStrategyJustActivated] = useState(false);
  const [historicalData, setHistoricalData] = useState<Array<{
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
  }>>([]);
  const [promptConfidenceData, setPromptConfidenceData] = useState<Array<{
    id: string;
    prompt: string;
    confidence: number;
    bias_score: number;
    hallucination_score: number;
    drift_score: number;
    created_at: string;
  }>>([]);

  function initializeResults(): ChunkingResult[] {
    return CHUNKING_STRATEGIES.map((strategy) => ({
      strategy: strategy.name,
      strategyNumber: strategy.number,
      accuracy: 0,
      response: '',
      loading: false,
      error: null,
      context: '',
    }));
  }

  useEffect(() => {
    loadHistoricalData();
    loadPromptConfidenceData();
  }, []);

  useEffect(() => {
    loadHistoricalData();
    loadPromptConfidenceData();
  }, [currentActiveStrategy]);

  useEffect(() => {
    if (onChunkingResultsUpdate) {
      onChunkingResultsUpdate(results);
    }
  }, [results]);

  // Use chunking results from Chat tab when available
  useEffect(() => {
    if (chunkingResultsFromChat && chunkingResultsFromChat.length > 0) {
      const hasResults = chunkingResultsFromChat.some(r => r.accuracy > 0 || r.loading || r.error);
      if (hasResults) {
        console.log('📊 Using chunking results from Chat tab:', chunkingResultsFromChat);
        setResults(chunkingResultsFromChat);
        setIsProcessing(chunkingResultsFromChat.some(r => r.loading));
      }
    }
  }, [chunkingResultsFromChat]);

  async function loadHistoricalData() {
    const data = await getHistoricalBiasMetrics(30, currentActiveStrategy);
    setHistoricalData(data);
  }

  async function loadPromptConfidenceData() {
    const data = await getPromptConfidenceHistory();
    setPromptConfidenceData(data);
  }

  useEffect(() => {
    // Only evaluate if explicitly requested AND no results from Chat tab are available
    if (triggerEvaluation && userPrompt.trim() && selectedRole) {
      const hasResultsFromChat = chunkingResultsFromChat && chunkingResultsFromChat.some(r => r.accuracy > 0);
      if (!hasResultsFromChat) {
        (async () => {
          console.log('📊 Evaluating strategies from Metrics tab (no Chat results available)');
          await handleSubmitComparison();
          onEvaluationComplete();
        })();
      } else {
        console.log('✓ Using existing results from Chat tab, skipping re-evaluation');
        onEvaluationComplete();
      }
    }
  }, [triggerEvaluation]);

  useEffect(() => {
    if (triggerBiasAnalysis && userPrompt && currentResponse) {
      performBiasAnalysis();
    }
  }, [triggerBiasAnalysis]);

  useEffect(() => {
    if (triggerMetricsRefresh) {
      (async () => {
        await loadHistoricalData();
        await loadPromptConfidenceData();
        onMetricsRefreshComplete();
      })();
    }
  }, [triggerMetricsRefresh]);

  const performBiasAnalysis = async () => {
    setIsAnalyzingBias(true);
    try {
      const result = await analyzeBiasAndHallucination(userPrompt, currentResponse, currentContext, currentExactMatch || false);
      setBiasAnalysis(result);
      onBiasAnalysisComplete(result);

      if (currentPromptId) {
        await updatePromptBiasAnalysis(
          currentPromptId,
          result.biasScore,
          result.hallucinationScore,
          result.biasAnalysis,
          result.hallucinationAnalysis,
          result.driftScore,
          result.driftAnalysis
        );
      }

      // Now that we have a prompt evaluation, load historical data
      await Promise.all([loadHistoricalData(), loadPromptConfidenceData()]);
    } catch (error) {
      console.error('Error analyzing bias and hallucination:', error);
    } finally {
      setIsAnalyzingBias(false);
    }
  };

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
      console.warn('⚠️  calculateConfidenceScore called with empty array');
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
      console.warn('⚠️  Weighted average is 0');
      return 0.25;
    }

    // Enhanced transformation for better score distribution
    // Cosine similarity typically ranges from 0.1-0.9 for relevant docs
    // We want to map this to 30%-98% confidence range
    const transformedScore = Math.pow(weightedAvg, 0.7) * 1.3;

    // Ensure score is in reasonable range (30% - 98%)
    const finalConfidence = Math.max(0.30, Math.min(0.98, transformedScore));

    console.log(`   📊 Confidence calc: weighted=${weightedAvg.toFixed(4)} → transformed=${transformedScore.toFixed(4)} → final=${(finalConfidence * 100).toFixed(1)}%`);

    return finalConfidence;
  };

  const processStrategyInRealTime = async (
    strategyNumber: string,
    prompt: string,
    departmentId: string
  ): Promise<{ accuracy: number; response: string; error: string | null; context: string; exactMatch?: boolean }> => {
    try {
      console.log(`\n🔄 Strategy ${strategyNumber}: Generating query embedding...`);
      const queryEmbedding = await generateEmbedding(prompt);

      if (!queryEmbedding || queryEmbedding.length === 0) {
        console.error(`❌ Strategy ${strategyNumber}: Failed to generate query embedding`);
        return {
          accuracy: 0,
          response: 'Failed to generate query embedding.',
          error: 'Embedding generation failed',
          context: '',
        };
      }

      console.log(`✓ Strategy ${strategyNumber}: Query embedding generated (${queryEmbedding.length} dimensions)`);

      console.log(`🔄 Strategy ${strategyNumber}: Loading documents...`);
      const docsToProcess = departmentId
        ? await getAllDocuments(null, departmentId)
        : await getAllDocuments();

      console.log(`✓ Strategy ${strategyNumber}: Loaded ${docsToProcess.length} documents`);

      if (docsToProcess.length === 0) {
        console.warn(`⚠️  Strategy ${strategyNumber}: No documents found`);
        return {
          accuracy: 0,
          response: 'No documents available for this strategy.',
          error: null,
          context: '',
        };
      }

      // Log document details
      const docsWithContent = docsToProcess.filter(d => d.file_content);
      console.log(`   Strategy ${strategyNumber}: ${docsWithContent.length}/${docsToProcess.length} documents have content`);

      if (docsWithContent.length === 0) {
        console.error(`❌ Strategy ${strategyNumber}: No documents have content!`);
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

      console.log(`🔄 Strategy ${strategyNumber}: Creating chunks...`);

      for (const doc of docsToProcess) {
        if (!doc.file_content) {
          console.warn(`   ⚠️  Skipping ${doc.filename} - no content`);
          continue;
        }

        const chunks = createChunks(doc.file_content, strategyNumber);
        console.log(`   📄 ${doc.filename}: Created ${chunks.length} chunks (strategy ${strategyNumber})`);

        if (chunks.length === 0) {
          console.warn(`   ⚠️  ${doc.filename}: createChunks returned 0 chunks!`);
        }

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

      console.log(`🔄 Strategy ${strategyNumber}: Processing ${chunkPromises.length} chunk embeddings...`);
      const processedChunks = await Promise.all(chunkPromises);

      let nullChunks = 0;
      for (const chunk of processedChunks) {
        if (chunk !== null) {
          allChunksWithSimilarity.push(chunk);
        } else {
          nullChunks++;
        }
      }

      console.log(`✓ Strategy ${strategyNumber}: Processed ${allChunksWithSimilarity.length} chunks successfully (${nullChunks} failed)`);

      if (allChunksWithSimilarity.length === 0) {
        console.error(`❌ Strategy ${strategyNumber}: No chunks could be processed!`);
        return {
          accuracy: 0,
          response: 'No chunks could be processed for this strategy.',
          error: 'Chunk processing failed',
          context: '',
        };
      }

      // Log similarity distribution
      const sortedSims = [...allChunksWithSimilarity].sort((a, b) => b.similarity - a.similarity);
      const topFiveSims = sortedSims.slice(0, 5).map(c => c.similarity);
      console.log(`   Strategy ${strategyNumber}: Top 5 similarities: [${topFiveSims.map(s => s.toFixed(4)).join(', ')}]`);

      // Sort by similarity and take top chunks
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

      // Remove near-duplicate chunks
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
        console.warn(`   Strategy ${strategyNumber} → No chunks after deduplication`);
        return {
          accuracy: 0.25,
          response: 'Unable to generate a confident response with this chunking strategy.',
          error: null,
          context: '',
        };
      }

      // Calculate confidence from top chunks
      const topSimilarities = topChunks.slice(0, 3).map(c => c.similarity);

      // Log raw similarities for debugging
      console.log(`   Strategy ${strategyNumber} → Found ${allChunksWithSimilarity.length} chunks | ${relevantChunks.length} relevant | ${uniqueChunks.length} unique`);
      console.log(`   Strategy ${strategyNumber} → Raw top similarities: [${topSimilarities.map(s => s.toFixed(4)).join(', ')}]`);

      // Calculate confidence with better handling
      let calculatedConfidence = 0;
      if (topSimilarities.length > 0) {
        // Use weighted average with exponential boost for better scores
        const weights = [0.5, 0.3, 0.2];
        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < Math.min(topSimilarities.length, weights.length); i++) {
          weightedSum += topSimilarities[i] * weights[i];
          totalWeight += weights[i];
        }

        const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;

        // Enhanced transformation: boost scores to more intuitive range
        const transformedScore = Math.pow(weightedAvg, 0.7) * 1.3;

        // Ensure score is in reasonable range (30% - 98%)
        calculatedConfidence = Math.max(0.30, Math.min(0.98, transformedScore));

        console.log(`   Strategy ${strategyNumber} → Weighted avg: ${weightedAvg.toFixed(4)} → Transformed: ${calculatedConfidence.toFixed(4)} (${(calculatedConfidence * 100).toFixed(1)}%)`);
      } else {
        calculatedConfidence = 0.25;
        console.warn(`   Strategy ${strategyNumber} → No similarities to calculate confidence`);
      }

      // Use top 3 for context
      const contextChunks = topChunks.slice(0, 3);
      const accuracyScores = contextChunks.map(chunk => chunk.similarity);
      const context = contextChunks
        .map((chunk, idx) => `[Document ${idx + 1}: ${chunk.filename}]\n${chunk.text}`)
        .join('\n\n---\n\n');

      const { response, exactMatch } = await getLLMResponse(prompt, selectedRole, context, accuracyScores);

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
      console.error(`Error processing strategy ${strategyNumber}:`, error);
      return {
        accuracy: 0,
        response: '',
        error: error.message || 'An error occurred',
        context: '',
      };
    }
  };

  const handleSubmitComparison = async () => {
    if (!userPrompt.trim()) {
      return;
    }

    if (!selectedRole) {
      return;
    }

    if (documents.length === 0) {
      return;
    }

    setIsProcessing(true);
    const initialResults = initializeResults();
    setResults(initialResults);
    setSelectedStrategy(null);

    setResults((prev) =>
      prev.map((result) => ({ ...result, loading: true }))
    );

    const strategyPromises = CHUNKING_STRATEGIES.map((strategy, index) =>
      processStrategyInRealTime(
        strategy.number,
        userPrompt,
        selectedDepartmentId
      ).then((strategyResult) => {
        setResults((prev) =>
          prev.map((result, idx) =>
            idx === index
              ? {
                  ...result,
                  accuracy: strategyResult.accuracy,
                  response: strategyResult.response,
                  error: strategyResult.error,
                  loading: false,
                  context: strategyResult.context,
                  exactMatch: strategyResult.exactMatch,
                }
              : result
          )
        );
        return strategyResult;
      }).catch((error: any) => {
        console.error(`Error processing strategy ${strategy.number}:`, error);

        setResults((prev) =>
          prev.map((result, idx) =>
            idx === index
              ? {
                  ...result,
                  accuracy: 0,
                  response: '',
                  error: error.message || 'An error occurred',
                  loading: false,
                }
              : result
          )
        );
        return null;
      })
    );

    await Promise.all(strategyPromises);

    setIsProcessing(false);

    // Load historical data now that we have completed an evaluation
    await Promise.all([loadHistoricalData(), loadPromptConfidenceData()]);

    if (onChunkingStrategyScores) {
      setResults((currentResults) => {
        const chunkingScores: ChunkingStrategyScore[] = currentResults.map((result, index) => ({
          strategy: CHUNKING_STRATEGIES[index].number,
          name: CHUNKING_STRATEGIES[index].name,
          score: result.accuracy
        }));
        onChunkingStrategyScores(chunkingScores);

        const sortedForDisplay = [...currentResults].sort((a, b) => b.accuracy - a.accuracy);
        console.log('\n📊 CHUNKING STRATEGY EVALUATION COMPLETE!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🏆 RANKED RESULTS (High to Low):');
        console.log('═══════════════════════════════════════════════════════════');
        sortedForDisplay.forEach((result, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
          const bar = '█'.repeat(Math.floor(result.accuracy * 20));
          console.log(`${medal} #${idx + 1}: Strategy ${result.strategyNumber} - ${result.strategy}`);
          console.log(`     Confidence: ${(result.accuracy * 100).toFixed(1)}% ${bar}`);
        });
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`🏆 Best Strategy: ${sortedForDisplay[0].strategy} (${(sortedForDisplay[0].accuracy * 100).toFixed(1)}%)`);
        console.log('\n💡 Go to the METRICS tab to:');
        console.log('   • View all strategy confidence scores');
        console.log('   • Select any strategy to see its response');
        console.log('   • Set the best strategy as your active default');
        console.log('═══════════════════════════════════════════════════════════\n');

        return currentResults;
      });
    }
  };

  const sortedResults = [...results].sort((a, b) => b.accuracy - a.accuracy);

  const handleSetActiveStrategyInternal = async (strategyNumber: string) => {
    if (onSetActiveStrategy) onSetActiveStrategy(strategyNumber);

    setStrategyJustActivated(true);
    setIsRecalculating(true);
    try {
      const result = await recalculateAllMetrics();
      if (result.success) {
        await Promise.all([loadHistoricalData(), loadPromptConfidenceData()]);
      }
    } catch (error) {
      console.error('Error during auto-recalculation:', error);
    } finally {
      setIsRecalculating(false);
    }

    if (onStrategyActivated) {
      onStrategyActivated();
    }

    setTimeout(() => setStrategyJustActivated(false), 3000);
  };

  const handleSelectStrategy = (strategyNumber: string) => {
    setSelectedStrategy(strategyNumber);
    const selectedResult = results.find(r => r.strategyNumber === strategyNumber);
    if (selectedResult && onStrategySelect) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 STRATEGY SELECTION FROM METRICS TAB');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Strategy: ${selectedResult.strategy}`);
      console.log(`Number: ${selectedResult.strategyNumber}`);
      console.log(`Confidence: ${(selectedResult.accuracy * 100).toFixed(1)}%`);
      console.log(`Response Length: ${selectedResult.response.length} characters`);
      console.log('───────────────────────────────────────────────────────');
      console.log('✅ Applying strategy to Chat tab...');
      console.log('✅ Switching to Chat tab to display results...');
      console.log('═══════════════════════════════════════════════════════');

      onStrategySelect({
        strategy: selectedResult.strategy,
        strategyNumber: selectedResult.strategyNumber,
        accuracy: selectedResult.accuracy,
        response: selectedResult.response,
        context: selectedResult.context,
        exactMatch: selectedResult.exactMatch,
      });
    }
  };

  const getScoreColor = (score: number): string => {
    if (score < 0.3) return '#10b981';
    if (score < 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number): string => {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Moderate';
    return 'High';
  };

  const getScoreIcon = (score: number) => {
    if (score < 0.3) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score < 0.6) return <AlertCircle className="w-5 h-5 text-orange-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const calculateConfidence = () => {
    if (results.length === 0) return 0;
    const topResult = results.reduce((prev, current) =>
      (current.accuracy > prev.accuracy) ? current : prev
    , results[0]);
    return topResult.accuracy;
  };

  const handleRecalculateAllMetrics = async () => {
    if (isRecalculating) return;

    const confirmed = window.confirm(
      'This will recalculate bias, drift, and hallucination metrics for ALL prompts based on their confidence scores.\n\n' +
      'Formula: Confidence + Bias + Drift + Hallucination = 100%\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsRecalculating(true);

    try {
      const result = await recalculateAllMetrics();

      if (result.success) {
        await Promise.all([loadHistoricalData(), loadPromptConfidenceData()]);

        alert(
          `Metrics recalculation complete!\n\n` +
          `✓ Successfully updated: ${result.updated} prompt(s)\n` +
          `${result.errors > 0 ? `✗ Errors: ${result.errors} prompt(s)` : ''}`
        );
      } else {
        alert('Failed to recalculate metrics. Please try again.');
      }
    } catch (error) {
      console.error('Error during recalculation:', error);
      alert('An error occurred during recalculation. Please try again.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const currentConfidence = calculateConfidence();

  // Check if we have evaluated any prompt yet
  const hasEvaluatedPrompt = userPrompt && currentResponse && results.some(r => r.accuracy > 0);

  // Calculate the actual confidence from accuracy scores
  const avgAccuracy = hasEvaluatedPrompt && results.length > 0
    ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
    : 0;

  const actualConfidence = hasEvaluatedPrompt ? avgAccuracy : 0;
  const remainingQuality = 1 - actualConfidence;

  // Calculate metrics to ensure total = 100% - but only if we have evaluated a prompt
  const calculatedBias = hasEvaluatedPrompt
    ? (biasAnalysis?.biasScore > 0 ? biasAnalysis.biasScore : remainingQuality * 0.40)
    : 0;
  const calculatedDrift = hasEvaluatedPrompt
    ? (biasAnalysis?.driftScore > 0 ? biasAnalysis.driftScore : remainingQuality * 0.30)
    : 0;
  const calculatedHallucination = hasEvaluatedPrompt
    ? (biasAnalysis?.hallucinationScore > 0 ? biasAnalysis.hallucinationScore : remainingQuality * 0.30)
    : 0;

  return (
    <div className="space-y-6">
      {/* Historical Line Graphs for Bias, Hallucination, and Drift */}
      <BiasHallucinationGraph data={historicalData} />

      {/* Data Privacy Dashboard */}
      <DataPrivacyDashboard />

      {/* Current Prompt Metrics Trend */}
      <PromptMetricsTrend
        confidence={hasEvaluatedPrompt && currentConfidence > 0 ? currentConfidence : 0}
        biasScore={hasEvaluatedPrompt ? calculatedBias : 0}
        hallucinationScore={hasEvaluatedPrompt ? calculatedHallucination : 0}
        driftScore={hasEvaluatedPrompt ? calculatedDrift : 0}
        accuracyScores={hasEvaluatedPrompt ? results.map(r => r.accuracy) : []}
        historicalData={historicalData}
      />

      {/* Additional Historical Graphs */}
      <div className="grid grid-cols-1 gap-6">
        <ConfidenceQualityGraph data={historicalData} />
      </div>

      {/* Recalculate Button */}
      <div className={`bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border-2 transition-all duration-500 ${strategyJustActivated ? 'border-emerald-500 shadow-emerald-500/30' : 'border-slate-700'}`}>
        {strategyJustActivated && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-sm text-emerald-400 font-medium">
              New strategy activated — recalculating metrics and re-submitting last prompt...
            </span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-xl shadow-lg">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Metrics Recalculation</h3>
              <p className="text-xs text-slate-400">
                Recalculate bias, drift, and hallucination for all prompts based on confidence scores
              </p>
            </div>
          </div>
          <button
            onClick={handleRecalculateAllMetrics}
            disabled={isRecalculating || historicalData.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isRecalculating || historicalData.length === 0
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:scale-105'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate All Metrics'}
          </button>
        </div>
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-300 mb-2">
            <span className="font-semibold text-emerald-400">Formula:</span> Confidence + Bias (40%) + Drift (30%) + Hallucination (30%) = 100%
          </p>
          <p className="text-xs text-slate-400">
            Example: If confidence is 85%, the remaining 15% is distributed as: Bias 6%, Drift 4.5%, Hallucination 4.5%
          </p>
        </div>
      </div>

      {/* Chunking Strategy Comparison - Bottom of Page */}
      <ChunkingStrategyComparison
        results={results}
        isProcessing={isProcessing}
        selectedStrategy={selectedStrategy}
        currentActiveStrategy={currentActiveStrategy}
        onSelectStrategy={handleSelectStrategy}
        onSetActiveStrategy={handleSetActiveStrategyInternal}
      />
    </div>
  );
}
