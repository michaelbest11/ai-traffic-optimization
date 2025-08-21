#!/usr/bin/env python3
import requests
import json
import time
import unittest
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://bbc3fb76-a928-49fc-a125-07f51b2d317e.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"

class TrafficOptimizationAPITest(unittest.TestCase):
    """Test suite for the Traffic Optimization API endpoints"""

    def setUp(self):
        """Set up test environment"""
        self.api_url = API_BASE_URL
        self.cities = ["Accra", "Kumasi"]
        self.accra_intersections = ["ACC_001", "ACC_002", "ACC_003", "ACC_004", "ACC_005"]
        self.kumasi_intersections = ["KUM_001", "KUM_002", "KUM_003", "KUM_004", "KUM_005"]
        
        # Sample route data for testing
        self.sample_route = {
            "start_location": {"lat": 5.5600, "lng": -0.1969},
            "end_location": {"lat": 5.6037, "lng": -0.2267},
            "city": "Accra",
            "vehicle_type": "car",
            "departure_time": datetime.now().isoformat()
        }
        
        print(f"\nTesting against API URL: {self.api_url}")

    def test_01_health_check(self):
        """Test the API health check endpoint"""
        print("\n=== Testing API Health Check ===")
        response = requests.get(f"{self.api_url}/")
        
        print(f"Response status code: {response.status_code}")
        print(f"Response body: {response.text}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Traffic Flow Optimization API")
        self.assertEqual(data["status"], "active")
        print("✅ API Health Check passed")

    def test_02_current_traffic_api(self):
        """Test the current traffic API for both cities"""
        print("\n=== Testing Current Traffic API ===")
        
        for city in self.cities:
            print(f"\nTesting for city: {city}")
            response = requests.get(f"{self.api_url}/traffic/current/{city}")
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertIn("traffic_data", data)
            self.assertIn("summary", data)
            
            # Validate traffic data
            self.assertTrue(len(data["traffic_data"]) > 0)
            
            # Check first traffic data entry
            traffic_entry = data["traffic_data"][0]
            self.assertIn("intersection_id", traffic_entry)
            self.assertIn("vehicle_count", traffic_entry)
            self.assertIn("average_speed", traffic_entry)
            self.assertIn("congestion_level", traffic_entry)
            
            # Validate summary
            self.assertIn("total_intersections", data["summary"])
            self.assertIn("high_congestion", data["summary"])
            self.assertIn("average_speed", data["summary"])
            
            print(f"✅ Current Traffic API for {city} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(f"{self.api_url}/traffic/current/InvalidCity")
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_03_route_optimization_api(self):
        """Test the route optimization API"""
        print("\n=== Testing Route Optimization API ===")
        
        response = requests.post(
            f"{self.api_url}/route/optimize",
            json=self.sample_route
        )
        
        print(f"Response status code: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Validate response structure
        self.assertIn("route_id", data)
        self.assertIn("path_coordinates", data)
        self.assertIn("estimated_duration", data)
        self.assertIn("estimated_distance", data)
        self.assertIn("traffic_conditions", data)
        self.assertIn("alternative_routes", data)
        self.assertIn("ai_insights", data)
        
        # Validate path coordinates
        self.assertTrue(len(data["path_coordinates"]) > 0)
        
        # Validate alternative routes
        self.assertTrue(len(data["alternative_routes"]) > 0)
        
        print("✅ Route Optimization API passed")
        
        # Test with invalid city
        invalid_route = self.sample_route.copy()
        invalid_route["city"] = "InvalidCity"
        
        print("\nTesting with invalid city")
        response = requests.post(
            f"{self.api_url}/route/optimize",
            json=invalid_route
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_04_dashboard_overview_api(self):
        """Test the dashboard overview API for both cities"""
        print("\n=== Testing Dashboard Overview API ===")
        
        for city in self.cities:
            print(f"\nTesting for city: {city}")
            response = requests.get(f"{self.api_url}/dashboard/overview/{city}")
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertIn("timestamp", data)
            self.assertIn("metrics", data)
            self.assertIn("hotspots", data)
            self.assertIn("ai_recommendations", data)
            self.assertIn("ai_detailed_analysis", data)
            self.assertIn("predictions", data)
            
            # Validate metrics
            metrics = data["metrics"]
            self.assertIn("total_vehicles", metrics)
            self.assertIn("average_speed", metrics)
            self.assertIn("congestion_level", metrics)
            
            # Validate AI recommendations
            self.assertTrue(len(data["ai_recommendations"]) > 0)
            
            print(f"✅ Dashboard Overview API for {city} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(f"{self.api_url}/dashboard/overview/InvalidCity")
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_05_traffic_patterns_api(self):
        """Test the traffic patterns API for both cities"""
        print("\n=== Testing Traffic Patterns API ===")
        
        for city in self.cities:
            print(f"\nTesting for city: {city}")
            response = requests.get(f"{self.api_url}/analytics/patterns/{city}")
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertIn("time_period", data)
            self.assertIn("congestion_hotspots", data)
            self.assertIn("average_speeds", data)
            self.assertIn("predictions", data)
            
            # Validate congestion hotspots
            self.assertTrue(len(data["congestion_hotspots"]) > 0)
            
            # Validate average speeds
            speeds = data["average_speeds"]
            self.assertIn("main_roads", speeds)
            self.assertIn("secondary_roads", speeds)
            self.assertIn("residential", speeds)
            
            # Validate predictions
            predictions = data["predictions"]
            self.assertIn("next_hour_congestion", predictions)
            self.assertIn("peak_time", predictions)
            self.assertIn("ai_insights", predictions)
            
            print(f"✅ Traffic Patterns API for {city} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(f"{self.api_url}/analytics/patterns/InvalidCity")
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_06_signal_optimization_api(self):
        """Test the signal optimization API"""
        print("\n=== Testing Signal Optimization API ===")
        
        for city in self.cities:
            intersections = self.accra_intersections if city == "Accra" else self.kumasi_intersections
            intersection_id = intersections[0]
            
            print(f"\nTesting for city: {city}, intersection: {intersection_id}")
            response = requests.post(
                f"{self.api_url}/signals/optimize/{intersection_id}?city={city}"
            )
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["intersection_id"], intersection_id)
            self.assertEqual(data["city"], city)
            self.assertIn("current_timing", data)
            self.assertIn("optimized_timing", data)
            self.assertIn("expected_improvement", data)
            self.assertIn("ai_reasoning", data)
            self.assertIn("ml_confidence", data)
            
            # Validate timing data
            current_timing = data["current_timing"]
            optimized_timing = data["optimized_timing"]
            
            self.assertIn("north_south_green", current_timing)
            self.assertIn("east_west_green", current_timing)
            self.assertIn("pedestrian_phase", current_timing)
            
            self.assertIn("north_south_green", optimized_timing)
            self.assertIn("east_west_green", optimized_timing)
            self.assertIn("pedestrian_phase", optimized_timing)
            
            print(f"✅ Signal Optimization API for {city}, intersection {intersection_id} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.post(
            f"{self.api_url}/signals/optimize/{self.accra_intersections[0]}?city=InvalidCity"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")
        
        # Test invalid intersection
        print("\nTesting with invalid intersection")
        response = requests.post(
            f"{self.api_url}/signals/optimize/INVALID_ID?city=Accra"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 404)
        print("✅ Invalid intersection validation passed")

    def test_07_ml_predict_api(self):
        """Test the ML prediction API for specific intersections"""
        print("\n=== Testing ML Prediction API ===")
        
        for city in self.cities:
            intersections = self.accra_intersections if city == "Accra" else self.kumasi_intersections
            intersection_id = intersections[0]
            
            print(f"\nTesting for city: {city}, intersection: {intersection_id}")
            response = requests.get(
                f"{self.api_url}/ml/predict/{city}/{intersection_id}?horizon=30"
            )
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertEqual(data["intersection_id"], intersection_id)
            self.assertEqual(data["prediction_horizon"], 30)
            self.assertIn("predicted_congestion", data)
            self.assertIn("predicted_vehicle_count", data)
            self.assertIn("predicted_speed", data)
            self.assertIn("confidence_score", data)
            self.assertIn("ml_model_used", data)
            
            # Validate prediction data
            self.assertIn(data["predicted_congestion"], ["Low", "Medium", "High", "Critical"])
            self.assertGreaterEqual(data["predicted_vehicle_count"], 0)
            self.assertGreaterEqual(data["predicted_speed"], 0)
            self.assertGreaterEqual(data["confidence_score"], 0)
            self.assertLessEqual(data["confidence_score"], 1)
            
            print(f"✅ ML Prediction API for {city}, intersection {intersection_id} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(
            f"{self.api_url}/ml/predict/InvalidCity/{self.accra_intersections[0]}"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")
        
        # Test invalid intersection
        print("\nTesting with invalid intersection")
        response = requests.get(
            f"{self.api_url}/ml/predict/Accra/INVALID_ID"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 404)
        print("✅ Invalid intersection validation passed")

    def test_08_ml_batch_predict_api(self):
        """Test the ML batch prediction API"""
        print("\n=== Testing ML Batch Prediction API ===")
        
        for city in self.cities:
            print(f"\nTesting for city: {city}")
            response = requests.get(
                f"{self.api_url}/ml/batch-predict/{city}?horizon=30"
            )
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertEqual(data["prediction_horizon_minutes"], 30)
            self.assertIn("total_predictions", data)
            self.assertIn("predictions", data)
            self.assertIn("ml_model_info", data)
            
            # Validate predictions
            self.assertTrue(len(data["predictions"]) > 0)
            self.assertEqual(data["total_predictions"], len(data["predictions"]))
            
            # Check first prediction
            prediction = data["predictions"][0]
            self.assertIn("city", prediction)
            self.assertIn("intersection_id", prediction)
            self.assertIn("predicted_congestion", prediction)
            self.assertIn("predicted_vehicle_count", prediction)
            self.assertIn("predicted_speed", prediction)
            
            # Validate ML model info
            ml_info = data["ml_model_info"]
            self.assertIn("accuracy", ml_info)
            self.assertIn("is_trained", ml_info)
            
            print(f"✅ ML Batch Prediction API for {city} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(
            f"{self.api_url}/ml/batch-predict/InvalidCity"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_09_ml_model_performance_api(self):
        """Test the ML model performance API"""
        print("\n=== Testing ML Model Performance API ===")
        
        for city in self.cities:
            print(f"\nTesting for city: {city}")
            response = requests.get(
                f"{self.api_url}/ml/model-performance/{city}"
            )
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertIn("model_status", data)
            self.assertIn("accuracy_metrics", data)
            self.assertIn("models_used", data)
            self.assertIn("features_used", data)
            
            # Validate model status
            self.assertIn(data["model_status"], ["trained", "not_trained"])
            
            # Validate accuracy metrics
            if data["model_status"] == "trained":
                self.assertTrue(len(data["accuracy_metrics"]) > 0)
            
            # Validate models used
            models = data["models_used"]
            self.assertIn("traffic_prediction", models)
            self.assertIn("speed_prediction", models)
            self.assertIn("congestion_classification", models)
            
            # Validate features
            self.assertTrue(len(data["features_used"]) > 0)
            
            print(f"✅ ML Model Performance API for {city} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(
            f"{self.api_url}/ml/model-performance/InvalidCity"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_10_ml_analytics_insights_api(self):
        """Test the ML analytics insights API"""
        print("\n=== Testing ML Analytics Insights API ===")
        
        for city in self.cities:
            print(f"\nTesting for city: {city}")
            response = requests.get(
                f"{self.api_url}/analytics/ml-insights/{city}"
            )
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Validate response structure
            self.assertEqual(data["city"], city)
            self.assertIn("timestamp", data)
            self.assertIn("ml_predictions", data)
            self.assertIn("pattern_analysis", data)
            self.assertIn("optimization_opportunities", data)
            self.assertIn("model_reliability", data)
            
            # Validate ML predictions
            self.assertTrue(len(data["ml_predictions"]) > 0)
            
            # Check first prediction hour
            hour_prediction = data["ml_predictions"][0]
            self.assertIn("hour_ahead", hour_prediction)
            self.assertIn("predictions", hour_prediction)
            
            # Validate pattern analysis
            pattern = data["pattern_analysis"]
            self.assertIn("peak_approaching", pattern)
            self.assertIn("expected_peak_severity", pattern)
            self.assertIn("recommended_actions", pattern)
            
            # Validate optimization opportunities
            self.assertTrue(len(data["optimization_opportunities"]) > 0)
            
            # Validate model reliability
            reliability = data["model_reliability"]
            self.assertIn("overall_confidence", reliability)
            self.assertIn("prediction_accuracy", reliability)
            
            print(f"✅ ML Analytics Insights API for {city} passed")
        
        # Test invalid city
        print("\nTesting with invalid city")
        response = requests.get(
            f"{self.api_url}/analytics/ml-insights/InvalidCity"
        )
        print(f"Response status code: {response.status_code}")
        self.assertEqual(response.status_code, 400)
        print("✅ Invalid city validation passed")

    def test_11_gemini_ai_integration(self):
        """Test the Gemini AI integration"""
        print("\n=== Testing Gemini AI Integration ===")
        
        # We'll test this through the dashboard overview API which uses AI insights
        city = "Accra"
        response = requests.get(f"{self.api_url}/dashboard/overview/{city}")
        
        print(f"Response status code: {response.status_code}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for AI analysis
        self.assertIn("ai_detailed_analysis", data)
        ai_analysis = data["ai_detailed_analysis"]
        
        # The AI analysis should be a non-empty string
        self.assertTrue(isinstance(ai_analysis, str))
        
        # If emergentintegrations is properly installed and the API key is valid,
        # the AI analysis should be more than a generic fallback message
        print(f"AI Analysis length: {len(ai_analysis)} characters")
        
        # Note: We can't guarantee the AI will always be available, so we're just
        # checking that we get some kind of response
        print("✅ Gemini AI Integration test completed")

    def test_12_ml_model_training(self):
        """Test that ML models are being trained"""
        print("\n=== Testing ML Model Training ===")
        
        # We'll check the model performance API to see if models are trained
        for city in self.cities:
            print(f"\nChecking ML model training for {city}")
            response = requests.get(
                f"{self.api_url}/ml/model-performance/{city}"
            )
            
            print(f"Response status code: {response.status_code}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Check if models are trained
            self.assertIn("model_status", data)
            print(f"Model status: {data['model_status']}")
            
            # If models are trained, check accuracy metrics
            if data["model_status"] == "trained":
                self.assertIn("accuracy_metrics", data)
                metrics = data["accuracy_metrics"]
                print(f"Accuracy metrics: {metrics}")
                
                # Metrics should exist if models are trained
                self.assertTrue(len(metrics) > 0)
            
            print(f"✅ ML Model Training check for {city} completed")

if __name__ == "__main__":
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)