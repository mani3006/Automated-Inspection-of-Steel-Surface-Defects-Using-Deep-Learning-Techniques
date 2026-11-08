import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

from app.services.dataset_manager import dataset_manager
from app.services.augmentation import apply_image_augmentation
from app.services.yolo_trainer import yolo_trainer
from app.services.detector import detector, INSPECT_DIR
from app.services.sample_generator import STORAGE_DIR

app = FastAPI(
    title="Steel Surface Defect Inspection API",
    description="ML & DL Automated Steel Inspection, Labeling, Augmentation, YOLO Training & Detection",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for viewing images
app.mount("/static/images", StaticFiles(directory=STORAGE_DIR), name="images")
app.mount("/static/inspections", StaticFiles(directory=INSPECT_DIR), name="inspections")


# --- Data Models ---
class AnnotationRequest(BaseModel):
    id: str
    status: str # "Good" or "Not Good"
    defect_type: str # e.g. "Scratches", "Inclusion", "Patches", "Pitted Surface", "Rolled-in Scale", "Crazing"
    boxes: List[dict] = []

class AugmentationRequest(BaseModel):
    id: str
    flip_h: bool = False
    flip_v: bool = False
    rotate_deg: int = 0 # 0, 90, 180, 270
    brightness: float = 1.0
    contrast: float = 1.0
    add_noise: bool = False

class TrainRequest(BaseModel):
    model_type: str = "YOLOv8 Nano"
    epochs: int = 20
    batch_size: int = 16
    learning_rate: float = 0.01

class InspectRequest(BaseModel):
    image_id: Optional[str] = None


# --- API Routes ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Steel Surface Defect Inspection Platform",
        "version": "1.0.0"
    }

@app.get("/api/dataset/items")
def get_dataset_items():
    items = dataset_manager.get_all_items()
    return {"items": items, "total": len(items)}

@app.post("/api/dataset/upload")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    item = dataset_manager.add_custom_image(contents, file.filename)
    return {"message": "Image uploaded successfully", "item": item}

@app.post("/api/dataset/annotate")
def save_annotation(req: AnnotationRequest):
    updated = dataset_manager.save_annotation(req.id, req.status, req.defect_type, req.boxes)
    if not updated:
        raise HTTPException(status_code=404, detail="Dataset item not found")
    return {"message": "Annotation saved", "item": updated}

@app.post("/api/dataset/augment")
def augment_image(req: AugmentationRequest):
    item = dataset_manager.get_item(req.id)
    if not item:
        raise HTTPException(status_code=404, detail="Dataset item not found")

    img_path = os.path.join(STORAGE_DIR, item["filename"])
    aug_np, new_boxes = apply_image_augmentation(
        img_path,
        flip_h=req.flip_h,
        flip_v=req.flip_v,
        rotate_deg=req.rotate_deg,
        brightness=req.brightness,
        contrast=req.contrast,
        add_noise=req.add_noise,
        boxes=item.get("boxes", [])
    )

    aug_name = f"aug_{'fh' if req.flip_h else ''}{'fv' if req.flip_v else ''}_{req.rotate_deg}deg"
    aug_item = dataset_manager.save_augmented_image(req.id, aug_np, aug_name, new_boxes)
    return {"message": "Augmentation created", "item": aug_item}

@app.post("/api/train/start")
def start_training(req: TrainRequest):
    dataset_items = dataset_manager.get_all_items()
    success, msg = yolo_trainer.start_training(
        model_type=req.model_type,
        epochs=req.epochs,
        batch_size=req.batch_size,
        learning_rate=req.learning_rate,
        dataset_items=dataset_items
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.post("/api/train/stop")
def stop_training():
    success = yolo_trainer.stop_training()
    return {"success": success}

@app.get("/api/train/status")
def get_training_status():
    return yolo_trainer.get_status()

@app.post("/api/detect/inspect")
def inspect_image(req: InspectRequest):
    item = None
    if req.image_id:
        item = dataset_manager.get_item(req.image_id)
        
    if item:
        img_path = os.path.join(STORAGE_DIR, item["filename"])
    else:
        # Pick default test image
        all_items = dataset_manager.get_all_items()
        item = all_items[0] if all_items else None
        if not item:
            raise HTTPException(status_code=404, detail="No images available for inspection")
        img_path = os.path.join(STORAGE_DIR, item["filename"])
        
    res = detector.inspect_image(img_path, metadata_entry=item)
    res["source_image"] = item
    return res
