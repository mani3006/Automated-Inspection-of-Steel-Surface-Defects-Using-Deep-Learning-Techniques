import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, CheckCircle, AlertTriangle, Plus, RotateCw, 
  FlipHorizontal, FlipVertical, Sliders, Sparkles, Save, Image as ImageIcon, Trash2
} from 'lucide-react';
import { saveAnnotation, applyAugmentation, uploadCustomImage } from '../api';

const DEFECT_PRESETS = [
  "Scratches",
  "Inclusion",
  "Patches",
  "Pitted Surface",
  "Rolled-in Scale",
  "Crazing"
];

export default function LabelingStudio({ datasetItems, selectedItem, setSelectedItem, onRefreshDataset }) {
  const [status, setStatus] = useState("Not Good");
  const [defectType, setDefectType] = useState("Scratches");
  const [customDefect, setCustomDefect] = useState("");
  const [boxes, setBoxes] = useState([]);
  
  // Augmentation controls
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotateDeg, setRotateDeg] = useState(0);
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [addNoise, setAddNoise] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Drawing state on canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState(null);

  useEffect(() => {
    if (selectedItem) {
      setStatus(selectedItem.status || "Not Good");
      setDefectType(selectedItem.defect_type !== "None" && selectedItem.defect_type !== "Unlabeled" ? selectedItem.defect_type : "Scratches");
      setBoxes(selectedItem.boxes || []);
    }
  }, [selectedItem]);

  // Sync canvas drawing
  useEffect(() => {
    drawCanvas();
  }, [selectedItem, boxes, currentBox]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedItem) return;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedItem.url;
    img.onload = () => {
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;

      // Draw background steel image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw saved bounding boxes
      boxes.forEach((box, idx) => {
        ctx.strokeStyle = '#DC2626'; // High Contrast Bright Red
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        // Fill subtle translucent overlay
        ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
        ctx.fillRect(box.x, box.y, box.w, box.h);

        // Draw Label pill
        const labelText = box.label || defectType;
        ctx.font = 'bold 13px Inter, sans-serif';
        const txtWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(box.x, Math.max(0, box.y - 24), txtWidth + 16, 24);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, box.x + 8, Math.max(16, box.y - 7));
      });

      // Draw active dragging box
      if (currentBox) {
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
        ctx.setLineDash([]);
      }
    };
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    if (status === "Good") return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const w = coords.x - startPos.x;
    const h = coords.y - startPos.y;
    
    setCurrentBox({
      x: w < 0 ? coords.x : startPos.x,
      y: h < 0 ? coords.y : startPos.y,
      w: Math.abs(w),
      h: Math.abs(h)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentBox && currentBox.w > 15 && currentBox.h > 15) {
      const activeLabel = customDefect.trim() || defectType;
      setBoxes([...boxes, { ...currentBox, label: activeLabel }]);
    }
    setCurrentBox(null);
  };

  const handleSaveAnnotation = async () => {
    if (!selectedItem) return;
    const finalDefect = status === "Good" ? "None" : (customDefect.trim() || defectType);
    const finalBoxes = status === "Good" ? [] : boxes;

    try {
      setIsProcessing(true);
      await saveAnnotation(selectedItem.id, status, finalDefect, finalBoxes);
      await onRefreshDataset();
    } catch (err) {
      alert("Failed to save annotation: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyAugmentation = async () => {
    if (!selectedItem) return;
    try {
      setIsProcessing(true);
      await applyAugmentation(selectedItem.id, {
        flip_h: flipH,
        flip_v: flipV,
        rotate_deg: rotateDeg,
        brightness,
        contrast,
        add_noise: addNoise
      });
      await onRefreshDataset();
    } catch (err) {
      alert("Augmentation failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const res = await uploadCustomImage(file);
      await onRefreshDataset();
      if (res.item) setSelectedItem(res.item);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearBoxes = () => {
    setBoxes([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Sidebar Image Gallery & Selection Queue */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-[calc(100vh-6.5rem)] shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Image Sidebar</h2>
            <p className="text-xs text-slate-500 font-mono">Dataset Gallery ({datasetItems.length})</p>
          </div>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex items-center shadow-sm">
            <Upload className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {datasetItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isGood = item.status === "Good";
            
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-300 overflow-hidden shrink-0 relative shadow-sm">
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                  {item.is_augmented && (
                    <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[9px] font-bold px-1 rounded">
                      AUG
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[100px]">
                      {item.id}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isGood ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {isGood ? 'GOOD' : 'DEFECT'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono truncate">
                    {isGood ? 'Clean Surface' : item.defect_type}
                  </p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1 font-mono">
                    <span>{item.boxes?.length || 0} boxes</span>
                    <span>•</span>
                    <span>{item.width}x{item.height}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER COLUMN: LabelImg Interactive Annotation Canvas */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Annotation Canvas</span>
              <span className="text-xs text-slate-500 font-mono font-normal">
                (Click & Drag to Mark Defect Area)
              </span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearBoxes}
              className="text-xs text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Boxes</span>
            </button>
            <button
              onClick={handleSaveAnnotation}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Marking</span>
            </button>
          </div>
        </div>

        {/* Canvas Display Container */}
        <div className="my-4 flex-1 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-center p-2 relative overflow-hidden min-h-[380px]">
          {selectedItem ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-h-[460px] max-w-full object-contain rounded cursor-crosshair border border-slate-300 shadow-md bg-white"
            />
          ) : (
            <div className="text-center text-slate-400 space-y-2">
              <ImageIcon className="w-12 h-12 mx-auto stroke-1 text-slate-400" />
              <p className="text-xs">Select an image from sidebar gallery to annotate</p>
            </div>
          )}
        </div>

        {/* Labeling Decision Panel (Good vs Not Good) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Surface Status Option:</span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {boxes.length} Defect Bounding Boxes
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Good Button */}
            <button
              onClick={() => {
                setStatus("Good");
                setBoxes([]);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs border transition-all ${
                status === "Good"
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>GOOD (Clean Surface)</span>
            </button>

            {/* Not Good Button */}
            <button
              onClick={() => setStatus("Not Good")}
              className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs border transition-all ${
                status === "Not Good"
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-red-800 border-red-300 hover:bg-red-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>NOT GOOD (Defect Found)</span>
            </button>
          </div>

          {/* Defect Class Selection if NOT GOOD */}
          {status === "Not Good" && (
            <div className="pt-3 space-y-2 border-t border-slate-200">
              <label className="text-xs text-slate-700 font-bold block">Select/Enter Steel Defect Category:</label>
              
              <div className="flex flex-wrap gap-1.5">
                {DEFECT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setDefectType(preset);
                      setCustomDefect("");
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      defectType === preset && !customDefect
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom Write-in Defect */}
              <input
                type="text"
                placeholder="Or enter custom defect type..."
                value={customDefect}
                onChange={(e) => setCustomDefect(e.target.value)}
                className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
              />
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Image Augmentation Toolbar */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>First Augmentation</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Prepare & Transform Data</p>
          </div>

          {/* Controls */}
          <div className="space-y-3.5 text-xs text-slate-700">
            
            {/* Flips */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800">Image Flips:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFlipH(!flipH)}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-bold transition-all ${
                    flipH ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip Horiz</span>
                </button>
                
                <button
                  onClick={() => setFlipV(!flipV)}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border font-bold transition-all ${
                    flipV ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip Vert</span>
                </button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800">Rotation Angle:</span>
              <select
                value={rotateDeg}
                onChange={(e) => setRotateDeg(Number(e.target.value))}
                className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
              >
                <option value={0}>0° (None)</option>
                <option value={90}>90° Clockwise</option>
                <option value={180}>180° Flip</option>
                <option value={270}>270° Counter-Clockwise</option>
              </select>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-slate-800">Brightness:</span>
                <span className="text-blue-600 font-bold">{brightness.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Contrast Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-slate-800">Contrast:</span>
                <span className="text-blue-600 font-bold">{contrast.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Add Noise */}
            <label className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer">
              <span className="font-bold text-slate-800">Gaussian Metal Noise</span>
              <input
                type="checkbox"
                checked={addNoise}
                onChange={(e) => setAddNoise(e.target.checked)}
                className="accent-blue-600 w-4 h-4 rounded"
              />
            </label>

          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleApplyAugmentation}
          disabled={!selectedItem || isProcessing}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <RotateCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>Generate Augmented Image</span>
        </button>
      </div>

    </div>
  );
}
