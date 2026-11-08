const API_BASE = 'http://127.0.0.1:8000';

export async function fetchDatasetItems() {
  const res = await fetch(`${API_BASE}/api/dataset/items`);
  if (!res.ok) throw new Error('Failed to fetch dataset items');
  return res.json();
}

export async function uploadCustomImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/dataset/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}

export async function saveAnnotation(id, status, defectType, boxes) {
  const res = await fetch(`${API_BASE}/api/dataset/annotate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status, defect_type: defectType, boxes }),
  });
  if (!res.ok) throw new Error('Failed to save annotation');
  return res.json();
}

export async function applyAugmentation(id, params) {
  const res = await fetch(`${API_BASE}/api/dataset/augment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...params }),
  });
  if (!res.ok) throw new Error('Failed to apply augmentation');
  return res.json();
}

export async function startTraining(modelType, epochs, batchSize, learningRate) {
  const res = await fetch(`${API_BASE}/api/train/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_type: modelType,
      epochs,
      batch_size: batchSize,
      learning_rate: learningRate
    }),
  });
  if (!res.ok) throw new Error('Failed to start training');
  return res.json();
}

export async function fetchTrainingStatus() {
  const res = await fetch(`${API_BASE}/api/train/status`);
  if (!res.ok) throw new Error('Failed to fetch training status');
  return res.json();
}

export async function inspectSteelImage(imageId) {
  const res = await fetch(`${API_BASE}/api/detect/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_id: imageId }),
  });
  if (!res.ok) throw new Error('Failed to perform defect inspection');
  return res.json();
}
