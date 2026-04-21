import { CheckCircle, Loader, TrendingUp, Star } from 'lucide-react';

interface ChunkingStrategyResult {
  strategy: string;
  strategyNumber: string;
  accuracy: number;
  response: string;
  loading: boolean;
  error: string | null;
  context: string;
}

interface ChunkingStrategySelectorProps {
  results: ChunkingStrategyResult[];
  selectedStrategy: string | null;
  onSelectStrategy: (strategyNumber: string) => void;
  isProcessing: boolean;
  activeStrategy?: string;
  onSetActiveStrategy?: (strategyNumber: string) => void;
}

const STRATEGY_NAMES: Record<string, string> = {
  '1': 'Fixed-Size',
  '2': 'Sentence-Based',
  '3': 'Paragraph-Based',
  '4': 'Semantic',
  '5': 'Recursive',
  '6': 'Structure-Aware',
  '7': 'Token-Based',
  '8': 'Sliding Window',
  '9': 'Hybrid',
};

export default function ChunkingStrategySelector({
  results,
  selectedStrategy,
  onSelectStrategy,
  isProcessing,
  activeStrategy,
  onSetActiveStrategy,
}: ChunkingStrategySelectorProps) {
  const sortedResults = [...results].sort((a, b) => b.accuracy - a.accuracy);
  const topStrategy = sortedResults[0];
  const hasAnyResults = results.some(r => r.accuracy > 0);

  const getConfidenceColor = (accuracy: number): string => {
    if (accuracy === 0) return 'from-slate-400 to-slate-500';
    if (accuracy >= 0.8) return 'from-green-500 to-emerald-600';
    if (accuracy >= 0.6) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  const getConfidenceBgColor = (accuracy: number): string => {
    if (accuracy === 0) return 'bg-slate-50 border-slate-200';
    if (accuracy >= 0.8) return 'bg-green-50 border-green-200';
    if (accuracy >= 0.6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const completedCount = results.filter(r => !r.loading && !r.error && r.accuracy > 0).length;
  const processingCount = results.filter(r => r.loading).length;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg p-4 border-2 border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Chunking Strategy Analysis</h2>
            <p className="text-xs text-slate-600">
              {isProcessing ? (
                <span className="flex items-center gap-1">
                  <Loader className="w-3 h-3 animate-spin" />
                  Processing {processingCount} strategies...
                </span>
              ) : (
                <span>{completedCount} of 9 strategies evaluated</span>
              )}
            </p>
          </div>
        </div>
        {topStrategy && !topStrategy.loading && hasAnyResults && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-green-700 font-semibold mb-1">Top Strategy</p>
                <p className="text-sm font-bold text-green-900">{STRATEGY_NAMES[topStrategy.strategyNumber]}</p>
                <p className="text-xs text-green-700">{(topStrategy.accuracy * 100).toFixed(1)}% confidence</p>
              </div>
              <div className="flex flex-col gap-1">
                {selectedStrategy !== topStrategy.strategyNumber && (
                  <button
                    onClick={() => onSelectStrategy(topStrategy.strategyNumber)}
                    className="px-2 py-1 rounded text-xs font-bold transition-all bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                  >
                    View
                  </button>
                )}
                {onSetActiveStrategy && activeStrategy !== topStrategy.strategyNumber && (
                  <button
                    onClick={() => onSetActiveStrategy(topStrategy.strategyNumber)}
                    className="px-2 py-1 rounded text-xs font-bold transition-all bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap flex items-center gap-0.5"
                  >
                    <Star className="w-2.5 h-2.5" />
                    Use
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {!hasAnyResults && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg px-3 py-2 shadow-sm">
            <p className="text-xs text-blue-700 font-semibold mb-1">Ready to Analyze</p>
            <p className="text-xs text-blue-700">Submit a prompt to evaluate strategies</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedResults.map((result, index) => {
          const isSelected = selectedStrategy === result.strategyNumber;
          const isActive = activeStrategy === result.strategyNumber;
          const isTop = index === 0 && !result.loading && hasAnyResults && result.accuracy > 0;

          return (
            <div
              key={result.strategyNumber}
              className={`relative border-2 rounded-lg p-3 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : result.loading
                  ? 'border-slate-200 bg-slate-50'
                  : getConfidenceBgColor(result.accuracy)
              }`}
            >
              {isActive && (
                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  ACTIVE
                </div>
              )}
              {isTop && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  TOP
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    {STRATEGY_NAMES[result.strategyNumber]}
                  </h3>
                  <p className="text-xs text-slate-500">Strategy #{result.strategyNumber}</p>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </div>

              {result.loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : result.error ? (
                <div className="py-2">
                  <p className="text-xs text-red-600 font-medium">Error processing</p>
                  <button
                    onClick={() => onSelectStrategy(result.strategyNumber)}
                    disabled={isProcessing}
                    className="mt-2 w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-1.5 px-3 rounded-lg transition-all duration-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">Confidence</span>
                      <span className="text-sm font-bold text-slate-800">
                        {(result.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getConfidenceColor(result.accuracy)} rounded-full transition-all duration-500`}
                        style={{ width: `${result.accuracy * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => onSelectStrategy(result.strategyNumber)}
                      disabled={isProcessing || isSelected || result.accuracy === 0}
                      className={`w-full font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-xs ${
                        isSelected
                          ? 'bg-blue-600 text-white cursor-default'
                          : result.accuracy === 0
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                      }`}
                    >
                      {isSelected ? 'Selected' : result.accuracy === 0 ? 'Not Evaluated' : 'Select'}
                    </button>

                    {onSetActiveStrategy && result.accuracy > 0 && !isActive && (
                      <button
                        onClick={() => onSetActiveStrategy(result.strategyNumber)}
                        disabled={isProcessing}
                        className="w-full font-semibold py-1.5 px-3 rounded-lg transition-all duration-200 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        Set as Active
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!hasAnyResults && !isProcessing && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">How it works:</span> Submit a prompt in the chat above, and all 9 chunking strategies will be automatically evaluated.
            You can then select the best performing strategy to use its results.
          </p>
        </div>
      )}
      {!isProcessing && completedCount > 0 && hasAnyResults && (
        <div className="mt-4 space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Select Strategy:</span> Click "Select" to view a strategy's response and metrics in the chat results above.
            </p>
          </div>
          {onSetActiveStrategy && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Set as Active:</span> Click "Set as Active" to make a strategy the default for all new prompts.
                The active strategy is marked with a <Star className="w-3 h-3 inline fill-amber-600 text-amber-600" /> icon.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
