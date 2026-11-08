import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LabelingStudio from './components/LabelingStudio';
import TrainingStudio from './components/TrainingStudio';
import DetectionStudio from './components/DetectionStudio';
import { fetchDatasetItems, fetchTrainingStatus } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('labeling'); // 'labeling', 'training', 'detection'
  const [datasetItems, setDatasetItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);

  const loadDataset = async () => {
    try {
      const data = await fetchDatasetItems();
      setDatasetItems(data.items || []);
      if (!selectedItem && data.items?.length > 0) {
        setSelectedItem(data.items[0]);
      }
    } catch (err) {
      console.error("Error loading dataset:", err);
    }
  };

  const loadTrainingStatus = async () => {
    try {
      const status = await fetchTrainingStatus();
      setTrainingStatus(status);
    } catch (err) {
      console.error("Error fetching training status:", err);
    }
  };

  useEffect(() => {
    loadDataset();
    loadTrainingStatus();

    // Polling interval for live training updates & dataset sync
    const interval = setInterval(() => {
      loadTrainingStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        datasetCount={datasetItems.length}
        trainingStatus={trainingStatus}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'labeling' && (
          <LabelingStudio
            datasetItems={datasetItems}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            onRefreshDataset={loadDataset}
          />
        )}

        {activeTab === 'training' && (
          <TrainingStudio
            trainingStatus={trainingStatus}
            datasetCount={datasetItems.length}
          />
        )}

        {activeTab === 'detection' && (
          <DetectionStudio
            datasetItems={datasetItems}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
        )}
      </main>

      {/* Footer bar */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs font-mono text-slate-500 shadow-inner">
        Steel Surface Defect Inspection System • Python FastAPI + React + YOLO ML/DL Engine
      </footer>
    </div>
  );
}
