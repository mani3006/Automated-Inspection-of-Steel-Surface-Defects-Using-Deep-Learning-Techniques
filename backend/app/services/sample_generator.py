import os
import cv2
import numpy as np
import random
from PIL import Image

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "images"))
os.makedirs(STORAGE_DIR, exist_ok=True)

def create_steel_texture(width=640, height=480):
    # Base metallic gray steel surface
    base_color = random.randint(170, 200)
    img = np.full((height, width, 3), base_color, dtype=np.uint8)
    
    # Add subtle brushed metal grain (horizontal texture)
    noise = np.random.normal(0, 8, (height, width)).astype(np.uint8)
    noise = cv2.GaussianBlur(noise, (15, 1), 0)
    for c in range(3):
        img[:, :, c] = np.clip(img[:, :, c].astype(int) + noise - 4, 0, 255).astype(np.uint8)
        
    return img

def add_defects(img, defect_type):
    height, width, _ = img.shape
    boxes = []
    
    if defect_type == "Good":
        return img, []
        
    elif defect_type == "Scratches":
        # Draw 1-3 metallic scratches
        num = random.randint(1, 3)
        for _ in range(num):
            x1, y1 = random.randint(50, width-150), random.randint(50, height-150)
            dx, dy = random.randint(60, 150), random.randint(-40, 40)
            x2, y2 = min(width-10, max(10, x1 + dx)), min(height-10, max(10, y1 + dy))
            
            # Scratch highlight + shadow line
            cv2.line(img, (x1, y1), (x2, y2), (240, 240, 245), 2)
            cv2.line(img, (x1+1, y1+1), (x2+1, y2+1), (60, 60, 65), 1)
            
            bx = min(x1, x2) - 10
            by = min(y1, y2) - 10
            bw = abs(x2 - x1) + 20
            bh = abs(y2 - y1) + 20
            boxes.append({"x": max(0, bx), "y": max(0, by), "w": min(width-bx, bw), "h": min(height-by, bh), "label": "Scratches"})

    elif defect_type == "Inclusion":
        # Dark impurity inclusions
        num = random.randint(2, 5)
        for _ in range(num):
            cx, cy = random.randint(80, width-80), random.randint(80, height-80)
            rx, ry = random.randint(10, 25), random.randint(8, 20)
            cv2.ellipse(img, (cx, cy), (rx, ry), random.randint(0, 180), 0, 360, (30, 35, 40), -1)
            # Rough edge
            cv2.ellipse(img, (cx, cy), (rx+2, ry+2), random.randint(0, 180), 0, 360, (80, 85, 90), 1)
            
            boxes.append({"x": max(0, cx-rx-5), "y": max(0, cy-ry-5), "w": (rx+5)*2, "h": (ry+5)*2, "label": "Inclusion"})

    elif defect_type == "Patches":
        # Oxidation scale patches
        x = random.randint(100, width-200)
        y = random.randint(100, height-200)
        w, h = random.randint(90, 160), random.randint(70, 130)
        sub = img[y:y+h, x:x+w].astype(np.float32)
        sub *= 0.65 # Darker patch
        img[y:y+h, x:x+w] = np.clip(sub, 0, 255).astype(np.uint8)
        cv2.rectangle(img, (x, y), (x+w, y+h), (90, 95, 100), 2)
        boxes.append({"x": x, "y": y, "w": w, "h": h, "label": "Patches"})

    elif defect_type == "Pitted Surface":
        # Small crater pitting dots
        cx, cy = random.randint(150, width-150), random.randint(100, height-100)
        cluster_r = 40
        for _ in range(12):
            px = int(cx + np.random.normal(0, 18))
            py = int(cy + np.random.normal(0, 18))
            r = random.randint(2, 6)
            cv2.circle(img, (px, py), r, (40, 40, 45), -1)
            cv2.circle(img, (px+1, py+1), r, (220, 220, 225), 1)
        boxes.append({"x": max(0, cx-cluster_r), "y": max(0, cy-cluster_r), "w": cluster_r*2, "h": cluster_r*2, "label": "Pitted Surface"})

    elif defect_type == "Rolled-in Scale":
        # Dark scale line pressings
        y = random.randint(120, height-120)
        x = random.randint(50, 100)
        w = random.randint(250, 400)
        h = random.randint(15, 30)
        cv2.rectangle(img, (x, y), (x+w, y+h), (45, 50, 55), -1)
        cv2.line(img, (x, y), (x+w, y), (20, 20, 25), 2)
        boxes.append({"x": x, "y": y, "w": w, "h": h, "label": "Rolled-in Scale"})

    elif defect_type == "Crazing":
        # Network of micro cracks
        cx, cy = random.randint(150, width-150), random.randint(150, height-150)
        w, h = 140, 140
        for _ in range(8):
            p1 = (cx + random.randint(-60, 60), cy + random.randint(-60, 60))
            p2 = (p1[0] + random.randint(-30, 30), p1[1] + random.randint(-30, 30))
            cv2.line(img, p1, p2, (30, 30, 35), 1)
        boxes.append({"x": cx-70, "y": cy-70, "w": w, "h": h, "label": "Crazing"})

    return img, boxes

def generate_initial_samples():
    sample_defects = [
        ("Good", "steel_good_01.jpg"),
        ("Good", "steel_good_02.jpg"),
        ("Scratches", "steel_scratch_01.jpg"),
        ("Inclusion", "steel_inclusion_01.jpg"),
        ("Patches", "steel_patches_01.jpg"),
        ("Pitted Surface", "steel_pitted_01.jpg"),
        ("Rolled-in Scale", "steel_rolled_01.jpg"),
        ("Crazing", "steel_crazing_01.jpg")
    ]
    
    generated = []
    for defect_label, filename in sample_defects:
        filepath = os.path.join(STORAGE_DIR, filename)
        img = create_steel_texture()
        img_with_defects, boxes = add_defects(img, defect_label)
        cv2.imwrite(filepath, img_with_defects)
        
        is_good = (defect_label == "Good")
        generated.append({
            "id": filename.split('.')[0],
            "filename": filename,
            "url": f"/static/images/{filename}",
            "status": "Good" if is_good else "Not Good",
            "defect_type": "None" if is_good else defect_label,
            "boxes": boxes,
            "width": 640,
            "height": 480,
            "is_augmented": False
        })
    return generated
