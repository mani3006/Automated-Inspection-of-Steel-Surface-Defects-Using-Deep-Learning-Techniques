import os
import cv2
import numpy as np

def apply_image_augmentation(img_path, flip_h=False, flip_v=False, rotate_deg=0, brightness=1.0, contrast=1.0, add_noise=False, boxes=None):
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Image not found: {img_path}")
        
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError(f"Could not decode image at {img_path}")
        
    h, w, _ = img.shape
    new_boxes = list(boxes) if boxes else []
    
    # 1. Flips
    if flip_h:
        img = cv2.flip(img, 1)
        updated_boxes = []
        for box in new_boxes:
            new_x = w - (box["x"] + box["w"])
            updated_boxes.append({**box, "x": max(0, new_x)})
        new_boxes = updated_boxes
        
    if flip_v:
        img = cv2.flip(img, 0)
        updated_boxes = []
        for box in new_boxes:
            new_y = h - (box["y"] + box["h"])
            updated_boxes.append({**box, "y": max(0, new_y)})
        new_boxes = updated_boxes

    # 2. Rotation (90, 180, 270)
    if rotate_deg == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        updated_boxes = []
        for box in new_boxes:
            # (x, y, w, h) -> (h_orig - (y + h_box), x, h_box, w_box)
            nx = h - (box["y"] + box["h"])
            ny = box["x"]
            nw = box["h"]
            nh = box["w"]
            updated_boxes.append({**box, "x": max(0, nx), "y": max(0, ny), "w": nw, "h": nh})
        new_boxes = updated_boxes
    elif rotate_deg == 180:
        img = cv2.rotate(img, cv2.ROTATE_180)
        updated_boxes = []
        for box in new_boxes:
            nx = w - (box["x"] + box["w"])
            ny = h - (box["y"] + box["h"])
            updated_boxes.append({**box, "x": max(0, nx), "y": max(0, ny)})
        new_boxes = updated_boxes
    elif rotate_deg == 270:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        updated_boxes = []
        for box in new_boxes:
            nx = box["y"]
            ny = w - (box["x"] + box["w"])
            nw = box["h"]
            nh = box["w"]
            updated_boxes.append({**box, "x": max(0, nx), "y": max(0, ny), "w": nw, "h": nh})
        new_boxes = updated_boxes

    # 3. Brightness & Contrast
    if brightness != 1.0 or contrast != 1.0:
        img = cv2.convertScaleAbs(img, alpha=contrast, beta=(brightness - 1.0) * 50)

    # 4. Gaussian Noise
    if add_noise:
        noise = np.random.normal(0, 12, img.shape).astype(np.float32)
        noisy = img.astype(np.float32) + noise
        img = np.clip(noisy, 0, 255).astype(np.uint8)

    return img, new_boxes
