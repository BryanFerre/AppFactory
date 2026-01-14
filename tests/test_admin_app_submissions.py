"""
Test Admin App Submissions Feature
Tests for admin login, app submissions listing, review actions (approve/reject/request_changes)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nodeapp-control.preview.emergentagent.com')

# Admin credentials
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"

# Test user credentials for creating submissions
TEST_USER_EMAIL = f"test_admin_review_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Test Developer"


class TestAdminLogin:
    """Test admin authentication flow"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "admin" in data, "Response should contain admin info"
        assert data["admin"]["email"] == ADMIN_EMAIL
        assert data["admin"]["role"] == "super_admin"
        assert "permissions" in data["admin"]
        print(f"SUCCESS: Admin login successful for {ADMIN_EMAIL}")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Invalid credentials correctly rejected")
    
    def test_admin_login_nonexistent_email(self):
        """Test admin login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": "nonexistent@optio.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("SUCCESS: Non-existent admin correctly rejected")


class TestAdminAppSubmissions:
    """Test admin app submissions endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and test user for each test"""
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create test user and get token
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        })
        
        if register_response.status_code == 200:
            self.user_token = register_response.json()["access_token"]
        else:
            # User might already exist, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_response.status_code == 200:
                self.user_token = login_response.json()["access_token"]
            else:
                pytest.skip("Could not create or login test user")
        
        self.user_headers = {"Authorization": f"Bearer {self.user_token}"}
    
    def test_list_app_submissions(self):
        """Test listing all app submissions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions",
            headers=self.admin_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submissions" in data, "Response should contain submissions array"
        assert "total" in data, "Response should contain total count"
        assert isinstance(data["submissions"], list)
        print(f"SUCCESS: Listed {len(data['submissions'])} submissions (total: {data['total']})")
    
    def test_list_submissions_with_status_filter(self):
        """Test filtering submissions by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions?status=pending",
            headers=self.admin_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # All returned submissions should have pending status
        for sub in data["submissions"]:
            assert sub["status"] == "pending", f"Expected pending status, got {sub['status']}"
        print(f"SUCCESS: Filtered {len(data['submissions'])} pending submissions")
    
    def test_list_submissions_unauthorized(self):
        """Test that unauthorized access is blocked"""
        response = requests.get(f"{BASE_URL}/api/admin/apps/submissions")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("SUCCESS: Unauthorized access correctly blocked")
    
    def test_create_and_view_submission_detail(self):
        """Test creating a submission and viewing its details as admin"""
        # Create a new submission as developer
        submission_data = {
            "app_name": f"TEST_AdminReview_{uuid.uuid4().hex[:6]}",
            "description": "Test app for admin review testing",
            "category": "Productivity",
            "resources_required": 5.0,
            "monthly_subscription_fee": 9.99,
            "revenue_sharing": 70.0,
            "nodes_available": 100,
            "github_url": "https://github.com/test/test-app",
            "documentation_url": "https://docs.test.com",
            "contact_email": TEST_USER_EMAIL,
            "terms_accepted": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/developer/submit",
            json=submission_data,
            headers=self.user_headers
        )
        
        assert create_response.status_code == 200, f"Failed to create submission: {create_response.text}"
        submission_id = create_response.json()["submission_id"]
        print(f"Created test submission: {submission_id}")
        
        # View submission detail as admin
        detail_response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}",
            headers=self.admin_headers
        )
        
        assert detail_response.status_code == 200, f"Expected 200, got {detail_response.status_code}"
        
        detail = detail_response.json()
        assert detail["id"] == submission_id
        assert detail["app_name"] == submission_data["app_name"]
        assert detail["status"] == "pending"
        assert "developer" in detail, "Should include developer info"
        assert "review_history" in detail, "Should include review history"
        print(f"SUCCESS: Retrieved submission detail with developer info")
        
        return submission_id
    
    def test_view_nonexistent_submission(self):
        """Test viewing a non-existent submission"""
        response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions/nonexistent-id",
            headers=self.admin_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Non-existent submission returns 404")


class TestAdminReviewActions:
    """Test admin review actions (approve, reject, request_changes)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and create test submission"""
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json()["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create test user
        test_email = f"test_review_{uuid.uuid4().hex[:8]}@test.com"
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Developer"
        })
        
        if register_response.status_code == 200:
            self.user_token = register_response.json()["access_token"]
        else:
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "testpass123"
            })
            if login_response.status_code == 200:
                self.user_token = login_response.json()["access_token"]
            else:
                pytest.skip("Could not create test user")
        
        self.user_headers = {"Authorization": f"Bearer {self.user_token}"}
        self.test_email = test_email
    
    def _create_test_submission(self, suffix=""):
        """Helper to create a test submission"""
        submission_data = {
            "app_name": f"TEST_Review_{suffix}_{uuid.uuid4().hex[:6]}",
            "description": "Test app for review action testing",
            "category": "Productivity",
            "resources_required": 5.0,
            "monthly_subscription_fee": 9.99,
            "revenue_sharing": 70.0,
            "nodes_available": 100,
            "github_url": "https://github.com/test/test-app",
            "contact_email": self.test_email,
            "terms_accepted": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/developer/submit",
            json=submission_data,
            headers=self.user_headers
        )
        
        assert response.status_code == 200, f"Failed to create submission: {response.text}"
        return response.json()["submission_id"]
    
    def test_approve_submission(self):
        """Test approving a pending submission"""
        submission_id = self._create_test_submission("approve")
        
        # Approve the submission
        review_response = requests.post(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}/review",
            json={
                "action": "approve",
                "compliance_notes": "App meets all requirements"
            },
            headers=self.admin_headers
        )
        
        assert review_response.status_code == 200, f"Expected 200, got {review_response.status_code}: {review_response.text}"
        
        data = review_response.json()
        assert data["new_status"] == "approved"
        print(f"SUCCESS: Submission approved, new status: {data['new_status']}")
        
        # Verify status changed
        detail_response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}",
            headers=self.admin_headers
        )
        
        assert detail_response.status_code == 200
        detail = detail_response.json()
        assert detail["status"] == "approved", f"Expected approved, got {detail['status']}"
        assert len(detail["review_history"]) > 0, "Should have review history"
        print("SUCCESS: Verified submission status is approved with review history")
    
    def test_reject_submission_with_reason(self):
        """Test rejecting a submission with reason"""
        submission_id = self._create_test_submission("reject")
        
        # Reject the submission
        review_response = requests.post(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}/review",
            json={
                "action": "reject",
                "reason": "App does not meet security requirements",
                "compliance_notes": "Failed security audit"
            },
            headers=self.admin_headers
        )
        
        assert review_response.status_code == 200, f"Expected 200, got {review_response.status_code}: {review_response.text}"
        
        data = review_response.json()
        assert data["new_status"] == "rejected"
        print(f"SUCCESS: Submission rejected, new status: {data['new_status']}")
        
        # Verify status and reason
        detail_response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}",
            headers=self.admin_headers
        )
        
        detail = detail_response.json()
        assert detail["status"] == "rejected"
        assert detail.get("review_reason") == "App does not meet security requirements"
        print("SUCCESS: Verified rejection with reason stored")
    
    def test_request_changes_submission(self):
        """Test requesting changes on a submission"""
        submission_id = self._create_test_submission("changes")
        
        # Request changes
        review_response = requests.post(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}/review",
            json={
                "action": "request_changes",
                "reason": "Please update documentation and add more details about data handling",
                "compliance_notes": "Needs GDPR compliance documentation"
            },
            headers=self.admin_headers
        )
        
        assert review_response.status_code == 200, f"Expected 200, got {review_response.status_code}: {review_response.text}"
        
        data = review_response.json()
        assert data["new_status"] == "needs_revision"
        print(f"SUCCESS: Changes requested, new status: {data['new_status']}")
        
        # Verify status
        detail_response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}",
            headers=self.admin_headers
        )
        
        detail = detail_response.json()
        assert detail["status"] == "needs_revision"
        print("SUCCESS: Verified status is needs_revision")
    
    def test_invalid_review_action(self):
        """Test that invalid review actions are rejected"""
        submission_id = self._create_test_submission("invalid")
        
        review_response = requests.post(
            f"{BASE_URL}/api/admin/apps/submissions/{submission_id}/review",
            json={
                "action": "invalid_action",
                "reason": "Test"
            },
            headers=self.admin_headers
        )
        
        assert review_response.status_code == 400, f"Expected 400, got {review_response.status_code}"
        print("SUCCESS: Invalid action correctly rejected")
    
    def test_review_nonexistent_submission(self):
        """Test reviewing a non-existent submission"""
        review_response = requests.post(
            f"{BASE_URL}/api/admin/apps/submissions/nonexistent-id/review",
            json={
                "action": "approve"
            },
            headers=self.admin_headers
        )
        
        assert review_response.status_code == 404, f"Expected 404, got {review_response.status_code}"
        print("SUCCESS: Non-existent submission review returns 404")


class TestAdminProfile:
    """Test admin profile endpoint"""
    
    def test_get_admin_profile(self):
        """Test getting admin profile with valid token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get profile
        profile_response = requests.get(
            f"{BASE_URL}/api/admin/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert profile_response.status_code == 200, f"Expected 200, got {profile_response.status_code}"
        
        profile = profile_response.json()
        assert profile["email"] == ADMIN_EMAIL
        assert profile["role"] == "super_admin"
        assert "permissions" in profile
        print(f"SUCCESS: Retrieved admin profile for {profile['email']}")
    
    def test_get_admin_profile_unauthorized(self):
        """Test that unauthorized access to profile is blocked"""
        response = requests.get(f"{BASE_URL}/api/admin/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("SUCCESS: Unauthorized profile access blocked")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
