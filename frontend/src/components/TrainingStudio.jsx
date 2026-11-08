import React, { useState } from 'react';
import { Cpu, Play, RefreshCw, BarChart2, TrendingUp, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { startTraining } from '../api';

export default function TrainingStudio({ trainingStatus, datasetCount }) {
  const [modelType, setModelType] = useState("YOLOv8 Nano");
  const [epochs, setEpochs] = useState(25);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartTraining = async () => {
    try {
      setIsSubmitting(true);
      await startTraining(modelType, epochs, batchSize, learningRate);
    } catch (err) {
      alert("Error starting training: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTraining = trainingStatus?.is_training;
  const history = trainingStatus?.history || [];
  const logs = trainingStatus?.logs || [];
  const currentEpoch = trainingStatus?.current_epoch || 0;
  const totalEpochs = trainingStatus?.total_epochs || epochs;
  const progressPct = trainingStatus?.progress_pct || 0;
  const bestMap = trainingStatus?.best_map || 0;

  const latestMetric = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="space-y-6">
      
      {/* TOP HEADER SUMMARY BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
        
        <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase font-semibold">Model Status</p>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span>{isTraining ? 'Training Active' : 'Ready to Train'}</span>
              {isTraining && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase font-semibold">Best mAP@50</p>
            <p className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
              {bestMap ? `${(bestMap * 100).toFixed(1)}%` : '0.0%'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase font-semibold">Loss Score</p>
            <p className="text-sm font-bold font-mono text-indigo-700 mt-0.5">
              {latestMetric ? latestMetric.total_loss.toFixed(4) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-xs">
            {currentEpoch}/{totalEpochs}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-mono uppercase font-semibold">Progress ({progressPct}%)</p>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden border border-slate-300">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Hyperparameters & Configuration */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>YOLO Hyperparameters</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Deep Learning Training Parameters</p>
          </div>

          <div className="space-y-4 text-xs text-slate-800">
            
            {/* Model Backbone */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Model Backbone:</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                disabled={isTraining}
                className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
              >
                <option value="YOLOv8 Nano">YOLOv8 Nano (Fastest, Light)</option>
                <option value="YOLOv8 Small">YOLOv8 Small (Balanced)</option>
                <option value="Custom ResNet-YOLO">Custom ResNet-YOLO (High Precision)</option>
              </select>
            </div>

            {/* Epochs Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <label className="font-bold text-slate-800">Total Epochs:</label>
                <span className="text-blue-600 font-bold">{epochs}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
                disabled={isTraining}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Batch Size */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Batch Size:</label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {[8, 16, 32].map((bs) => (
                  <button
                    key={bs}
                    onClick={() => setBatchSize(bs)}
                    disabled={isTraining}
                    className={`py-2 rounded-lg border font-bold transition-all ${
                      batchSize === bs
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {bs}
                  </button>
                ))}
              </div>
            </div>

            {/* Learning Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <label className="font-bold text-slate-800">Learning Rate:</label>
                <span className="text-blue-600 font-bold">{learningRate}</span>
              </div>
              <select
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                disabled={isTraining}
                className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
              >
                <option value={0.001}>0.001 (Fine-tune)</option>
                <option value={0.01}>0.01 (Standard SGD/AdamW)</option>
                <option value={0.05}>0.05 (Fast Warmup)</option>
              </select>
            </div>

            {/* Dataset count summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="flex justify-between">
                <span>Training Set (80%):</span>
                <span className="font-mono text-slate-900 font-bold">{Math.round(datasetCount * 0.8)} images</span>
              </p>
              <p className="flex justify-between">
                <span>Validation Set (20%):</span>
                <span className="font-mono text-slate-900 font-bold">{Math.round(datasetCount * 0.2)} images</span>
              </p>
            </div>

          </div>

          {/* Training Launch Button */}
          <button
            onClick={handleStartTraining}
            disabled={isTraining || isSubmitting}
            className={`w-full text-xs font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 ${
              isTraining
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Training in Progress...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start YOLO Defect Training</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Real-Time Charts & Live Log Terminal */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Real-time Loss & mAP Curves Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Live Epoch Training Metrics
                </h3>
                <p className="text-xs text-slate-500 font-mono">Loss Curve vs mAP@50 Accuracy</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Total Loss
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> mAP@50
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="epoch" stroke="#64748B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#0F172A' }}
                    />
                    <Line type="monotone" dataKey="total_loss" name="Total Loss" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="map50" name="mAP@50" stroke="#10B981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  Launch training to view real-time loss & mAP graphs
                </div>
              )}
            </div>
          </div>

          {/* Live Terminal Epoch Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Training Console Log Output
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">YOLOv8 Execution Engine</span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-100 h-40 overflow-y-auto space-y-1 select-text">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className={`${
                    log.includes('[SUCCESS]') ? 'text-emerald-400 font-bold' :
                    log.includes('[ERROR]') ? 'text-red-400 font-bold' :
                    log.includes('[WARNING]') ? 'text-amber-400' : 'text-slate-200'
                  }`}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No logs recorded yet.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
