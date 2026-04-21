import { AlertTriangle } from 'lucide-react';

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

interface BiasHallucinationGraphProps {
  data: HistoricalDataPoint[];
}

export default function BiasHallucinationGraph({ data }: BiasHallucinationGraphProps) {

  if (data.length < 2) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dataWithConfidence = data.map(d => {
    const accuracyScores = d.accuracy_scores || [];
    const confidence = accuracyScores.length > 0
      ? accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length
      : 0;
    return { ...d, confidence };
  });

  const avgBias = dataWithConfidence.reduce((sum, d) => sum + d.bias_score, 0) / dataWithConfidence.length;
  const avgHallucination = dataWithConfidence.reduce((sum, d) => sum + d.hallucination_score, 0) / dataWithConfidence.length;
  const avgDrift = dataWithConfidence.reduce((sum, d) => sum + (d.drift_score || 0), 0) / dataWithConfidence.length;
  const avgConfidence = dataWithConfidence.reduce((sum, d) => sum + d.confidence, 0) / dataWithConfidence.length;

  const getStatusColor = (value: number) => {
    if (value <= 0.3) return 'text-emerald-400';
    if (value <= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusLabel = (value: number) => {
    if (value <= 0.3) return 'Excellent';
    if (value <= 0.6) return 'Moderate';
    return 'High';
  };

  const chartHeight = 320;
  const chartWidth = Math.max(1000, data.length * 80);
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const maxScore = Math.max(
    ...dataWithConfidence.map(d => Math.max(d.bias_score, d.hallucination_score, d.drift_score || 0, d.confidence))
  );
  const yScale = maxScore > 0 ? 1 / maxScore : 1;

  const getX = (index: number) => {
    return padding.left + (index / Math.max(data.length - 1, 1)) * graphWidth;
  };

  const getY = (score: number) => {
    return padding.top + graphHeight - (score * yScale * graphHeight);
  };

  const createPath = (scores: number[]) => {
    if (scores.length === 0) return '';

    let path = `M ${getX(0)} ${getY(scores[0])}`;
    for (let i = 1; i < scores.length; i++) {
      path += ` L ${getX(i)} ${getY(scores[i])}`;
    }
    return path;
  };

  const biasPath = createPath(dataWithConfidence.map(d => d.bias_score));
  const hallucinationPath = createPath(dataWithConfidence.map(d => d.hallucination_score));
  const driftPath = createPath(dataWithConfidence.map(d => d.drift_score || 0));
  const confidencePath = createPath(dataWithConfidence.map(d => d.confidence));

  const cumulativeQualityScores = dataWithConfidence.map((_, idx) => {
    const slice = dataWithConfidence.slice(0, idx + 1);
    const cumAvgBias = slice.reduce((s, d) => s + d.bias_score, 0) / slice.length;
    const cumAvgHallucination = slice.reduce((s, d) => s + d.hallucination_score, 0) / slice.length;
    const cumAvgDrift = slice.reduce((s, d) => s + (d.drift_score || 0), 0) / slice.length;
    return ((1 - cumAvgBias) + (1 - cumAvgHallucination) + (1 - cumAvgDrift)) / 3;
  });
  const qualityPath = createPath(cumulativeQualityScores);

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border-2 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-400 to-orange-500 p-3 rounded-xl shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Airport Operations Metrics Trends</h2>
              <p className="text-xs text-slate-400">Historical AI metrics for active chunking strategy (0-100% scale)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Analyzed</p>
            <p className="text-2xl font-bold text-white">{data.length}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-500/50"></div>
                <span className="text-xs font-semibold text-slate-300">Confidence Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 shadow-lg shadow-red-500/50"></div>
                <span className="text-xs font-semibold text-slate-300">Bias Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400 shadow-lg shadow-orange-500/50"></div>
                <span className="text-xs font-semibold text-slate-300">Hallucination Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-500/50"></div>
                <span className="text-xs font-semibold text-slate-300">Drift Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50" style={{ background: 'repeating-linear-gradient(45deg, #67e8f9, #67e8f9 2px, transparent 2px, transparent 4px)' }}></div>
                <span className="text-xs font-semibold text-cyan-300">Cumulative Quality Score</span>
              </div>
            </div>
            <div className="text-xs text-slate-400">Confidence + Bias + Drift + Hallucination = 100%</div>
          </div>
          <div className="text-xs text-slate-500 mb-3 sm:hidden">Swipe left to see more data</div>

          <div className="relative overflow-x-auto overflow-y-hidden -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800" style={{ height: `${chartHeight + 20}px` }}>
            <svg width={chartWidth} height={chartHeight} className="overflow-visible min-w-full" style={{ minWidth: `${chartWidth}px` }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="biasGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="hallucinationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="driftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="qualityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
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
                d={`${confidencePath} L ${getX(data.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
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
                filter="url(#glow)"
              />

              <path
                d={`${biasPath} L ${getX(data.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
                fill="url(#biasGradient)"
                opacity="0.2"
              />

              <path
                d={biasPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              <path
                d={`${hallucinationPath} L ${getX(data.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
                fill="url(#hallucinationGradient)"
                opacity="0.2"
              />

              <path
                d={hallucinationPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              <path
                d={`${driftPath} L ${getX(data.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
                fill="url(#driftGradient)"
                opacity="0.2"
              />

              <path
                d={driftPath}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              <path
                d={`${qualityPath} L ${getX(data.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`}
                fill="url(#qualityGradient)"
                opacity="0.15"
              />

              <path
                d={qualityPath}
                fill="none"
                stroke="#67e8f9"
                strokeWidth="3"
                strokeDasharray="8 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {cumulativeQualityScores.map((score, index) => (
                <circle
                  key={`quality-${index}`}
                  cx={getX(index)}
                  cy={getY(score)}
                  r="5"
                  fill="#67e8f9"
                  stroke="#1e293b"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(103, 232, 249, 0.7))' }}
                >
                  <title>{`Prompt ${index + 1} Cumulative Quality: ${(score * 100).toFixed(1)}% (avg of ${index + 1} prompt${index !== 0 ? 's' : ''})`}</title>
                </circle>
              ))}

              {dataWithConfidence.map((point, index) => {
                const x = getX(index);
                const showLabel = data.length <= 10 || index % Math.ceil(data.length / 8) === 0 || index === data.length - 1;

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
                      cy={getY(point.bias_score)}
                      r="5"
                      fill="#ef4444"
                      stroke="#1e293b"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))' }}
                    >
                      <title>Bias: {(point.bias_score * 100).toFixed(1)}%</title>
                    </circle>

                    <circle
                      cx={x}
                      cy={getY(point.hallucination_score)}
                      r="5"
                      fill="#f97316"
                      stroke="#1e293b"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))' }}
                    >
                      <title>Hallucination: {(point.hallucination_score * 100).toFixed(1)}%</title>
                    </circle>

                    <circle
                      cx={x}
                      cy={getY(point.drift_score || 0)}
                      r="5"
                      fill="#60a5fa"
                      stroke="#1e293b"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.6))' }}
                    >
                      <title>Drift: {((point.drift_score || 0) * 100).toFixed(1)}%</title>
                    </circle>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 bg-gradient-to-r from-cyan-900/40 to-teal-900/40 rounded-xl p-4 border border-cyan-600/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-cyan-300 mb-1">Cumulative Quality Score (Running Avg)</p>
                <p className="text-xs text-slate-400">
                  Calculated as: (1 - Avg Bias) + (1 - Avg Hallucination) + (1 - Avg Drift) / 3, accumulated across all {data.length} prompt{data.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Current</p>
                  <p className={`text-2xl font-black ${cumulativeQualityScores[cumulativeQualityScores.length - 1] >= 0.7 ? 'text-cyan-300' : cumulativeQualityScores[cumulativeQualityScores.length - 1] >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {(cumulativeQualityScores[cumulativeQualityScores.length - 1] * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Peak</p>
                  <p className="text-2xl font-black text-emerald-400">
                    {(Math.max(...cumulativeQualityScores) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Lowest</p>
                  <p className="text-2xl font-black text-orange-400">
                    {(Math.min(...cumulativeQualityScores) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-6 border-2 border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">Average Confidence</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-800 ${getStatusColor(1 - avgConfidence)}`}>
                  {avgConfidence >= 0.7 ? 'High' : avgConfidence >= 0.4 ? 'Medium' : 'Low'}
                </span>
              </div>
              <p className="text-4xl font-bold text-green-400">
                {(avgConfidence * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {avgConfidence >= 0.7 ? 'Excellent confidence - reliable responses' :
                 avgConfidence >= 0.4 ? 'Moderate confidence - acceptable quality' :
                 'Low confidence - needs optimization'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-6 border-2 border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">Average Bias Level</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-800 ${getStatusColor(avgBias)}`}>
                  {getStatusLabel(avgBias)}
                </span>
              </div>
              <p className="text-4xl font-bold text-red-400">
                {(avgBias * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {avgBias <= 0.3 ? 'Minimal bias detected - excellent performance' :
                 avgBias <= 0.6 ? 'Moderate bias levels - room for improvement' :
                 'High bias detected - needs attention'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-6 border-2 border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">Average Hallucination</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-800 ${getStatusColor(avgHallucination)}`}>
                  {getStatusLabel(avgHallucination)}
                </span>
              </div>
              <p className="text-4xl font-bold text-orange-400">
                {(avgHallucination * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {avgHallucination <= 0.3 ? 'Minimal hallucinations - highly accurate' :
                 avgHallucination <= 0.6 ? 'Some hallucinations present - monitor closely' :
                 'High hallucination rate - requires review'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-6 border-2 border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-300">Average Drift Level</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-800 ${getStatusColor(avgDrift)}`}>
                  {getStatusLabel(avgDrift)}
                </span>
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {(avgDrift * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {avgDrift <= 0.3 ? 'Consistent responses - stable model' :
                 avgDrift <= 0.6 ? 'Moderate variation - acceptable drift' :
                 'High drift detected - investigate patterns'}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
