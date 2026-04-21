import { TrendingUp, Calendar } from 'lucide-react';

interface HistoricalDataPoint {
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
}

interface ConfidenceQualityGraphProps {
  data: HistoricalDataPoint[];
}

export default function ConfidenceQualityGraph({ data }: ConfidenceQualityGraphProps) {

  if (data.length < 2) {
    return null;
  }

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dataWithMetrics = data.map(point => {
    const maxAccuracy = point.accuracy_scores && point.accuracy_scores.length > 0
      ? Math.max(...point.accuracy_scores)
      : 0;
    const quality = ((1 - point.bias_score) + (1 - point.hallucination_score) + maxAccuracy) / 3;

    return {
      ...point,
      confidence: maxAccuracy,
      quality: quality
    };
  });

  const avgConfidence = dataWithMetrics.reduce((sum, d) => sum + d.confidence, 0) / dataWithMetrics.length;
  const avgQuality = dataWithMetrics.reduce((sum, d) => sum + d.quality, 0) / dataWithMetrics.length;

  const getPerformanceLevel = (value: number) => {
    if (value >= 0.80) return { label: 'Excellent', color: 'text-emerald-400' };
    if (value >= 0.60) return { label: 'Good', color: 'text-blue-400' };
    if (value >= 0.40) return { label: 'Fair', color: 'text-yellow-400' };
    return { label: 'Needs Improvement', color: 'text-red-400' };
  };

  const chartHeight = 320;
  const chartWidth = Math.max(1000, dataWithMetrics.length * 80);
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    return padding.left + (index / Math.max(dataWithMetrics.length - 1, 1)) * graphWidth;
  };

  const getY = (score: number) => {
    return padding.top + graphHeight - (score * graphHeight);
  };

  const createPath = (scores: number[]) => {
    if (scores.length === 0) return '';

    let path = `M ${getX(0)} ${getY(scores[0])}`;
    for (let i = 1; i < scores.length; i++) {
      path += ` L ${getX(i)} ${getY(scores[i])}`;
    }
    return path;
  };

  const confidencePath = createPath(dataWithMetrics.map(d => d.confidence));
  const qualityPath = createPath(dataWithMetrics.map(d => d.quality));

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border-2 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 p-3 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Airport AI Confidence & Quality Trends</h2>
              <p className="text-xs text-slate-400">Historical airport operations performance metrics (0-100% scale)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Analyzed</p>
            <p className="text-2xl font-bold text-white">{dataWithMetrics.length}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"></div>
                <span className="text-xs font-semibold text-slate-300">Confidence Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50"></div>
                <span className="text-xs font-semibold text-slate-300">Overall Quality</span>
              </div>
            </div>
            <div className="text-xs text-slate-400">Higher is better</div>
          </div>
          <div className="text-xs text-slate-500 mb-3 sm:hidden">Swipe left to see more data</div>

          <div className="relative overflow-x-auto overflow-y-hidden -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800" style={{ height: `${chartHeight + 20}px` }}>
            <svg width={chartWidth} height={chartHeight} className="overflow-visible min-w-full" style={{ minWidth: `${chartWidth}px` }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="qualityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <filter id="glowPositive">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={getY(tick)}
                    x2={padding.left + graphWidth}
                    y2={getY(tick)}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                  <text
                    x={padding.left - 10}
                    y={getY(tick)}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-slate-500"
                  >
                    {(tick * 100).toFixed(0)}%
                  </text>
                </g>
              ))}

              <path
                d={`${confidencePath} L ${getX(dataWithMetrics.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
                fill="url(#confidenceGradient)"
                opacity="0.2"
              />

              <path
                d={confidencePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowPositive)"
              />

              <path
                d={`${qualityPath} L ${getX(dataWithMetrics.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
                fill="url(#qualityGradient)"
                opacity="0.2"
              />

              <path
                d={qualityPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowPositive)"
              />

              {dataWithMetrics.map((point, index) => {
                const x = getX(index);
                const showLabel = dataWithMetrics.length <= 10 || index % Math.ceil(dataWithMetrics.length / 8) === 0 || index === dataWithMetrics.length - 1;

                return (
                  <g key={index}>
                    {showLabel && (
                      <text
                        x={x}
                        y={padding.top + graphHeight + 20}
                        textAnchor="middle"
                        className="text-xs fill-slate-400"
                      >
                        {formatDateShort(point.created_at)}
                      </text>
                    )}

                    <circle
                      cx={x}
                      cy={getY(point.confidence)}
                      r="5"
                      fill="#10b981"
                      stroke="#1e293b"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
                    >
                      <title>Confidence: {(point.confidence * 100).toFixed(1)}%</title>
                    </circle>

                    <circle
                      cx={x}
                      cy={getY(point.quality)}
                      r="5"
                      fill="#06b6d4"
                      stroke="#1e293b"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))' }}
                    >
                      <title>Quality: {(point.quality * 100).toFixed(1)}%</title>
                    </circle>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-6 border-2 border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">Average Confidence</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-800 ${getPerformanceLevel(avgConfidence).color}`}>
                  {getPerformanceLevel(avgConfidence).label}
                </span>
              </div>
              <p className="text-4xl font-bold text-emerald-400">
                {(avgConfidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Based on maximum accuracy scores from retrieval results
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-6 border-2 border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">Overall Quality Score</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-800 ${getPerformanceLevel(avgQuality).color}`}>
                  {getPerformanceLevel(avgQuality).label}
                </span>
              </div>
              <p className="text-4xl font-bold text-cyan-400">
                {(avgQuality * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Combined metric: confidence, bias reduction, and accuracy
              </p>
            </div>
          </div>

          <div className="mt-4 bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <h3 className="text-xs font-bold text-slate-300 mb-2">Quality Score Calculation</h3>
            <p className="text-xs text-slate-400">
              Overall Quality = (Confidence + (1 - Bias) + (1 - Hallucination)) ÷ 3
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This composite metric balances high confidence with low bias and minimal hallucinations
            </p>
          </div>
        </div>
      </div>
  );
}
