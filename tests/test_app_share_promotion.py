"""
Test App Share/Promotion Feature
Tests for:
- GET /api/apps/installed - List installed apps
- GET /api/promotion/app/{app_id}/stats - Get app promotion stats
- POST /api/promotion/share/{app_id} - Track app share and award OPT
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test app IDs for demo@napp.io user
TEST_APP_IDS = {
    "chainbridge": "44fb9b62-8ca6-4aa2-87f5-581b021316cd",
    "datavault": "96d4aa12-8c8c-43ce-b54d-5463a60c87fe",
    "streamrelay": "b7a06153-3a4f-461d-829e-35d64a52f185"
}


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for demo user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "demo@napp.io", "password": "demo123"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestInstalledApps:
    """Tests for installed apps listing"""
    
    def test_get_installed_apps_success(self, auth_headers):
        """GET /api/apps/installed returns list of installed apps"""
        response = requests.get(f"{BASE_URL}/api/apps/installed", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Demo user has at least 3 apps
        
        # Verify app structure
        app = data[0]
        assert "id" in app
        assert "name" in app
        assert "health" in app
        assert "revenue_usd" in app
        assert "subscribers_served" in app
    
    def test_get_installed_apps_requires_auth(self):
        """GET /api/apps/installed requires authentication"""
        response = requests.get(f"{BASE_URL}/api/apps/installed")
        assert response.status_code == 401


class TestAppPromotionStats:
    """Tests for GET /api/promotion/app/{app_id}/stats endpoint"""
    
    def test_get_app_stats_success(self, auth_headers):
        """GET /api/promotion/app/{app_id}/stats returns app stats"""
        app_id = TEST_APP_IDS["chainbridge"]
        response = requests.get(
            f"{BASE_URL}/api/promotion/app/{app_id}/stats",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["app_id"] == app_id
        assert "app_name" in data
        assert "share_link" in data
        assert "total_shares" in data
        assert "clicks" in data
        assert "signups_driven" in data
        assert "opt_earned_from_shares" in data
        assert "performance" in data
        
        # Verify performance stats
        perf = data["performance"]
        assert "revenue_usd" in perf
        assert "subscribers_served" in perf
        assert "uptime_percentage" in perf
        assert "health" in perf
    
    def test_get_app_stats_datavault(self, auth_headers):
        """GET /api/promotion/app/{app_id}/stats for DataVault Pro"""
        app_id = TEST_APP_IDS["datavault"]
        response = requests.get(
            f"{BASE_URL}/api/promotion/app/{app_id}/stats",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["app_name"] == "DataVault Pro"
        assert isinstance(data["total_shares"], int)
        assert isinstance(data["clicks"], int)
    
    def test_get_app_stats_streamrelay(self, auth_headers):
        """GET /api/promotion/app/{app_id}/stats for StreamRelay"""
        app_id = TEST_APP_IDS["streamrelay"]
        response = requests.get(
            f"{BASE_URL}/api/promotion/app/{app_id}/stats",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["app_name"] == "StreamRelay"
    
    def test_get_app_stats_invalid_app(self, auth_headers):
        """GET /api/promotion/app/{app_id}/stats returns 404 for invalid app"""
        response = requests.get(
            f"{BASE_URL}/api/promotion/app/invalid-app-id/stats",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_app_stats_requires_auth(self):
        """GET /api/promotion/app/{app_id}/stats requires authentication"""
        app_id = TEST_APP_IDS["chainbridge"]
        response = requests.get(f"{BASE_URL}/api/promotion/app/{app_id}/stats")
        assert response.status_code == 401


class TestAppShare:
    """Tests for POST /api/promotion/share/{app_id} endpoint"""
    
    def test_share_app_copy(self, auth_headers):
        """POST /api/promotion/share/{app_id} with platform=copy"""
        app_id = TEST_APP_IDS["chainbridge"]
        response = requests.post(
            f"{BASE_URL}/api/promotion/share/{app_id}",
            params={"platform": "copy"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "share_link" in data
        assert data["platform"] == "copy"
        assert "points_awarded" in data
        assert isinstance(data["points_awarded"], int)
        assert "message" in data
    
    def test_share_app_twitter(self, auth_headers):
        """POST /api/promotion/share/{app_id} with platform=twitter"""
        app_id = TEST_APP_IDS["datavault"]
        response = requests.post(
            f"{BASE_URL}/api/promotion/share/{app_id}",
            params={"platform": "twitter"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["platform"] == "twitter"
    
    def test_share_app_linkedin(self, auth_headers):
        """POST /api/promotion/share/{app_id} with platform=linkedin"""
        app_id = TEST_APP_IDS["streamrelay"]
        response = requests.post(
            f"{BASE_URL}/api/promotion/share/{app_id}",
            params={"platform": "linkedin"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["platform"] == "linkedin"
    
    def test_share_app_email(self, auth_headers):
        """POST /api/promotion/share/{app_id} with platform=email"""
        app_id = TEST_APP_IDS["chainbridge"]
        response = requests.post(
            f"{BASE_URL}/api/promotion/share/{app_id}",
            params={"platform": "email"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["platform"] == "email"
    
    def test_share_app_invalid_app(self, auth_headers):
        """POST /api/promotion/share/{app_id} returns 404 for invalid app"""
        response = requests.post(
            f"{BASE_URL}/api/promotion/share/invalid-app-id",
            params={"platform": "copy"},
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_share_app_requires_auth(self):
        """POST /api/promotion/share/{app_id} requires authentication"""
        app_id = TEST_APP_IDS["chainbridge"]
        response = requests.post(
            f"{BASE_URL}/api/promotion/share/{app_id}",
            params={"platform": "copy"}
        )
        assert response.status_code == 401
    
    def test_share_increments_count(self, auth_headers):
        """Verify share count increments after sharing"""
        app_id = TEST_APP_IDS["datavault"]
        
        # Get initial stats
        stats_before = requests.get(
            f"{BASE_URL}/api/promotion/app/{app_id}/stats",
            headers=auth_headers
        ).json()
        initial_shares = stats_before["total_shares"]
        
        # Share the app
        requests.post(
            f"{BASE_URL}/api/promotion/share/{app_id}",
            params={"platform": "copy"},
            headers=auth_headers
        )
        
        # Get updated stats
        stats_after = requests.get(
            f"{BASE_URL}/api/promotion/app/{app_id}/stats",
            headers=auth_headers
        ).json()
        
        # Verify share count increased
        assert stats_after["total_shares"] == initial_shares + 1


class TestPointsEngine:
    """Tests for share_app_link action in points engine"""
    
    def test_share_app_link_action_exists(self, auth_headers):
        """Verify share_app_link action exists in points engine"""
        response = requests.get(
            f"{BASE_URL}/api/activity/actions",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        actions = response.json()
        
        # Find share_app_link action
        share_action = next(
            (a for a in actions if a["id"] == "share_app_link"),
            None
        )
        
        assert share_action is not None
        assert share_action["base_points"] == 100
        assert share_action["cooldown"] == "daily"
        assert share_action["category"] == "growth"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
