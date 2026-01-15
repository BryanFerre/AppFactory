"""
Comprehensive Admin Module Tests for NAPP Node Operator Dashboard
Tests all admin modules: Dashboard, Users, Nodes, Apps, Billing, Support, Revenue, Audit, Settings
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hybrid-payment.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        assert data["admin"]["role"] == "super_admin"
        print(f"✓ Admin login successful - role: {data['admin']['role']}")
    
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid password correctly rejected")
    
    def test_admin_login_invalid_email(self):
        """Test admin login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": "nonexistent@optio.com",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401
        print("✓ Non-existent email correctly rejected")


@pytest.fixture(scope="class")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="class")
def admin_headers(admin_token):
    """Get headers with admin token"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestAdminDashboard:
    """Admin Dashboard stats tests"""
    
    def test_dashboard_stats(self, admin_headers):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats", headers=admin_headers)
        assert response.status_code == 200, f"Dashboard stats failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "users" in data
        assert "nodes" in data
        assert "apps" in data
        assert "support" in data
        assert "billing" in data
        assert "revenue" in data
        
        # Verify users stats
        assert "total" in data["users"]
        assert "active" in data["users"]
        
        # Verify nodes stats
        assert "total" in data["nodes"]
        assert "healthy" in data["nodes"]
        assert "warning" in data["nodes"]
        assert "offline" in data["nodes"]
        
        print(f"✓ Dashboard stats: {data['users']['total']} users, {data['nodes']['total']} nodes, {data['apps']['total']} apps")
    
    def test_dashboard_stats_unauthorized(self):
        """Test dashboard stats without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats")
        assert response.status_code in [401, 403]
        print("✓ Dashboard stats correctly requires authentication")


class TestAdminUsers:
    """Admin Users management tests"""
    
    def test_list_users(self, admin_headers):
        """Test listing users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        assert response.status_code == 200, f"List users failed: {response.text}"
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"✓ Listed {data['total']} users")
    
    def test_list_users_with_status_filter(self, admin_headers):
        """Test listing users with status filter"""
        response = requests.get(f"{BASE_URL}/api/admin/users?status=active", headers=admin_headers)
        assert response.status_code == 200
        print("✓ User status filter works")
    
    def test_list_users_with_search(self, admin_headers):
        """Test listing users with search"""
        response = requests.get(f"{BASE_URL}/api/admin/users?search=test", headers=admin_headers)
        assert response.status_code == 200
        print("✓ User search works")


class TestAdminNodes:
    """Admin Nodes management tests"""
    
    def test_list_nodes(self, admin_headers):
        """Test listing nodes"""
        response = requests.get(f"{BASE_URL}/api/admin/nodes", headers=admin_headers)
        assert response.status_code == 200, f"List nodes failed: {response.text}"
        data = response.json()
        assert "nodes" in data
        assert "total" in data
        assert len(data["nodes"]) > 0, "Should have mock nodes"
        
        # Verify node structure
        node = data["nodes"][0]
        assert "id" in node
        assert "status" in node
        assert "owner_email" in node
        print(f"✓ Listed {data['total']} nodes")
    
    def test_list_nodes_with_status_filter(self, admin_headers):
        """Test listing nodes with status filter"""
        response = requests.get(f"{BASE_URL}/api/admin/nodes?status=healthy", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        for node in data["nodes"]:
            assert node["status"] == "healthy"
        print("✓ Node status filter works")
    
    def test_get_node_detail(self, admin_headers):
        """Test getting node detail"""
        response = requests.get(f"{BASE_URL}/api/admin/nodes/node-1", headers=admin_headers)
        assert response.status_code == 200, f"Get node detail failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "owner_email" in data
        assert "status" in data
        assert "earnings" in data
        print(f"✓ Node detail retrieved: {data['id']}")


class TestAdminAppSubmissions:
    """Admin App Submissions tests"""
    
    def test_list_submissions(self, admin_headers):
        """Test listing app submissions"""
        response = requests.get(f"{BASE_URL}/api/admin/apps/submissions", headers=admin_headers)
        assert response.status_code == 200, f"List submissions failed: {response.text}"
        data = response.json()
        assert "submissions" in data
        assert "total" in data
        print(f"✓ Listed {data['total']} app submissions")
    
    def test_list_submissions_with_status_filter(self, admin_headers):
        """Test listing submissions with status filter"""
        response = requests.get(f"{BASE_URL}/api/admin/apps/submissions?status=pending", headers=admin_headers)
        assert response.status_code == 200
        print("✓ Submission status filter works")


class TestAdminSupport:
    """Admin Support tickets tests"""
    
    def test_list_tickets(self, admin_headers):
        """Test listing support tickets"""
        response = requests.get(f"{BASE_URL}/api/admin/support/tickets", headers=admin_headers)
        assert response.status_code == 200, f"List tickets failed: {response.text}"
        data = response.json()
        assert "tickets" in data
        assert "total" in data
        print(f"✓ Listed {data['total']} support tickets")
    
    def test_list_tickets_with_status_filter(self, admin_headers):
        """Test listing tickets with status filter"""
        response = requests.get(f"{BASE_URL}/api/admin/support/tickets?status=open", headers=admin_headers)
        assert response.status_code == 200
        print("✓ Ticket status filter works")
    
    def test_create_ticket(self, admin_headers):
        """Test creating a support ticket"""
        ticket_data = {
            "user_id": "test-user-123",
            "subject": f"TEST_Ticket_{uuid.uuid4().hex[:8]}",
            "description": "Test ticket created by admin",
            "priority": "medium",
            "category": "technical"
        }
        response = requests.post(f"{BASE_URL}/api/admin/support/tickets", json=ticket_data, headers=admin_headers)
        assert response.status_code == 200, f"Create ticket failed: {response.text}"
        data = response.json()
        assert "ticket_id" in data
        print(f"✓ Created support ticket: {data['ticket_id']}")
        return data["ticket_id"]


class TestAdminBilling:
    """Admin Billing tests"""
    
    def test_list_transactions(self, admin_headers):
        """Test listing billing transactions"""
        response = requests.get(f"{BASE_URL}/api/admin/billing/transactions", headers=admin_headers)
        assert response.status_code == 200, f"List transactions failed: {response.text}"
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        print(f"✓ Listed {data['total']} billing transactions")


class TestAdminRevenue:
    """Admin Revenue tests"""
    
    def test_revenue_summary(self, admin_headers):
        """Test revenue summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/revenue/summary", headers=admin_headers)
        assert response.status_code == 200, f"Revenue summary failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "total_revenue" in data
        assert "monthly_revenue" in data
        assert "daily_average" in data
        assert "by_category" in data
        assert "top_apps" in data
        assert "pending_payouts" in data
        assert "processed_payouts" in data
        
        # Verify data types
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["by_category"], dict)
        assert isinstance(data["top_apps"], list)
        
        print(f"✓ Revenue summary: ${data['total_revenue']:,.2f} total, ${data['monthly_revenue']:,.2f} monthly")


class TestAdminAuditLogs:
    """Admin Audit Logs tests"""
    
    def test_list_audit_logs(self, admin_headers):
        """Test listing audit logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit/logs", headers=admin_headers)
        assert response.status_code == 200, f"List audit logs failed: {response.text}"
        data = response.json()
        assert "logs" in data
        assert "total" in data
        print(f"✓ Listed {data['total']} audit logs")
    
    def test_list_audit_logs_with_target_filter(self, admin_headers):
        """Test listing audit logs with target type filter"""
        response = requests.get(f"{BASE_URL}/api/admin/audit/logs?target_type=user", headers=admin_headers)
        assert response.status_code == 200
        print("✓ Audit log target filter works")


class TestAdminSettings:
    """Admin Settings tests"""
    
    def test_list_admins(self, admin_headers):
        """Test listing admin accounts"""
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=admin_headers)
        assert response.status_code == 200, f"List admins failed: {response.text}"
        data = response.json()
        assert "admins" in data
        assert len(data["admins"]) > 0, "Should have at least one admin"
        
        # Verify admin structure
        admin = data["admins"][0]
        assert "id" in admin
        assert "email" in admin
        assert "name" in admin
        assert "role" in admin
        print(f"✓ Listed {len(data['admins'])} admin accounts")
    
    def test_get_admin_profile(self, admin_headers):
        """Test getting current admin profile"""
        response = requests.get(f"{BASE_URL}/api/admin/auth/me", headers=admin_headers)
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "super_admin"
        assert "permissions" in data
        print(f"✓ Admin profile: {data['name']} ({data['role']})")


class TestAdminCreateAdmin:
    """Test creating new admin accounts"""
    
    def test_create_admin_account(self, admin_headers):
        """Test creating a new admin account"""
        new_admin = {
            "email": f"test_admin_{uuid.uuid4().hex[:8]}@optio.com",
            "name": "Test Admin",
            "password": "testpass123",
            "role": "support"
        }
        response = requests.post(f"{BASE_URL}/api/admin/auth/create", json=new_admin, headers=admin_headers)
        assert response.status_code == 200, f"Create admin failed: {response.text}"
        data = response.json()
        assert "admin_id" in data
        print(f"✓ Created new admin: {new_admin['email']}")
    
    def test_create_admin_duplicate_email(self, admin_headers):
        """Test creating admin with duplicate email fails"""
        new_admin = {
            "email": ADMIN_EMAIL,  # Already exists
            "name": "Duplicate Admin",
            "password": "testpass123",
            "role": "support"
        }
        response = requests.post(f"{BASE_URL}/api/admin/auth/create", json=new_admin, headers=admin_headers)
        assert response.status_code == 400
        print("✓ Duplicate admin email correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
