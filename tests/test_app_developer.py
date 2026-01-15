"""
Test suite for App Developer feature
Tests: App submission, submissions list, featured checkout, featured apps
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = f"test_dev_{uuid.uuid4().hex[:8]}@test.io"
TEST_PASSWORD = "devpass123"
TEST_NAME = "Test Developer"


class TestAppDeveloperFeature:
    """Test suite for App Developer endpoints"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def auth_token(self, api_client):
        """Register a new user and get auth token"""
        # Register new user
        register_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        
        if register_response.status_code == 200:
            return register_response.json().get("access_token")
        elif register_response.status_code == 400:
            # User exists, try login
            login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if login_response.status_code == 200:
                return login_response.json().get("access_token")
        
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    @pytest.fixture(scope="class")
    def authenticated_client(self, api_client, auth_token):
        """Session with auth header"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        return api_client

    # ==================== HEALTH CHECK ====================
    
    def test_health_check(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")

    # ==================== APP SUBMISSION TESTS ====================
    
    def test_submit_app_success(self, authenticated_client):
        """Test successful app submission"""
        submission_data = {
            "app_name": f"TEST_App_{uuid.uuid4().hex[:6]}",
            "description": "A test application for automated testing",
            "category": "AI",
            "resources_required": 10.5,
            "monthly_subscription_fee": 29.99,
            "revenue_sharing": 70,
            "nodes_available": 100,
            "github_url": "https://github.com/test/repo",
            "documentation_url": "https://docs.test.com",
            "contact_email": "test@example.com",
            "terms_accepted": True
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/developer/submit", json=submission_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submission_id" in data
        assert data["status"] == "pending"
        assert "message" in data
        print(f"✓ App submission successful: {data['submission_id']}")
        
        # Store submission_id for later tests
        TestAppDeveloperFeature.submission_id = data["submission_id"]
    
    def test_submit_app_without_terms(self, authenticated_client):
        """Test app submission fails without accepting terms"""
        submission_data = {
            "app_name": "Test App No Terms",
            "description": "A test application",
            "category": "Storage",
            "resources_required": 5,
            "monthly_subscription_fee": 19.99,
            "revenue_sharing": 65,
            "nodes_available": 50,
            "contact_email": "test@example.com",
            "terms_accepted": False  # Not accepted
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/developer/submit", json=submission_data)
        assert response.status_code == 400
        assert "terms" in response.json().get("detail", "").lower()
        print("✓ Terms validation working correctly")
    
    def test_submit_app_missing_required_fields(self, authenticated_client):
        """Test app submission fails with missing required fields"""
        submission_data = {
            "app_name": "Incomplete App",
            # Missing required fields
            "terms_accepted": True
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/developer/submit", json=submission_data)
        assert response.status_code == 422  # Validation error
        print("✓ Required field validation working")
    
    def test_submit_app_invalid_email(self, authenticated_client):
        """Test app submission fails with invalid email"""
        submission_data = {
            "app_name": "Test App Invalid Email",
            "description": "A test application",
            "category": "DeFi",
            "resources_required": 5,
            "monthly_subscription_fee": 19.99,
            "revenue_sharing": 65,
            "nodes_available": 50,
            "contact_email": "invalid-email",  # Invalid email
            "terms_accepted": True
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/developer/submit", json=submission_data)
        assert response.status_code == 422  # Validation error for email
        print("✓ Email validation working")

    # ==================== GET SUBMISSIONS TESTS ====================
    
    def test_get_my_submissions(self, authenticated_client):
        """Test getting user's submissions"""
        response = authenticated_client.get(f"{BASE_URL}/api/developer/submissions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should have at least one submission from previous test
        if len(data) > 0:
            submission = data[0]
            assert "id" in submission
            assert "app_name" in submission
            assert "status" in submission
            assert "category" in submission
            assert "created_at" in submission
            print(f"✓ Got {len(data)} submissions")
        else:
            print("✓ Submissions endpoint working (no submissions yet)")
    
    def test_get_specific_submission(self, authenticated_client):
        """Test getting a specific submission"""
        if not hasattr(TestAppDeveloperFeature, 'submission_id'):
            pytest.skip("No submission_id from previous test")
        
        submission_id = TestAppDeveloperFeature.submission_id
        response = authenticated_client.get(f"{BASE_URL}/api/developer/submission/{submission_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == submission_id
        assert data["status"] == "pending"
        print(f"✓ Got specific submission: {submission_id}")
    
    def test_get_nonexistent_submission(self, authenticated_client):
        """Test getting a non-existent submission returns 404"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.get(f"{BASE_URL}/api/developer/submission/{fake_id}")
        assert response.status_code == 404
        print("✓ Non-existent submission returns 404")

    # ==================== FEATURED CHECKOUT TESTS ====================
    
    def test_featured_checkout_invalid_plan(self, authenticated_client):
        """Test featured checkout with invalid plan"""
        if not hasattr(TestAppDeveloperFeature, 'submission_id'):
            pytest.skip("No submission_id from previous test")
        
        response = authenticated_client.post(f"{BASE_URL}/api/developer/featured/checkout", json={
            "submission_id": TestAppDeveloperFeature.submission_id,
            "plan": "invalid_plan",
            "origin_url": "https://test.com"
        })
        assert response.status_code == 400
        assert "invalid plan" in response.json().get("detail", "").lower()
        print("✓ Invalid plan validation working")
    
    def test_featured_checkout_nonexistent_submission(self, authenticated_client):
        """Test featured checkout with non-existent submission"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.post(f"{BASE_URL}/api/developer/featured/checkout", json={
            "submission_id": fake_id,
            "plan": "30_days",
            "origin_url": "https://test.com"
        })
        assert response.status_code == 404
        print("✓ Non-existent submission checkout returns 404")
    
    def test_featured_checkout_30_days(self, authenticated_client):
        """Test featured checkout for 30 days plan"""
        if not hasattr(TestAppDeveloperFeature, 'submission_id'):
            pytest.skip("No submission_id from previous test")
        
        response = authenticated_client.post(f"{BASE_URL}/api/developer/featured/checkout", json={
            "submission_id": TestAppDeveloperFeature.submission_id,
            "plan": "30_days",
            "origin_url": "https://ecommerce-optio.preview.emergentagent.com"
        })
        
        # May return 200 with checkout_url or 400 if Stripe account not configured
        if response.status_code == 200:
            data = response.json()
            assert "checkout_url" in data
            assert "session_id" in data
            print(f"✓ Featured checkout 30 days created: {data['session_id']}")
        elif response.status_code == 400:
            # Expected if Stripe account needs configuration
            detail = response.json().get("detail", "")
            if "stripe" in detail.lower() or "account" in detail.lower() or "business name" in detail.lower():
                print("✓ Stripe checkout returns expected config error (Stripe account needs setup)")
            else:
                pytest.fail(f"Unexpected 400 error: {detail}")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")

    # ==================== FEATURED APPS TESTS ====================
    
    def test_get_featured_apps(self, api_client):
        """Test getting featured apps (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/apps/featured")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Featured apps may be empty if none are approved and featured
        if len(data) > 0:
            app = data[0]
            assert "id" in app
            assert "name" in app
            assert "is_featured" in app
            print(f"✓ Got {len(data)} featured apps")
        else:
            print("✓ Featured apps endpoint working (no featured apps currently)")

    # ==================== UPLOAD ENDPOINTS TESTS ====================
    
    def test_upload_icon_endpoint(self, authenticated_client):
        """Test icon upload endpoint exists"""
        if not hasattr(TestAppDeveloperFeature, 'submission_id'):
            pytest.skip("No submission_id from previous test")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/developer/upload-icon/{TestAppDeveloperFeature.submission_id}"
        )
        # Should return 200 (simulated upload)
        assert response.status_code == 200
        data = response.json()
        assert "icon_url" in data
        print("✓ Icon upload endpoint working")
    
    def test_upload_code_endpoint(self, authenticated_client):
        """Test code upload endpoint exists"""
        if not hasattr(TestAppDeveloperFeature, 'submission_id'):
            pytest.skip("No submission_id from previous test")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/developer/upload-code/{TestAppDeveloperFeature.submission_id}"
        )
        # Should return 200 (simulated upload)
        assert response.status_code == 200
        data = response.json()
        assert "code_url" in data
        print("✓ Code upload endpoint working")

    # ==================== UNAUTHORIZED ACCESS TESTS ====================
    
    def test_submit_app_unauthorized(self, api_client):
        """Test app submission without auth fails"""
        # Remove auth header if present
        api_client.headers.pop("Authorization", None)
        
        response = api_client.post(f"{BASE_URL}/api/developer/submit", json={
            "app_name": "Unauthorized App",
            "description": "Test",
            "category": "AI",
            "resources_required": 5,
            "monthly_subscription_fee": 9.99,
            "revenue_sharing": 50,
            "nodes_available": 10,
            "contact_email": "test@test.com",
            "terms_accepted": True
        })
        assert response.status_code in [401, 403]
        print("✓ Unauthorized submission blocked")
    
    def test_get_submissions_unauthorized(self, api_client):
        """Test getting submissions without auth fails"""
        api_client.headers.pop("Authorization", None)
        
        response = api_client.get(f"{BASE_URL}/api/developer/submissions")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized submissions access blocked")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
