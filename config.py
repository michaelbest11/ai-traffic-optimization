# config.py
import os

class CameraConfig:
    # Use environment variables for camera URLs
    CAMERA_URL = os.getenv("CAMERA_URL", "rtsp://username:password@192.168.1.100:554/stream")
    
    # Alternative: Multiple cameras
    CAMERA_URLS = [
        os.getenv("CAMERA_1_URL", "rtsp://username:password@192.168.1.100:554/stream"),
        os.getenv("CAMERA_2_URL", "rtsp://username:password@192.168.1.101:554/stream"),
    ]
    
    @classmethod
    def get_camera_url(cls, index=0):
        """Get camera URL with environment variable override"""
        if index < len(cls.CAMERA_URLS):
            return cls.CAMERA_URLS[index]
        return cls.CAMERA_URL