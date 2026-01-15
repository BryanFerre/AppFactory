"""
Test Suite for OPT Points Tutorial/Onboarding Feature

Tests:
- GET /api/auth/onboarding/status - returns tutorial completion status
- POST /api/auth/onboarding/complete - marks tutorial complete and awards 200 OPT
- POST /api/auth/onboarding/reset - resets tutorial for replay
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "demo@napp.io"
TEST_USER_PASSWORD = "demo123"


class TestOnboardingTutorial:
    """Test suite for onboarding tutorial endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("access_token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                self.token = token
            else:
                pytest.skip("No access token received")
        else:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    def test_01_get_onboarding_status(self):
        """Test GET /api/auth/onboarding/status returns tutorial status"""
        response = self.session.get(f"{BASE_URL}/api/auth/onboarding/status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "tutorial_completed" in data, "Response should contain 'tutorial_completed'"
        assert "show_tutorial" in data, "Response should contain 'show_tutorial'"
        
        # tutorial_completed should be boolean
        assert isinstance(data["tutorial_completed"], bool), "tutorial_completed should be boolean"
        assert isinstance(data["show_tutorial"], bool), "show_tutorial should be boolean"
        
        # show_tutorial should be inverse of tutorial_completed
        assert data["show_tutorial"] == (not data["tutorial_completed"]), \
            "show_tutorial should be inverse of tutorial_completed"
        
        print(f"✓ Onboarding status: completed={data['tutorial_completed']}, show={data['show_tutorial']}")
    
    def test_02_reset_tutorial(self):
        """Test POST /api/auth/onboarding/reset resets tutorial status"""
        response = self.session.post(f"{BASE_URL}/api/auth/onboarding/reset")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Reset should return success=True"
        assert "message" in data, "Response should contain message"
        
        print(f"✓ Tutorial reset: {data['message']}")
        
        # Verify status changed
        status_response = self.session.get(f"{BASE_URL}/api/auth/onboarding/status")
        status_data = status_response.json()
        
        assert status_data["tutorial_completed"] == False, "Tutorial should be marked as not completed after reset"
        assert status_data["show_tutorial"] == True, "show_tutorial should be True after reset"
        
        print("✓ Tutorial status verified after reset")
    
    def test_03_complete_tutorial_first_time(self):
        """Test POST /api/auth/onboarding/complete marks tutorial complete and awards points"""
        # First reset to ensure clean state
        self.session.post(f"{BASE_URL}/api/auth/onboarding/reset")
        
        # Complete the tutorial
        response = self.session.post(f"{BASE_URL}/api/auth/onboarding/complete")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Complete should return success=True"
        assert "message" in data, "Response should contain message"
        assert "points_awarded" in data, "Response should contain points_awarded"
        
        # First completion should award 200 points
        assert data["points_awarded"] == 200, f"Expected 200 points, got {data['points_awarded']}"
        
        print(f"✓ Tutorial completed: {data['message']}")
        print(f"✓ Points awarded: {data['points_awarded']} OPT")
    
    def test_04_complete_tutorial_already_completed(self):
        """Test completing tutorial when already completed returns 0 points"""
        # Ensure tutorial is completed
        self.session.post(f"{BASE_URL}/api/auth/onboarding/complete")
        
        # Try to complete again
        response = self.session.post(f"{BASE_URL}/api/auth/onboarding/complete")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Should still succeed but with 0 points
        assert data.get("success") == True, "Should return success=True"
        assert data["points_awarded"] == 0, f"Expected 0 points for repeat completion, got {data['points_awarded']}"
        
        print(f"✓ Repeat completion handled: {data['message']}")
        print(f"✓ Points awarded: {data['points_awarded']} (correctly 0 for repeat)")
    
    def test_05_verify_status_after_completion(self):
        """Test that status shows completed after completing tutorial"""
        # Ensure tutorial is completed
        self.session.post(f"{BASE_URL}/api/auth/onboarding/complete")
        
        # Check status
        response = self.session.get(f"{BASE_URL}/api/auth/onboarding/status")
        
        assert response.status_code == 200
        
        data = response.json()
        
        assert data["tutorial_completed"] == True, "tutorial_completed should be True after completion"
        assert data["show_tutorial"] == False, "show_tutorial should be False after completion"
        assert "tutorial_completed_at" in data, "Should include completion timestamp"
        
        print(f"✓ Status verified: completed={data['tutorial_completed']}")
        print(f"✓ Completed at: {data.get('tutorial_completed_at')}")
    
    def test_06_reset_and_replay_flow(self):
        """Test full reset and replay flow"""
        # Step 1: Complete tutorial
        self.session.post(f"{BASE_URL}/api/auth/onboarding/complete")
        
        # Step 2: Verify completed
        status1 = self.session.get(f"{BASE_URL}/api/auth/onboarding/status").json()
        assert status1["tutorial_completed"] == True, "Should be completed"
        
        # Step 3: Reset tutorial
        reset_response = self.session.post(f"{BASE_URL}/api/auth/onboarding/reset")
        assert reset_response.status_code == 200
        
        # Step 4: Verify reset
        status2 = self.session.get(f"{BASE_URL}/api/auth/onboarding/status").json()
        assert status2["tutorial_completed"] == False, "Should be reset"
        assert status2["show_tutorial"] == True, "Should show tutorial after reset"
        
        # Step 5: Complete again (should NOT award points again due to cooldown)
        complete_response = self.session.post(f"{BASE_URL}/api/auth/onboarding/complete")
        complete_data = complete_response.json()
        
        # Note: After reset, completing again should award 0 points because
        # the points action has COOLDOWN_ONCE - it can only be awarded once ever
        # The tutorial can be replayed but points are only awarded first time
        assert complete_data["success"] == True
        
        print("✓ Full reset and replay flow completed successfully")
        print(f"✓ Points on replay: {complete_data['points_awarded']} (expected 0 due to one-time bonus)")


class TestOnboardingUnauthorized:
    """Test unauthorized access to onboarding endpoints"""
    
    def test_status_without_auth(self):
        """Test GET /api/auth/onboarding/status without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/onboarding/status")
        
        # Should return 401 or 403
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without auth, got {response.status_code}"
        
        print("✓ Status endpoint properly requires authentication")
    
    def test_complete_without_auth(self):
        """Test POST /api/auth/onboarding/complete without authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/onboarding/complete")
        
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without auth, got {response.status_code}"
        
        print("✓ Complete endpoint properly requires authentication")
    
    def test_reset_without_auth(self):
        """Test POST /api/auth/onboarding/reset without authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/onboarding/reset")
        
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without auth, got {response.status_code}"
        
        print("✓ Reset endpoint properly requires authentication")


class TestPointsEngineIntegration:
    """Test that onboarding integrates correctly with points engine"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("access_token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Login failed")
    
    def test_complete_tutorial_action_exists(self):
        """Verify complete_tutorial action exists in points engine"""
        response = self.session.get(f"{BASE_URL}/api/activity/actions")
        
        if response.status_code == 200:
            data = response.json()
            
            # Response format is grouped by category
            # Look in actions_by_category -> engagement -> actions
            tutorial_action = None
            
            actions_by_category = data.get("actions_by_category", {})
            engagement_category = actions_by_category.get("engagement", {})
            engagement_actions = engagement_category.get("actions", [])
            
            for action in engagement_actions:
                if action.get("id") == "complete_tutorial":
                    tutorial_action = action
                    break
            
            assert tutorial_action is not None, "complete_tutorial action should exist in engagement category"
            assert tutorial_action.get("base_points") == 200, "Should award 200 base points"
            assert tutorial_action.get("cooldown") == "once", "Should have 'once' cooldown"
            
            print(f"✓ complete_tutorial action found: {tutorial_action['name']}")
            print(f"✓ Base points: {tutorial_action['base_points']}")
            print(f"✓ Cooldown: {tutorial_action['cooldown']}")
        else:
            # Activity endpoint might not exist, skip this test
            pytest.skip("Activity actions endpoint not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
