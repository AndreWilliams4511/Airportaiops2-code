import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, AlertCircle, TrendingUp, Sparkles, Eye, Star, Info } from 'lucide-react';

interface ChunkingResult {
  strategy: string;
  strategyNumber: string;
  accuracy: number;
  response: string;
  loading: boolean;
  error: string | null;
  context: string;
}

interface ChunkingStrategyComparisonProps {
  results: ChunkingResult[];
  isProcessing: boolean;
  selectedStrategy: string | null;
  currentActiveStrategy?: string;
  onSelectStrategy: (strategyNumber: string) => void;
  onSetActiveStrategy?: (strategyNumber: string) => void;
}

export default function ChunkingStrategyComparison({
  results,
  isProcessing,
  selectedStrategy,
  currentActiveStrategy,
  onSelectStrategy,
  onSetActiveStrategy
}: ChunkingStrategyComparisonProps) {
  const [processingCount, setProcessingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const loading = results.filter(r => r.loading).length;
    const completed = results.filter(r => !r.loading && (r.accuracy > 0 || r.error)).length;
    setProcessingCount(loading);
    setCompletedCount(completed);
  }, [results]);

  const sortedResults = [...results].sort((a, b) => b.accuracy - a.accuracy);
  const topResult = sortedResults[0];
  const hasResults = results.some(r => r.accuracy > 0);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.75) return 'from-green-500 to-green-600';
    if (accuracy >= 0.5) return 'from-yellow-500 to-yellow-600';
    if (accuracy > 0) return 'from-red-500 to-red-600';
    return 'from-slate-400 to-slate-500';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 0.75) return 'bg-green-100 text-green-700';
    if (accuracy >= 0.5) return 'bg-yellow-100 text-yellow-700';
    if (accuracy > 0) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-6">
      {/* Mini Dashboard Summary */}
      {hasResults && !isProcessing && (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-xl shadow-lg p-6 border-2 border-slate-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Strategy Confidence Overview</h3>
              <p className="text-xs text-slate-600">All 9 chunking strategies evaluated - Ranked by confidence score</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 gap-2">
              {sortedResults.slice(0, 9).map((result, index) => (
                <div
                  key={result.strategyNumber}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    index < 3
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200'
                      : 'bg-slate-50 border border-slate-200'
                  } ${selectedStrategy === result.strategyNumber ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 min-w-[60px]">
                      {index === 0 && <span className="text-lg">🥇</span>}
                      {index === 1 && <span className="text-lg">🥈</span>}
                      {index === 2 && <span className="text-lg">🥉</span>}
                      {index > 2 && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        Strategy {result.strategyNumber}
                      </p>
                      <p className="text-xs text-slate-600">{result.strategy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right min-w-[80px]">
                      <div className={`text-lg font-bold ${
                        result.accuracy >= 0.75 ? 'text-green-600' :
                        result.accuracy >= 0.5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(result.accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log(`📊 Selecting Strategy ${result.strategyNumber}: ${result.strategy}`);
                        console.log(`   Confidence: ${(result.accuracy * 100).toFixed(1)}%`);
                        console.log('   → Updating Chat tab with this strategy\'s response...');
                        onSelectStrategy(result.strategyNumber);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap ${
                        selectedStrategy === result.strategyNumber
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800'
                      }`}
                    >
                      {selectedStrategy === result.strategyNumber ? 'Selected ✓' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              <span className="font-bold">How to use:</span> Click "Select" to view any strategy's response in the Chat tab.
              Click "Set as Active" below to make it your default strategy for future prompts.
            </p>
          </div>
        </div>
      )}

      {topResult && topResult.accuracy > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-emerald-300">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-emerald-900">Top Performing Strategy</h3>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RANK #1
                  </span>
                </div>
                <p className="text-sm text-emerald-700">Highest confidence score of all 9 strategies</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-2xl ${getAccuracyBg(topResult.accuracy)}`}>
              {(topResult.accuracy * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900 mb-1">
                  Strategy {topResult.strategyNumber}: {topResult.strategy}
                </p>
                <p className="text-xs text-emerald-700">
                  This strategy achieved the highest confidence score for your prompt
                </p>
              </div>
              <div className="flex gap-2">
                {selectedStrategy !== topResult.strategyNumber && (
                  <button
                    onClick={() => {
                      console.log(`🥇 Selecting TOP STRATEGY: ${topResult.strategy} (#${topResult.strategyNumber})`);
                      console.log(`   Confidence: ${(topResult.accuracy * 100).toFixed(1)}%`);
                      console.log('   → Switching to Chat tab to display the best result...');
                      onSelectStrategy(topResult.strategyNumber);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Best
                  </button>
                )}
                {onSetActiveStrategy && currentActiveStrategy !== topResult.strategyNumber && (
                  <button
                    onClick={() => {
                      console.log(`⭐ Setting ACTIVE STRATEGY: ${topResult.strategy} (#${topResult.strategyNumber})`);
                      console.log(`   This will be the default for all future prompts`);
                      onSetActiveStrategy(topResult.strategyNumber);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Use Best
                  </button>
                )}
                {selectedStrategy === topResult.strategyNumber && currentActiveStrategy === topResult.strategyNumber && (
                  <div className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active & Viewing
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Detailed Strategy Cards</h3>
              <p className="text-xs text-slate-600">Individual performance cards for each chunking strategy</p>
            </div>
          </div>
          {isProcessing && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              Evaluating all 9 strategies...
            </span>
          )}
        </div>

        {!hasResults && !isProcessing && (
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-6 mb-4 border-2 border-blue-300">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900 mb-2">Ready to Evaluate All 9 Strategies</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Submit a prompt in the Chat tab to automatically evaluate all 9 chunking strategies.
                  The system will process your prompt with each strategy and display confidence scores here.
                </p>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-slate-700 font-medium mb-2">What happens next:</p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>All 9 strategies will be evaluated in parallel</li>
                    <li>Each strategy gets a confidence score (0-100%)</li>
                    <li>Results are ranked from highest to lowest</li>
                    <li>You can select any strategy to view its response</li>
                    <li>Set your preferred strategy as the active default</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResults.map((result, index) => (
            <div
              key={result.strategyNumber}
              className={`relative bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-md border-2 p-4 transition-all hover:shadow-xl ${
                selectedStrategy === result.strategyNumber
                  ? 'border-emerald-500 ring-2 ring-emerald-300'
                  : currentActiveStrategy === result.strategyNumber
                  ? 'border-blue-400 ring-2 ring-blue-200'
                  : 'border-slate-200'
              }`}
            >
              {index === 0 && result.accuracy > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  #1 Best
                </div>
              )}
              {index === 1 && result.accuracy > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-slate-400 to-slate-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  #2
                </div>
              )}
              {index === 2 && result.accuracy > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  #3
                </div>
              )}
              {currentActiveStrategy === result.strategyNumber && selectedStrategy !== result.strategyNumber && (
                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Active
                </div>
              )}

              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {result.accuracy > 0 && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Rank #{index + 1}
                    </span>
                  )}
                  <p className="text-xs font-bold text-slate-900">Strategy {result.strategyNumber}</p>
                </div>
                <p className="text-xs text-slate-600 leading-tight h-10 flex items-center justify-center">
                  {result.strategy}
                </p>
              </div>

              {result.loading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-xs text-slate-500">Processing...</p>
                </div>
              ) : result.error ? (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-red-600">Error occurred</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-600 font-medium mb-2 text-center">Confidence Score</p>
                    <div className={`text-3xl font-bold mb-2 text-center bg-gradient-to-r ${getAccuracyColor(result.accuracy)} bg-clip-text text-transparent`}>
                      {(result.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-200">
                      <div
                        className={`h-full transition-all duration-500 bg-gradient-to-r ${getAccuracyColor(result.accuracy)}`}
                        style={{ width: `${result.accuracy * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  {result.accuracy > 0 ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log(`📊 Selecting Strategy ${result.strategyNumber}: ${result.strategy}`);
                          console.log(`   Confidence: ${(result.accuracy * 100).toFixed(1)}%`);
                          console.log('   → Switching to Chat tab...');
                          onSelectStrategy(result.strategyNumber);
                        }}
                        disabled={selectedStrategy === result.strategyNumber}
                        className={`w-full py-3 px-4 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                          selectedStrategy === result.strategyNumber
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-default'
                            : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {selectedStrategy === result.strategyNumber ? 'Selected ✓' : 'Select Strategy'}
                      </button>
                      {onSetActiveStrategy && currentActiveStrategy !== result.strategyNumber && (
                        <button
                          onClick={() => {
                            console.log(`⭐ Setting ACTIVE STRATEGY: ${result.strategy} (#${result.strategyNumber})`);
                            console.log(`   Confidence: ${(result.accuracy * 100).toFixed(1)}%`);
                            console.log('   → This will be used for all future prompts');
                            onSetActiveStrategy(result.strategyNumber);
                          }}
                          className="w-full py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Set as Active
                        </button>
                      )}
                      {currentActiveStrategy === result.strategyNumber && (
                        <div className="w-full py-2 px-4 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-white" />
                          Active Strategy
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 text-center">
                      Awaiting Evaluation
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {hasResults && onSetActiveStrategy && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-700">Select Strategy</p>
              </div>
              <p className="text-xs text-emerald-600">
                Click "Select Strategy" to view that strategy's response and confidence metrics in the Chat tab.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-700">Set as Active</p>
              </div>
              <p className="text-xs text-amber-600">
                Click "Set as Active" to make a strategy the default for all future prompts.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-blue-700">Compare Results</p>
              </div>
              <p className="text-xs text-blue-600">
                Select different strategies to compare their responses and find the best one for your documents.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
