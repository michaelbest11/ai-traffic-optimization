# camera_config.py
import os
from typing import List, Dict, Optional

class CameraConfig:
    """Camera configuration manager"""
    
    @staticmethod
    def get_cameras() -> List[Dict]:
        """Get camera configuration with environment variable override"""
        
        # Default cameras (for local development)
        default_cameras = [
            {
                "id": "accra_cam_1",
                "name": "Accra Camera 1",
                "source_rtsp": "rtsp://user:pass@10.0.0.10:554/stream",
                "location": {"lat": 5.5600, "lng": -0.1969},
                "city": "Accra"
            },
            {
                "id": "kumasi_cam_1",
                "name": "Kumasi Camera 1",
                "source_rtsp": "rtsp://user:pass@10.0.1.10:554/stream",
                "location": {"lat": 6.6885, "lng": -1.6244},
                "city": "Kumasi"
            }
        ]
        
        # Try to get cameras from environment variable
        env_cameras = os.getenv("CAMERAS_JSON")
        if env_cameras:
            try:
                import json
                cameras = json.loads(env_cameras)
                print(f"✅ Loaded {len(cameras)} cameras from environment")
                return cameras
            except Exception as e:
                print(f"⚠️ Failed to parse CAMERAS_JSON: {e}")
                print("   Using default camera configuration")
        
        # Try to load from cams.json file
        try:
            import json
            from pathlib import Path
            cams_file = Path(__file__).parent / "cams.json"
            if cams_file.exists():
                with open(cams_file) as f:
                    cameras = json.load(f)
                    print(f"✅ Loaded {len(cameras)} cameras from cams.json")
                    return cameras
        except Exception as e:
            print(f"⚠️ Failed to load cams.json: {e}")
        
        # Fallback to defaults
        print("⚠️ Using default camera configuration (local IPs)")
        return default_cameras
    
    @staticmethod
    def is_public_url(url: str) -> bool:
        """Check if URL is publicly accessible (not local/private IP)"""
        private_networks = [
            "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
            "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
            "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."
        ]
        return not any(url.startswith(f"rtsp://") and network in url for network in private_networks)
    
    @staticmethod
    def get_mock_cameras() -> List[Dict]:
        """Get mock cameras for testing without real streams"""
        return [
            {
                "id": "mock_accra_1",
                "name": "Mock Accra Camera",
                "source_rtsp": "mock://test",
                "location": {"lat": 5.5600, "lng": -0.1969},
                "city": "Accra",
                "is_mock": True
            },
            {
                "id": "mock_kumasi_1",
                "name": "Mock Kumasi Camera",
                "source_rtsp": "mock://test",
                "location": {"lat": 6.6885, "lng": -1.6244},
                "city": "Kumasi",
                "is_mock": True
            }
        ]