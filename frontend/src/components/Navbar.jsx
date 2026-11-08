import React from 'react';
import { ShieldAlert, Layers, Cpu, Search, CheckCircle2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, datasetCount, trainingStatus }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-500 flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide uppercase">
                Steel Surface Defect Inspection
              </h1>
              <p className="text-xs text-slate-300 font-mono">Digitized Quality Control • AI/DL Platform</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('labeling')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'labeling'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1. Label & Augment</span>
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'training'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>2. Model Training</span>
              {trainingStatus?.is_training && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('detection')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'detection'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>3. Defect Detection</span>
            </button>
          </nav>

          {/* Status Metrics Pill */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-mono text-slate-300">Dataset:</span>
              <span className="font-bold text-white font-mono">{datasetCount}</span>
            </div>
            
            <div className="flex items-center space-x-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-slate-200">FastAPI Ready</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
