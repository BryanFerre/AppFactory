"""
Comprehensive API endpoint tests for AppCloud Node Operator Dashboard
Tests all endpoints mentioned in the review request:
- User authentication (login/register)
- Node stats, Earnings, OPT price
- Installed/Available/Featured apps
- Referral stats, Promotion stats
- AI recommendations, Capacity, Payouts
- Admin login, dashboard stats, users list
- Health endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
USER_EMAIL = "dev@test.io"
USER_PASSWORD = "devpass123"
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestUserAuthentication:
    """User authentication endpoint tests"""
    
    def test_user_login_success(self):
        """Test /api/auth/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["requires_2fa"] == False
        assert "user" in data
        assert data["user"]["email"] == USER_EMAIL
    
    def test_user_login_invalid_credentials(self):
        """Test /api/auth/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.io",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_user_register_duplicate_email(self):
        """Test /api/auth/register with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": USER_EMAIL,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
    
    def test_user_register_new_user(self):
        """Test /api/auth/register with new email"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.io"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email


class TestNodeStats:
    """Node stats endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_node_stats_requires_auth(self):
        """Test /api/node/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/node/stats")
        assert response.status_code in [401, 403]
    
    def test_node_stats_success(self, user_token):
        """Test /api/node/stats returns node data"""
        response = requests.get(
            f"{BASE_URL}/api/node/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "node_id" in data
        assert "status" in data
        assert "uptime_percent" in data
        assert "cpu_usage" in data
        assert "memory_usage" in data


class TestEarnings:
    """Earnings endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_earnings_requires_auth(self):
        """Test /api/earnings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/earnings")
        assert response.status_code in [401, 403]
    
    def test_earnings_success(self, user_token):
        """Test /api/earnings returns earnings data"""
        response = requests.get(
            f"{BASE_URL}/api/earnings",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "today_usd" in data
        assert "week_usd" in data
        assert "month_usd" in data
        assert "earnings_by_app" in data


class TestOPTPrice:
    """OPT price endpoint tests"""
    
    def test_opt_price_success(self):
        """Test /api/price/opt returns price data"""
        response = requests.get(f"{BASE_URL}/api/price/opt")
        assert response.status_code == 200
        data = response.json()
        assert "symbol" in data
        assert data["symbol"] == "OPT"
        assert "price_usd" in data
        assert "change_24h" in data
        assert "last_updated" in data


class TestInstalledApps:
    """Installed apps endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_installed_apps_requires_auth(self):
        """Test /api/apps/installed requires authentication"""
        response = requests.get(f"{BASE_URL}/api/apps/installed")
        assert response.status_code in [401, 403]
    
    def test_installed_apps_success(self, user_token):
        """Test /api/apps/installed returns apps list"""
        response = requests.get(
            f"{BASE_URL}/api/apps/installed",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            app = data[0]
            assert "id" in app
            assert "name" in app
            assert "status" in app


class TestAvailableApps:
    """Available apps endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_available_apps_requires_auth(self):
        """Test /api/apps/available requires authentication"""
        response = requests.get(f"{BASE_URL}/api/apps/available")
        assert response.status_code in [401, 403]
    
    def test_available_apps_success(self, user_token):
        """Test /api/apps/available returns apps list"""
        response = requests.get(
            f"{BASE_URL}/api/apps/available",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            app = data[0]
            assert "id" in app
            assert "name" in app
            assert "category" in app
            assert "subscription_price" in app


class TestFeaturedApps:
    """Featured apps endpoint tests"""
    
    def test_featured_apps_success(self):
        """Test /api/apps/featured returns featured apps"""
        response = requests.get(f"{BASE_URL}/api/apps/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            app = data[0]
            assert "id" in app
            assert "name" in app
            assert "is_featured" in app


class TestReferralStats:
    """Referral stats endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_referral_stats_requires_auth(self):
        """Test /api/referral/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/referral/stats")
        assert response.status_code in [401, 403]
    
    def test_referral_stats_success(self, user_token):
        """Test /api/referral/stats returns referral data"""
        response = requests.get(
            f"{BASE_URL}/api/referral/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        assert "operator_referral_link" in data
        assert "operator_clicks" in data
        assert "operator_signups" in data
        assert "total_opt_earned" in data


class TestPromotionStats:
    """Promotion stats endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_promotion_stats_requires_auth(self):
        """Test /api/promotion/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/promotion/stats")
        assert response.status_code in [401, 403]
    
    def test_promotion_stats_success(self, user_token):
        """Test /api/promotion/stats returns promotion data"""
        response = requests.get(
            f"{BASE_URL}/api/promotion/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "app_link_clicks" in data
        assert "app_signups_driven" in data
        assert "operator_referral_link" in data


class TestAIRecommendations:
    """AI recommendations endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_ai_recommendations_requires_auth(self):
        """Test /api/ai/recommendations requires authentication"""
        response = requests.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code in [401, 403]
    
    def test_ai_recommendations_success(self, user_token):
        """Test /api/ai/recommendations returns recommendations"""
        response = requests.get(
            f"{BASE_URL}/api/ai/recommendations",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCapacity:
    """Capacity endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_capacity_requires_auth(self):
        """Test /api/capacity requires authentication"""
        response = requests.get(f"{BASE_URL}/api/capacity")
        assert response.status_code in [401, 403]
    
    def test_capacity_success(self, user_token):
        """Test /api/capacity returns capacity data"""
        response = requests.get(
            f"{BASE_URL}/api/capacity",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_capacity" in data
        assert "used_capacity" in data
        assert "available_capacity" in data


class TestPayouts:
    """Payouts endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_payouts_requires_auth(self):
        """Test /api/payouts requires authentication"""
        response = requests.get(f"{BASE_URL}/api/payouts")
        assert response.status_code in [401, 403]
    
    def test_payouts_success(self, user_token):
        """Test /api/payouts returns payout history"""
        response = requests.get(
            f"{BASE_URL}/api/payouts",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            payout = data[0]
            assert "id" in payout
            assert "amount_opt" in payout
            assert "status" in payout


class TestAdminAuthentication:
    """Admin authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test /api/admin/auth/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        assert data["admin"]["role"] == "super_admin"
    
    def test_admin_login_invalid_credentials(self):
        """Test /api/admin/auth/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": "invalid@optio.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestAdminDashboardStats:
    """Admin dashboard stats endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_dashboard_stats_requires_auth(self):
        """Test /api/admin/dashboard/stats requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats")
        assert response.status_code in [401, 403]
    
    def test_admin_dashboard_stats_success(self, admin_token):
        """Test /api/admin/dashboard/stats returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "nodes" in data
        assert "apps" in data
        assert "revenue" in data


class TestAdminUsersList:
    """Admin users list endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_users_requires_auth(self):
        """Test /api/admin/users requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403]
    
    def test_admin_users_success(self, admin_token):
        """Test /api/admin/users returns users list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)


class TestUserProfile:
    """User profile endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_user_me_requires_auth(self):
        """Test /api/auth/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
    
    def test_user_me_success(self, user_token):
        """Test /api/auth/me returns user profile"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == USER_EMAIL


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
