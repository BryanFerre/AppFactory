"""
Test suite for NAPP Referral System
Tests: referral code generation, click tracking, signup with referral, stats endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://app-factory-971.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "reftest@napp.io"
TEST_USER_PASSWORD = "testpass123"
TEST_REFERRAL_CODE = "8D6F4D13"


class TestReferralAuthentication:
    """Test authentication for referral endpoints"""
    
    def test_login_test_user(self):
        """Login with test user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        
    def test_referral_code_requires_auth(self):
        """GET /api/referral/code requires authentication"""
        response = requests.get(f"{BASE_URL}/api/referral/code")
        assert response.status_code in [401, 403]
        
    def test_referral_stats_requires_auth(self):
        """GET /api/referral/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/referral/stats")
        assert response.status_code in [401, 403]


class TestReferralCode:
    """Test referral code endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_referral_code(self, auth_token):
        """GET /api/referral/code returns unique referral code and links"""
        response = requests.get(
            f"{BASE_URL}/api/referral/code",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "referral_code" in data
        assert "referral_link" in data
        assert "operator_referral_link" in data
        
        # Verify referral code format (8 char hex)
        assert len(data["referral_code"]) == 8
        assert data["referral_code"] == TEST_REFERRAL_CODE
        
        # Verify links contain referral code
        assert TEST_REFERRAL_CODE in data["referral_link"]
        assert TEST_REFERRAL_CODE in data["operator_referral_link"]


class TestReferralClickTracking:
    """Test referral click tracking (public endpoint)"""
    
    def test_track_operator_click(self):
        """POST /api/referral/click tracks operator referral clicks"""
        response = requests.post(f"{BASE_URL}/api/referral/click", json={
            "referral_code": TEST_REFERRAL_CODE,
            "source": "twitter"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Click tracked"
        assert "referrer_id" in data
        
    def test_track_app_click(self):
        """POST /api/referral/click tracks app-specific referral clicks"""
        response = requests.post(f"{BASE_URL}/api/referral/click", json={
            "referral_code": TEST_REFERRAL_CODE,
            "source": "facebook",
            "app_id": "test-app-123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Click tracked"
        
    def test_invalid_referral_code(self):
        """POST /api/referral/click rejects invalid referral code"""
        response = requests.post(f"{BASE_URL}/api/referral/click", json={
            "referral_code": "INVALID123",
            "source": "direct"
        })
        assert response.status_code == 404
        data = response.json()
        assert "Invalid referral code" in data.get("detail", "")


class TestReferralStats:
    """Test referral statistics endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_referral_stats(self, auth_token):
        """GET /api/referral/stats returns comprehensive referral statistics"""
        response = requests.get(
            f"{BASE_URL}/api/referral/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "referral_code" in data
        assert "operator_referral_link" in data
        
        # Operator stats
        assert "operator_clicks" in data
        assert "operator_signups" in data
        assert "operator_opt_earned" in data
        assert "operator_pending_opt" in data
        
        # App stats
        assert "app_clicks" in data
        assert "app_signups" in data
        assert "app_opt_earned" in data
        assert "app_pending_opt" in data
        
        # Totals
        assert "total_opt_earned" in data
        assert "total_pending_opt" in data
        
        # Per-app breakdown
        assert "app_referral_stats" in data
        assert isinstance(data["app_referral_stats"], list)
        
        # Recent activity
        assert "recent_referrals" in data
        assert isinstance(data["recent_referrals"], list)
        
    def test_stats_show_pending_opt(self, auth_token):
        """Verify stats show pending OPT from referrals"""
        response = requests.get(
            f"{BASE_URL}/api/referral/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Test user should have pending OPT from referrals
        assert data["operator_signups"] >= 1
        assert data["operator_pending_opt"] >= 50  # 50 OPT per operator signup


class TestPromotionStatsBackwardCompatibility:
    """Test promotion stats endpoint (backward compatible)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_get_promotion_stats(self, auth_token):
        """GET /api/promotion/stats returns real referral data"""
        response = requests.get(
            f"{BASE_URL}/api/promotion/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "app_link_clicks" in data
        assert "app_signups_driven" in data
        assert "app_opt_rewards" in data
        assert "operator_invites_sent" in data
        assert "operator_signups" in data
        assert "operator_opt_rewards" in data
        assert "app_share_links" in data
        assert "operator_referral_link" in data
        assert "recent_activity" in data
        
        # Verify app share links structure
        assert isinstance(data["app_share_links"], list)
        if len(data["app_share_links"]) > 0:
            link = data["app_share_links"][0]
            assert "app_name" in link
            assert "url" in link
            assert "signups" in link
            assert "opt_earned" in link


class TestReferralSignup:
    """Test new user registration with referral code"""
    
    def test_register_with_referral_code(self):
        """New user registration with referral_code creates referral conversion"""
        unique_email = f"testref_{int(time.time())}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Referred User",
            "referral_code": TEST_REFERRAL_CODE
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify user was created
        assert "access_token" in data
        assert data["user"]["email"] == unique_email
        
    def test_register_without_referral_code(self):
        """New user registration without referral_code works"""
        unique_email = f"testnoref_{int(time.time())}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User No Referral"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data


class TestReferralStatsUpdate:
    """Test that stats update in real-time after referral actions"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_stats_update_after_click(self, auth_token):
        """Stats update after referral click"""
        # Get initial stats
        response1 = requests.get(
            f"{BASE_URL}/api/referral/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_clicks = response1.json()["operator_clicks"]
        
        # Track a click
        requests.post(f"{BASE_URL}/api/referral/click", json={
            "referral_code": TEST_REFERRAL_CODE,
            "source": "test"
        })
        
        # Get updated stats
        response2 = requests.get(
            f"{BASE_URL}/api/referral/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        new_clicks = response2.json()["operator_clicks"]
        
        # Verify click was counted
        assert new_clicks == initial_clicks + 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
