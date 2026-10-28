import cv2
import os
import time
from datetime import datetime

# Configuration
SAVE_DIR = "/home/admin/smartg-id/end-edge/camera_captures"
CAMERA_INDICES = [0, 2, 4, 6] 

def capture_sequential():
    os.makedirs(SAVE_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for idx in CAMERA_INDICES:
        print(f"\n--- Processing camera {idx} ---")
        
        # FIX 1: Force OpenCV to use the V4L2 backend to prevent GStreamer crashes
        cap = cv2.VideoCapture(idx, cv2.CAP_V4L2)
        
        if not cap.isOpened():
            print(f"Failed to open camera {idx}. Skipping.")
            continue
            
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        # FIX 2: Wait dynamically until a frame is actually ready (Timeout after 10 seconds)
        print(f"Waiting for camera {idx} to initialize...")
        timeout = 10.0
        start_time = time.time()
        success = False
        final_frame = None
        
        while (time.time() - start_time) < timeout:
            ret, frame = cap.read()
            
            if ret and frame is not None:
                # The camera is ready and successfully sent a frame!
                # Now we read a few quick dummy frames just to let the auto-exposure settle
                for _ in range(5):
                    cap.read()
                
                # Grab the actual frame we want to save
                ret, final_frame = cap.read()
                success = True
                break
                
            # If not ready, wait a fraction of a second and ask the camera again
            time.sleep(0.2)
            
        if success and final_frame is not None:
            filename = os.path.join(SAVE_DIR, f"cam_{idx}_{timestamp}.jpg")
            cv2.imwrite(filename, final_frame)
            print(f"Saved: {filename}")
        else:
            print(f"Timeout: Camera {idx} opened, but never returned a valid frame.")
            
        # Release the camera
        cap.release()
        
        # Give the Raspberry Pi's USB bus half a second to fully reset before the next camera
        time.sleep(0.5)
        
    print("\nAll captures complete.")

if __name__ == "__main__":
    capture_sequential()