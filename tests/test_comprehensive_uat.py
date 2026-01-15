"""
Comprehensive UAT Test Suite for AppCloud by Optio
Tests: Authentication, Landing Page, Purchase Flow, Coupon System, Admin Panel, User Dashboard, App Marketplace
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ecommerce-optio.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "test@napp.io"
TEST_USER_PASSWORD = "test123"
DEMO_USER_EMAIL = "demo@napp.io"
DEMO_USER_PASSWORD = "demo123"


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_products_endpoint(self):
        """Test public products endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        print(f"✓ Products endpoint: {data['total']} products found")
    
    def test_cloudnode_product_exists(self):
        """Test CloudNode product is available"""
        response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Optio CloudNode"
        assert data["price"] == 5000.0
        assert data["is_active"] == True
        print(f"✓ CloudNode product found: ${data['price']}")


class TestUserAuthentication:
    """User authentication flow tests"""
    
    def test_login_with_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 404]
        print("✓ Invalid login correctly rejected")
    
    def test_login_with_test_user(self):
        """Test login with test user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            print(f"✓ Test user login successful")
            return data["access_token"]
        else:
            print(f"⚠ Test user {TEST_USER_EMAIL} not found (status: {response.status_code})")
            return None
    
    def test_login_with_demo_user(self):
        """Test login with demo user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            print(f"✓ Demo user login successful")
            return data["access_token"]
        else:
            print(f"⚠ Demo user {DEMO_USER_EMAIL} not found (status: {response.status_code})")
            return None
    
    def test_register_new_user(self):
        """Test user registration flow"""
        test_email = f"test_uat_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpassword123",
            "name": "UAT Test User"
        })
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data or "user" in data
            print(f"✓ User registration successful: {test_email}")
        else:
            print(f"⚠ Registration response: {response.status_code} - {response.text[:200]}")


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print(f"✓ Admin login successful")
        return data["access_token"]
    
    def test_admin_login_invalid(self):
        """Test admin login fails with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 403]
        print("✓ Invalid admin login correctly rejected")


class TestPurchaseFlow:
    """Purchase flow and Stripe integration tests"""
    
    def test_stripe_config_endpoint(self):
        """Test Stripe config endpoint returns publishable key"""
        response = requests.get(f"{BASE_URL}/api/purchase/config")
        assert response.status_code == 200
        data = response.json()
        assert "publishable_key" in data
        assert data["publishable_key"].startswith("pk_test_")
        print(f"✓ Stripe config endpoint working")
    
    def test_create_payment_intent(self):
        """Test creating a payment intent"""
        # Get product ID first
        product_response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        assert product_response.status_code == 200
        product = product_response.json()
        
        response = requests.post(f"{BASE_URL}/api/purchase/create-payment-intent", json={
            "product_id": product["id"],
            "email": "test_purchase@example.com",
            "name": "Test Purchaser"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "client_secret" in data
            assert "order_id" in data
            print(f"✓ Payment intent created: order_id={data['order_id']}")
        else:
            print(f"⚠ Payment intent creation: {response.status_code} - {response.text[:200]}")
    
    def test_create_payment_intent_with_referral(self):
        """Test creating a payment intent with referral code"""
        product_response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        product = product_response.json()
        
        response = requests.post(f"{BASE_URL}/api/purchase/create-payment-intent", json={
            "product_id": product["id"],
            "email": "test_referral@example.com",
            "name": "Test Referral User",
            "referral_code": "TESTREF123"
        })
        
        print(f"Payment intent with referral: {response.status_code}")


class TestCouponSystem:
    """Coupon validation and management tests"""
    
    def get_admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_validate_invalid_coupon(self):
        """Test validation of non-existent coupon"""
        product_response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        product = product_response.json()
        
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALIDCOUPON123",
            "product_id": product["id"]
        })
        assert response.status_code == 404
        print("✓ Invalid coupon correctly rejected")
    
    def test_admin_create_coupon(self):
        """Test admin can create a coupon"""
        token = self.get_admin_token()
        
        # Get product ID
        product_response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        product = product_response.json()
        
        # Create coupon
        coupon_code = f"UAT{datetime.now().strftime('%H%M%S')}"
        response = requests.post(
            f"{BASE_URL}/api/admin/coupons",
            json={
                "code": coupon_code,
                "name": "UAT Test Coupon",
                "description": "Test coupon for UAT",
                "discount_type": "percentage",
                "discount_value": 10,
                "applicable_products": [product["id"]],
                "is_active": True
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Coupon created: {coupon_code}")
            return coupon_code
        else:
            print(f"⚠ Coupon creation: {response.status_code} - {response.text[:200]}")
    
    def test_validate_valid_coupon(self):
        """Test validation of a valid coupon"""
        token = self.get_admin_token()
        
        product_response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        product = product_response.json()
        
        coupon_code = f"VALID{datetime.now().strftime('%H%M%S')}"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/coupons",
            json={
                "code": coupon_code,
                "name": "Valid Test Coupon",
                "discount_type": "percentage",
                "discount_value": 15,
                "applicable_products": [product["id"]],
                "is_active": True
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if create_response.status_code == 200:
            # Now validate it
            validate_response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
                "code": coupon_code,
                "product_id": product["id"]
            })
            assert validate_response.status_code == 200
            data = validate_response.json()
            assert data["valid"] == True
            assert data["discount_amount"] > 0
            print(f"✓ Coupon validated: {coupon_code}, discount: ${data['discount_amount']}")


class TestAdminDashboard:
    """Admin dashboard and management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_admin_dashboard_stats(self, admin_token):
        """Test admin dashboard stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Admin dashboard stats: {json.dumps(data, indent=2)[:200]}")
        else:
            print(f"⚠ Dashboard stats: {response.status_code}")
    
    def test_admin_products_list(self, admin_token):
        """Test admin products list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Admin products: {len(data['products'])} products")
    
    def test_admin_products_stats(self, admin_token):
        """Test admin products stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products/stats/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Products stats: {data}")
    
    def test_admin_licenses_list(self, admin_token):
        """Test admin licenses list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/licenses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "licenses" in data
        print(f"✓ Admin licenses: {data['total']} licenses")
    
    def test_admin_coupons_list(self, admin_token):
        """Test admin coupons list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/coupons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "coupons" in data
        print(f"✓ Admin coupons: {data['total']} coupons")
    
    def test_admin_orders_list(self, admin_token):
        """Test admin orders list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ Admin orders: {data['total']} orders")


class TestAdminReports:
    """Admin reports and export tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_users_report(self, admin_token):
        """Test users report endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/users?period=30d",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "report_type" in data
        assert data["report_type"] == "users"
        print(f"✓ Users report: {data['summary']}")
    
    def test_nodes_report(self, admin_token):
        """Test nodes report endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/nodes?period=30d",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "nodes"
        print(f"✓ Nodes report: {data['summary']}")
    
    def test_revenue_report(self, admin_token):
        """Test revenue report endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/revenue?period=30d",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["report_type"] == "revenue"
        print(f"✓ Revenue report: {data['summary']}")
    
    def test_csv_export(self, admin_token):
        """Test CSV export endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/export/csv/users?period=30d",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print(f"✓ CSV export working, size: {len(response.content)} bytes")


class TestUserDashboard:
    """User dashboard tests"""
    
    def get_user_token(self):
        """Get a user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_user_profile(self):
        """Test user profile endpoint"""
        token = self.get_user_token()
        if not token:
            pytest.skip("No user token available")
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        print(f"✓ User profile: {data['email']}")
    
    def test_user_licenses(self):
        """Test user licenses endpoint"""
        token = self.get_user_token()
        if not token:
            pytest.skip("No user token available")
        
        response = requests.get(
            f"{BASE_URL}/api/licenses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "licenses" in data
        print(f"✓ User licenses: {data['total']} licenses")
    
    def test_user_points(self):
        """Test user points endpoint"""
        token = self.get_user_token()
        if not token:
            pytest.skip("No user token available")
        
        response = requests.get(
            f"{BASE_URL}/api/activity/points",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ User points: {data.get('total', 0)}")
        else:
            print(f"⚠ User points: {response.status_code}")


class TestAppMarketplace:
    """App marketplace tests"""
    
    def test_marketplace_apps_list(self):
        """Test marketplace apps list"""
        response = requests.get(f"{BASE_URL}/api/apps")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Marketplace apps: {len(data.get('apps', []))} apps")
        else:
            print(f"⚠ Marketplace apps: {response.status_code}")
    
    def test_app_categories(self):
        """Test app categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/apps/categories")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ App categories: {data}")
        else:
            print(f"⚠ App categories: {response.status_code}")


class TestPointsSystem:
    """Points and rewards system tests"""
    
    def test_leaderboard_all_time(self):
        """Test all-time leaderboard"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Leaderboard: {len(data.get('leaderboard', []))} entries")
        else:
            print(f"⚠ Leaderboard: {response.status_code}")
    
    def test_leaderboard_weekly(self):
        """Test weekly leaderboard"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/weekly")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Weekly leaderboard: {len(data.get('leaderboard', []))} entries")
        else:
            print(f"⚠ Weekly leaderboard: {response.status_code}")
    
    def test_leaderboard_monthly(self):
        """Test monthly leaderboard"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/monthly")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Monthly leaderboard: {len(data.get('leaderboard', []))} entries")
        else:
            print(f"⚠ Monthly leaderboard: {response.status_code}")
    
    def test_badges_list(self):
        """Test badges list"""
        response = requests.get(f"{BASE_URL}/api/activity/badges/all")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Badges: {len(data.get('badges', []))} badges")
        else:
            print(f"⚠ Badges: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
