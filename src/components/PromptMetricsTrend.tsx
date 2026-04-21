import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface HistoricalDataPoint {
  bias_score: number;
  hallucination_score: number;
  drift_score: number;
  accuracy_scores: number[];
}

interface PromptMetricsTrendProps {
  confidence: number;
  biasScore?: number;
  hallucinationScore?: number;
  driftScore?: number;
  accuracyScores?: number[];
  historicalData?: HistoricalDataPoint[];
}

function deriveConfidence(accuracy_scores: number[]): number {
  if (!accuracy_scores || accuracy_scores.length === 0) return 0;
  const transformSimilarity = (s: number) => {
    const scaled = Math.pow(s, 0.5);
    const boosted = scaled + (s - 0.3) * 0.3;
    return Math.max(0.5, Math.min(0.98, boosted));
  };
  return accuracy_scores.reduce((sum, s) => sum + transformSimilarity(s), 0) / accuracy_scores.length;
}

export default function PromptMetricsTrend({
  confidence,
  accuracyScores = [],
  historicalData = []
}: PromptMetricsTrendProps) {
  const [showTable, setShowTable] = useState(true);

  const avgAccuracy = accuracyScores.length > 0
    ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length
    : confidence;

  const actualConfidence = avgAccuracy;
  const hasHistory = historicalData.length > 0;

  const cumulativeRows = historicalData.map((_, idx) => {
    const slice = historicalData.slice(0, idx + 1);
    const point = historicalData[idx];

    const totalBias = slice.reduce((s, d) => s + (d.bias_score || 0), 0);
    const totalHallucination = slice.reduce((s, d) => s + (d.hallucination_score || 0), 0);
    const totalDrift = slice.reduce((s, d) => s + (d.drift_score || 0), 0);

    const avgBias = totalBias / slice.length;
    const avgHallucination = totalHallucination / slice.length;
    const avgDrift = totalDrift / slice.length;

    // Correct formula: quality = 1 - (bias + drift + hallucination)
    // This matches the system model: confidence + bias + drift + hallucination = 1
    const qualityScore = Math.max(0, Math.min(1, 1 - (avgBias + avgDrift + avgHallucination)));

    const promptConfidence = deriveConfidence(point.accuracy_scores);

    return {
      promptNum: idx + 1,
      promptBias: point.bias_score || 0,
      promptHallucination: point.hallucination_score || 0,
      promptDrift: point.drift_score || 0,
      promptConfidence,
      totalBias,
      totalHallucination,
      totalDrift,
      avgBias,
      avgHallucination,
      avgDrift,
      qualityScore,
      count: slice.length
    };
  });

  const latest = cumulativeRows[cumulativeRows.length - 1];
  const avgBias = latest?.avgBias ?? 0;
  const avgHallucination = latest?.avgHallucination ?? 0;
  const avgDrift = latest?.avgDrift ?? 0;
  const qualityScore = latest?.qualityScore ?? 0;

  const historicalAvgConfidence = hasHistory && historicalData.length > 0
    ? historicalData.reduce((sum, d) => sum + deriveConfidence(d.accuracy_scores), 0) / historicalData.length
    : 0;

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  // For bias/hallucination/drift: lower is better (green = low, red = high)
  const getNoiseMetricTextColor = (score: number): string => {
    if (score <= 0.2) return 'text-emerald-400';
    if (score <= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // For quality/confidence: higher is better
  const getQualityTextColor = (score: number): string => {
    if (score >= 0.7) return 'text-emerald-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (score: number, lowerIsBetter = true): string => {
    if (lowerIsBetter) {
      if (score <= 0.2) return '#10b981';
      if (score <= 0.4) return '#f59e0b';
      return '#ef4444';
    }
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const sparkPoints = cumulativeRows.map(r => r.qualityScore);

  const totalNoise = avgBias + avgDrift + avgHallucination;
  const n = historicalData.length;

  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border-2 border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Prompt Performance Metrics</h3>
          <p className="text-xs text-slate-400">Real-time confidence and quality analysis</p>
        </div>
      </div>

      {/* Cumulative Quality Score Panel */}
      {hasHistory && (
        <div className="mt-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-xl p-5 border-2 border-cyan-600/50">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                Total Cumulative Quality Score
              </p>
              <p className="text-xs text-slate-400">
                Formula: <span className="text-slate-300 font-mono">1 − (AvgBias + AvgDrift + AvgHalluc)</span>
                <span className="ml-2 text-slate-500">where each avg = ∑ ÷ {n} prompts</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                System model: Confidence + Bias (40%) + Drift (30%) + Hallucination (30%) = 100%
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-black ${qualityScore >= 0.7 ? 'text-cyan-300' : qualityScore >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {(qualityScore * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                1 − {(totalNoise * 100).toFixed(1)}% noise
              </div>
            </div>
          </div>

          {/* Running totals — three sums */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/20">
              <p className="text-xs text-slate-400 mb-1">∑ Bias</p>
              <p className="text-xl font-black text-red-400">{latest.totalBias.toFixed(3)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                ÷ {n} = <span className="text-red-300 font-semibold">{(avgBias * 100).toFixed(1)}%</span>
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-orange-500/20">
              <p className="text-xs text-slate-400 mb-1">∑ Hallucination</p>
              <p className="text-xl font-black text-orange-400">{latest.totalHallucination.toFixed(3)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                ÷ {n} = <span className="text-orange-300 font-semibold">{(avgHallucination * 100).toFixed(1)}%</span>
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-blue-500/20">
              <p className="text-xs text-slate-400 mb-1">∑ Drift</p>
              <p className="text-xl font-black text-blue-400">{latest.totalDrift.toFixed(3)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                ÷ {n} = <span className="text-blue-300 font-semibold">{(avgDrift * 100).toFixed(1)}%</span>
              </p>
            </div>
          </div>

          {/* Quality breakdown bar */}
          <div className="bg-slate-900/40 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-400 mb-2">Quality composition (how 100% is distributed)</p>
            <div className="h-5 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${qualityScore * 100}%` }}
                title={`Quality: ${(qualityScore * 100).toFixed(1)}%`}
              />
              <div
                className="h-full bg-red-500 transition-all duration-700"
                style={{ width: `${avgBias * 100}%` }}
                title={`Avg Bias: ${(avgBias * 100).toFixed(1)}%`}
              />
              <div
                className="h-full bg-orange-500 transition-all duration-700"
                style={{ width: `${avgHallucination * 100}%` }}
                title={`Avg Hallucination: ${(avgHallucination * 100).toFixed(1)}%`}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${avgDrift * 100}%` }}
                title={`Avg Drift: ${(avgDrift * 100).toFixed(1)}%`}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span><span className="text-slate-300">Quality {(qualityScore * 100).toFixed(1)}%</span></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span><span className="text-slate-300">Bias {(avgBias * 100).toFixed(1)}%</span></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span><span className="text-slate-300">Halluc. {(avgHallucination * 100).toFixed(1)}%</span></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span><span className="text-slate-300">Drift {(avgDrift * 100).toFixed(1)}%</span></span>
            </div>
          </div>

          {/* Sparkline */}
          {sparkPoints.length >= 2 && (
            <div className="bg-slate-900/40 rounded-lg p-3 mb-3">
              <p className="text-xs text-slate-400 mb-2">Cumulative quality score trend after each prompt</p>
              <svg width="100%" height="52" viewBox={`0 0 ${Math.max(sparkPoints.length * 28, 280)} 52`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cumQualGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const w = Math.max(sparkPoints.length * 28, 280);
                  const h = 40;
                  const pts = sparkPoints.map((v, i) => ({
                    x: sparkPoints.length === 1 ? w / 2 : (i / (sparkPoints.length - 1)) * w,
                    y: h - 4 - v * (h - 8)
                  }));
                  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  return (
                    <>
                      <path d={`${pathD} L ${pts[pts.length - 1].x} ${h} L 0 ${h} Z`} fill="url(#cumQualGrad)" />
                      <path d={pathD} fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#67e8f9" stroke="#0f172a" strokeWidth="1.5" />
                          <text x={p.x} y={h + 10} textAnchor="middle" fill="#64748b" fontSize="9">#{i + 1}</text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}

          {/* Per-prompt accumulative table */}
          <button
            onClick={() => setShowTable(t => !t)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 transition-colors py-1.5 border-t border-slate-700/50 mt-1"
          >
            <span className="font-semibold uppercase tracking-wide">Per-Prompt Accumulative Breakdown</span>
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTable && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">#</th>
                    <th className="text-right py-2 px-2 text-sky-400 font-semibold whitespace-nowrap">Conf.</th>
                    <th className="text-right py-2 px-2 text-red-400 font-semibold whitespace-nowrap">Bias</th>
                    <th className="text-right py-2 px-2 text-orange-400 font-semibold whitespace-nowrap">Halluc.</th>
                    <th className="text-right py-2 px-2 text-blue-400 font-semibold whitespace-nowrap">Drift</th>
                    <th className="text-right py-2 px-2 text-red-300 font-semibold whitespace-nowrap">∑ Bias</th>
                    <th className="text-right py-2 px-2 text-orange-300 font-semibold whitespace-nowrap">∑ Halluc.</th>
                    <th className="text-right py-2 px-2 text-blue-300 font-semibold whitespace-nowrap">∑ Drift</th>
                    <th className="text-right py-2 px-2 text-cyan-300 font-semibold whitespace-nowrap">Quality</th>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td colSpan={9} className="py-1 px-2 text-slate-600 italic" style={{ fontSize: '9px' }}>
                      Quality = 1 − (∑Bias ÷ n + ∑Halluc. ÷ n + ∑Drift ÷ n) &nbsp;|&nbsp; lower bias/halluc./drift = higher quality
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {cumulativeRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-800/60 transition-colors ${i === cumulativeRows.length - 1 ? 'bg-cyan-900/20' : 'hover:bg-slate-800/40'}`}
                    >
                      <td className="py-1.5 px-2 text-slate-400 font-semibold">{row.promptNum}</td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${getQualityTextColor(row.promptConfidence)}`}>
                        {row.promptConfidence > 0 ? `${(row.promptConfidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${getNoiseMetricTextColor(row.promptBias)}`}>
                        {(row.promptBias * 100).toFixed(1)}%
                      </td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${getNoiseMetricTextColor(row.promptHallucination)}`}>
                        {(row.promptHallucination * 100).toFixed(1)}%
                      </td>
                      <td className={`py-1.5 px-2 text-right font-semibold ${getNoiseMetricTextColor(row.promptDrift)}`}>
                        {(row.promptDrift * 100).toFixed(1)}%
                      </td>
                      <td className="py-1.5 px-2 text-right text-red-300 font-mono">{row.totalBias.toFixed(3)}</td>
                      <td className="py-1.5 px-2 text-right text-orange-300 font-mono">{row.totalHallucination.toFixed(3)}</td>
                      <td className="py-1.5 px-2 text-right text-blue-300 font-mono">{row.totalDrift.toFixed(3)}</td>
                      <td className={`py-1.5 px-2 text-right font-black ${getQualityTextColor(row.qualityScore)}`}>
                        {(row.qualityScore * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-cyan-600/50 bg-cyan-900/30">
                    <td className="py-2 px-2 text-cyan-300 font-black text-xs" colSpan={5}>TOTALS / CUMULATIVE</td>
                    <td className="py-2 px-2 text-right text-red-300 font-black font-mono">{latest.totalBias.toFixed(3)}</td>
                    <td className="py-2 px-2 text-right text-orange-300 font-black font-mono">{latest.totalHallucination.toFixed(3)}</td>
                    <td className="py-2 px-2 text-right text-blue-300 font-black font-mono">{latest.totalDrift.toFixed(3)}</td>
                    <td className={`py-2 px-2 text-right font-black text-sm ${qualityScore >= 0.7 ? 'text-cyan-300' : qualityScore >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {(qualityScore * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Performance Summary */}
      <div className="mt-4 bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white">Performance Summary</h4>
          {hasHistory && (
            <span className="text-xs text-slate-500">Averages over {n} prompt{n !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <p className="text-xs text-slate-400 mb-0.5">Current Confidence</p>
            <p className="text-xl font-bold" style={{ color: getConfidenceColor(actualConfidence) }}>
              {(actualConfidence * 100).toFixed(1)}%
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-600 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${actualConfidence * 100}%`, backgroundColor: getConfidenceColor(actualConfidence) }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">This prompt's chunk scores</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <p className="text-xs text-slate-400 mb-0.5">Avg Confidence</p>
            <p className={`text-xl font-bold ${getQualityTextColor(historicalAvgConfidence)}`}>
              {hasHistory ? `${(historicalAvgConfidence * 100).toFixed(1)}%` : '—'}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-600 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${historicalAvgConfidence * 100}%`, backgroundColor: getConfidenceColor(historicalAvgConfidence) }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all {n} prompt{n !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-900/40 to-teal-900/40 rounded-lg p-3 border-2 border-cyan-600/40">
            <p className="text-xs text-cyan-300 font-bold mb-0.5">Cumul. Quality Score</p>
            <p className={`text-xl font-black ${hasHistory ? (qualityScore >= 0.7 ? 'text-cyan-300' : qualityScore >= 0.5 ? 'text-yellow-400' : 'text-red-400') : 'text-slate-500'}`}>
              {hasHistory ? `${(qualityScore * 100).toFixed(1)}%` : '—'}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${qualityScore * 100}%`, backgroundColor: qualityScore >= 0.7 ? '#10b981' : qualityScore >= 0.5 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">1 − (bias + halluc. + drift)</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <p className="text-xs text-slate-400 mb-0.5">Avg Bias</p>
            <p className={`text-xl font-bold ${getNoiseMetricTextColor(avgBias)}`}>
              {hasHistory ? `${(avgBias * 100).toFixed(1)}%` : '—'}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-600 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(avgBias * 100, 100)}%`, backgroundColor: getBarColor(avgBias) }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">∑ bias ÷ {n} — lower = better</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <p className="text-xs text-slate-400 mb-0.5">Avg Hallucination</p>
            <p className={`text-xl font-bold ${getNoiseMetricTextColor(avgHallucination)}`}>
              {hasHistory ? `${(avgHallucination * 100).toFixed(1)}%` : '—'}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-600 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(avgHallucination * 100, 100)}%`, backgroundColor: getBarColor(avgHallucination) }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">∑ halluc. ÷ {n} — lower = better</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <p className="text-xs text-slate-400 mb-0.5">Avg Drift</p>
            <p className={`text-xl font-bold ${getNoiseMetricTextColor(avgDrift)}`}>
              {hasHistory ? `${(avgDrift * 100).toFixed(1)}%` : '—'}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-600 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(avgDrift * 100, 100)}%`, backgroundColor: getBarColor(avgDrift) }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">∑ drift ÷ {n} — lower = better</p>
          </div>
        </div>
      </div>
    </div>
  );
}
