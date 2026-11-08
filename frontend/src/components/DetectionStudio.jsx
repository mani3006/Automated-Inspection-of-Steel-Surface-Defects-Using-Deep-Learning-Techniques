import React, { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert, Cpu, Sparkles, Image as ImageIcon } from 'lucide-react';
import { inspectSteelImage } from '../api';

export default function DetectionStudio({ datasetItems, selectedItem, setSelectedItem }) {
  const [inspectionResult, setInspectionResult] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const handleRunInspection = async () => {
    if (!selectedItem) return;
    try {
      setIsInspecting(true);
      const res = await inspectSteelImage(selectedItem.id);
      setInspectionResult(res);
    } catch (err) {
      alert("Inspection failed: " + err.message);
    } finally {
      setIsInspecting(false);
    }
  };

  const isPass = inspectionResult?.quality_status === "PASS";

  return (
    <div className="space-y-6">
      
      {/* TOP INSPECTION ACTION & SELECTION BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              Real-Time Steel Surface Defect Detection
            </h2>
            <p className="text-xs text-slate-500 font-mono">Automated Industrial Quality Inspection</p>
          </div>
        </div>

        {/* Selected Image Picker Dropdown & Action */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedItem?.id || ''}
            onChange={(e) => {
              const found = datasetItems.find(i => i.id === e.target.value);
              if (found) setSelectedItem(found);
            }}
            className="bg-white text-slate-900 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 font-mono shadow-sm flex-1 md:w-64"
          >
            {datasetItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.id} - ({item.status})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunInspection}
            disabled={!selectedItem || isInspecting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isInspecting ? 'animate-spin' : ''}`} />
            <span>{isInspecting ? 'Analyzing Surface...' : 'Run Defect Detection'}</span>
          </button>
        </div>

      </div>

      {/* MAIN TWO-COLUMN INSPECTION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT & CENTER COLUMN: Visual Image Overlay Side-by-Side */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Visual Surface Inspection View
            </h3>
            {inspectionResult && (
              <span className="text-xs font-mono text-slate-500">
                Model: YOLOv8 Steel Model • Confidence &gt; 90%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Original Surface Image */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-600 font-medium">
                <span>Original Steel Surface</span>
                <span>{selectedItem?.width || 640}x{selectedItem?.height || 480}</span>
              </div>
              <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                {selectedItem ? (
                  <img src={selectedItem.url} alt="Original surface" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-slate-400">No Image Selected</div>
                )}
              </div>
            </div>

            {/* AI Detected Surface Overlay */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-600 font-medium">
                <span>AI Detected Bounding Boxes</span>
                <span className="text-blue-600 font-bold">Detection Result</span>
              </div>
              <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                {inspectionResult ? (
                  <img src={inspectionResult.annotated_url} alt="Annotated Surface" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-4 text-slate-400 text-xs">
                    Click "Run Defect Detection" to view AI bounding box overlay
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Quality Inspection Status Report */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Quality Inspection Verdict
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Automated Manufacturing Decision</p>
          </div>

          {inspectionResult ? (
            <div className="space-y-4">
              
              {/* Verdict Card */}
              <div className={`p-4 rounded-xl border flex items-center space-x-4 ${
                isPass 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isPass ? 'bg-emerald-200/60 text-emerald-800' : 'bg-red-200/60 text-red-800'
                }`}>
                  {isPass ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono block text-slate-500">
                    Inspection Result
                  </span>
                  <h4 className="text-xl font-black tracking-wide font-mono mt-0.5">
                    {isPass ? 'PASS (GOOD)' : 'FAIL (DEFECT)'}
                  </h4>
                  <p className="text-xs font-medium font-mono mt-0.5">
                    {isPass ? 'Zero Defects Detected' : `${inspectionResult.total_defects} Defect Anomaly Found`}
                  </p>
                </div>
              </div>

              {/* Defect Breakdown List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase font-mono block">Detected Anomalies:</span>
                
                {inspectionResult.defects && inspectionResult.defects.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {inspectionResult.defects.map((def, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 font-mono">{def.label}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Coords: [{def.x}, {def.y}, {def.w}, {def.h}]
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-blue-600 font-mono block">
                            {(def.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {def.area_pct}% Area
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-800 font-mono text-center font-semibold">
                    Surface passed quality standard inspection.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Cpu className="w-10 h-10 mx-auto stroke-1" />
              <p className="text-xs">No inspection performed yet for this surface image.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
