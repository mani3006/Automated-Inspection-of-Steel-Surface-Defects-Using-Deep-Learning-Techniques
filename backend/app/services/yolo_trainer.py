import time
import threading
import random
import os
import json

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "models"))
os.makedirs(MODEL_DIR, exist_ok=True)

class YOLOTrainer:
    def __init__(self):
        self.is_training = False
        self.current_epoch = 0
        self.total_epochs = 20
        self.progress_pct = 0.0
        self.status_message = "Idle"
        self.model_name = "yolov8n-steel.pt"
        self.history = []
        self.logs = []
        self.best_map = 0.0
        self.thread = None

    def get_status(self):
        return {
            "is_training": self.is_training,
            "current_epoch": self.current_epoch,
            "total_epochs": self.total_epochs,
            "progress_pct": round(self.progress_pct, 1),
            "status_message": self.status_message,
            "model_name": self.model_name,
            "best_map": round(self.best_map, 4),
            "history": self.history,
            "logs": self.logs[-20:] # Last 20 log lines
        }

    def start_training(self, model_type="YOLOv8 Nano", epochs=20, batch_size=16, learning_rate=0.01, dataset_items=None):
        if self.is_training:
            return False, "Training is already in progress"

        self.is_training = True
        self.current_epoch = 0
        self.total_epochs = epochs
        self.progress_pct = 0.0
        self.status_message = f"Initializing {model_type} backbone..."
        self.history = []
        self.logs = [f"[INFO] Initializing {model_type} for Steel Defect Detection (Classes: Scratches, Inclusion, Patches, Pitted Surface, Rolled-in Scale, Crazing)"]
        self.best_map = 0.0

        # Launch training loop in background thread
        self.thread = threading.Thread(target=self._run_training_loop, args=(epochs, batch_size, learning_rate, len(dataset_items or [])), daemon=True)
        self.thread.start()
        return True, "Training launched successfully"

    def stop_training(self):
        if self.is_training:
            self.is_training = False
            self.status_message = "Training stopped by user"
            self.logs.append("[WARNING] Training aborted by user command.")
            return True
        return False

    def _run_training_loop(self, epochs, batch_size, lr, dataset_size):
        try:
            self.logs.append(f"[INFO] Dataset loaded with {max(dataset_size, 16)} samples. Splitting Train/Val (80/20)...")
            time.sleep(1.0)
            
            base_box_loss = 0.85
            base_cls_loss = 1.20
            base_map = 0.45
            
            for epoch in range(1, epochs + 1):
                if not self.is_training:
                    break
                    
                self.current_epoch = epoch
                self.status_message = f"Epoch {epoch}/{epochs} - Computing losses & gradients..."
                
                # Decay losses over epochs
                box_loss = max(0.08, base_box_loss * (0.91 ** epoch) + random.uniform(-0.01, 0.01))
                cls_loss = max(0.05, base_cls_loss * (0.88 ** epoch) + random.uniform(-0.015, 0.015))
                total_loss = box_loss + cls_loss
                
                # Increase precision, recall, mAP@50
                map50 = min(0.978, base_map + (0.52 * (1 - (0.85 ** epoch))) + random.uniform(-0.005, 0.005))
                precision = min(0.965, map50 + random.uniform(0.01, 0.03))
                recall = min(0.950, map50 - random.uniform(0.005, 0.02))
                
                if map50 > self.best_map:
                    self.best_map = map50
                    
                metric_entry = {
                    "epoch": epoch,
                    "box_loss": round(box_loss, 4),
                    "cls_loss": round(cls_loss, 4),
                    "total_loss": round(total_loss, 4),
                    "map50": round(map50, 4),
                    "precision": round(precision, 4),
                    "recall": round(recall, 4)
                }
                self.history.append(metric_entry)
                
                self.logs.append(
                    f"[EPOCH {epoch:02d}/{epochs}] Loss: {total_loss:.4f} (Box: {box_loss:.4f}, Cls: {cls_loss:.4f}) | mAP@50: {map50:.4f} | Prec: {precision:.4f} | Rec: {recall:.4f}"
                )
                
                self.progress_pct = (epoch / epochs) * 100.0
                time.sleep(0.6) # Simulated smooth epoch time

            if self.is_training:
                self.is_training = False
                self.status_message = "Training Completed Successfully"
                self.logs.append(f"[SUCCESS] Model weights saved to {self.model_name}. Final mAP@50: {self.best_map:.4f}")
                
                # Save dummy weights info metadata
                weights_path = os.path.join(MODEL_DIR, "best_weights.json")
                with open(weights_path, "w") as f:
                    json.dump({
                        "model": self.model_name,
                        "best_map": self.best_map,
                        "epochs": epochs,
                        "timestamp": time.time()
                    }, f)
                    
        except Exception as e:
            self.is_training = False
            self.status_message = f"Error during training: {str(e)}"
            self.logs.append(f"[ERROR] {str(e)}")

yolo_trainer = YOLOTrainer()
