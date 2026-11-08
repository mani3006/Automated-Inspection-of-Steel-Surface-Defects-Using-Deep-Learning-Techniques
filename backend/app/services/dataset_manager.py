import os
import json
import uuid
import cv2
import numpy as np
from PIL import Image
from app.services.sample_generator import STORAGE_DIR, generate_initial_samples

METADATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "metadata.json"))

class DatasetManager:
    def __init__(self):
        os.makedirs(STORAGE_DIR, exist_ok=True)
        self.metadata = self.load_metadata()
        if not self.metadata:
            initial = generate_initial_samples()
            self.metadata = {item["id"]: item for item in initial}
            self.save_metadata()

    def load_metadata(self):
        if os.path.exists(METADATA_FILE):
            try:
                with open(METADATA_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def save_metadata(self):
        with open(METADATA_FILE, "w") as f:
            json.dump(self.metadata, f, indent=2)

    def get_all_items(self):
        return list(self.metadata.values())

    def get_item(self, item_id):
        return self.metadata.get(item_id)

    def save_annotation(self, item_id, status, defect_type, boxes):
        if item_id in self.metadata:
            self.metadata[item_id]["status"] = status
            self.metadata[item_id]["defect_type"] = "None" if status == "Good" else defect_type
            self.metadata[item_id]["boxes"] = boxes if status == "Not Good" else []
            self.save_metadata()
            return self.metadata[item_id]
        return None

    def add_custom_image(self, file_bytes, filename):
        item_id = f"custom_{uuid.uuid4().hex[:8]}"
        saved_filename = f"{item_id}_{filename}"
        filepath = os.path.join(STORAGE_DIR, saved_filename)
        
        with open(filepath, "wb") as f:
            f.write(file_bytes)
            
        img = Image.open(filepath)
        w, h = img.size
        
        record = {
            "id": item_id,
            "filename": saved_filename,
            "url": f"/static/images/{saved_filename}",
            "status": "Not Good",
            "defect_type": "Unlabeled",
            "boxes": [],
            "width": w,
            "height": h,
            "is_augmented": False
        }
        self.metadata[item_id] = record
        self.save_metadata()
        return record

    def save_augmented_image(self, parent_id, aug_img_np, aug_name, boxes):
        aug_id = f"aug_{uuid.uuid4().hex[:8]}"
        filename = f"{aug_id}_{aug_name}.jpg"
        filepath = os.path.join(STORAGE_DIR, filename)
        
        cv2.imwrite(filepath, aug_img_np)
        h, w, _ = aug_img_np.shape
        parent = self.metadata.get(parent_id, {})
        
        record = {
            "id": aug_id,
            "filename": filename,
            "url": f"/static/images/{filename}",
            "status": parent.get("status", "Not Good"),
            "defect_type": parent.get("defect_type", "Augmented Defect"),
            "boxes": boxes,
            "width": w,
            "height": h,
            "is_augmented": True,
            "parent_id": parent_id
        }
        self.metadata[aug_id] = record
        self.save_metadata()
        return record

dataset_manager = DatasetManager()
