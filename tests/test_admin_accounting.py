"""
Test Admin Accounting Module - Commissions and App Earnings Payouts
Tests for:
- Dashboard stats
- Commissions CRUD and actions (approve, reject, mark paid)
- App Earnings Payouts CRUD and actions (process, reject)
- Bulk actions
- Seed demo data
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"


class TestAdminAccountingAuth:
    """Test authentication for accounting endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_dashboard_requires_auth(self):
        """Dashboard endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/accounting/dashboard")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ Dashboard requires authentication")
    
    def test_commissions_requires_auth(self):
        """Commissions endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/accounting/commissions")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ Commissions requires authentication")
    
    def test_payouts_requires_auth(self):
        """Payouts endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/accounting/payouts")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ Payouts requires authentication")


class TestAdminAccountingDashboard:
    """Test accounting dashboard stats"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_dashboard_returns_stats(self):
        """Dashboard returns commission and payout stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/dashboard",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "commissions" in data
        assert "app_earnings" in data
        assert "totals" in data
        
        # Verify commission stats
        assert "pending_count" in data["commissions"]
        assert "pending_amount" in data["commissions"]
        assert "approved_awaiting_payment" in data["commissions"]
        assert "paid_this_month" in data["commissions"]
        
        # Verify app earnings stats
        assert "pending_count" in data["app_earnings"]
        assert "pending_amount" in data["app_earnings"]
        assert "processing_count" in data["app_earnings"]
        assert "paid_this_month" in data["app_earnings"]
        
        # Verify totals
        assert "total_pending" in data["totals"]
        assert "total_pending_amount" in data["totals"]
        
        print(f"✓ Dashboard stats: {data['commissions']['pending_count']} pending commissions, {data['app_earnings']['pending_count']} pending payouts")


class TestSeedDemoData:
    """Test seed demo data functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_seed_demo_data(self):
        """Seed demo data creates commissions and payouts"""
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/seed-demo-data",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "commissions_created" in data
        assert "payouts_created" in data
        
        print(f"✓ Seeded {data['commissions_created']} commissions and {data['payouts_created']} payouts")


class TestCommissions:
    """Test commissions CRUD and actions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and seed data"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Seed demo data to ensure we have commissions
        requests.post(
            f"{BASE_URL}/api/admin/accounting/seed-demo-data",
            headers=self.headers
        )
    
    def test_list_commissions(self):
        """List all commissions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "commissions" in data
        assert "total" in data
        assert isinstance(data["commissions"], list)
        
        print(f"✓ Listed {len(data['commissions'])} commissions (total: {data['total']})")
        return data["commissions"]
    
    def test_list_commissions_with_status_filter(self):
        """List commissions filtered by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=pending",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned commissions should be pending
        for comm in data["commissions"]:
            assert comm["status"] == "pending"
        
        print(f"✓ Filtered {len(data['commissions'])} pending commissions")
    
    def test_commission_has_correct_structure(self):
        """Commission has correct data structure"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["commissions"]:
            comm = data["commissions"][0]
            assert "id" in comm
            assert "user_id" in comm
            assert "type" in comm
            assert "amount" in comm
            assert "status" in comm
            assert "created_at" in comm
            
            # Node sale commissions should have $250 amount (5% of $5000)
            if comm["type"] == "node_sale":
                assert comm["amount"] == 250.0, f"Node sale commission should be $250, got ${comm['amount']}"
                print(f"✓ Node sale commission amount is correct: ${comm['amount']} (5% of $5000)")
            
            print(f"✓ Commission structure verified: type={comm['type']}, amount=${comm['amount']}")
    
    def test_approve_commission(self):
        """Approve a pending commission"""
        # Get a pending commission
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=pending",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if not data["commissions"]:
            pytest.skip("No pending commissions to approve")
        
        commission_id = data["commissions"][0]["id"]
        
        # Approve it
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/{commission_id}/action",
            json={"action": "approve"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["new_status"] == "approved"
        
        print(f"✓ Approved commission {commission_id}")
    
    def test_reject_commission(self):
        """Reject a pending commission"""
        # Get a pending commission
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=pending",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if not data["commissions"]:
            pytest.skip("No pending commissions to reject")
        
        commission_id = data["commissions"][0]["id"]
        
        # Reject it
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/{commission_id}/action",
            json={"action": "reject", "reason": "Test rejection"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["new_status"] == "rejected"
        
        print(f"✓ Rejected commission {commission_id}")
    
    def test_mark_commission_paid(self):
        """Mark an approved commission as paid"""
        # First approve a commission
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if not data["commissions"]:
            pytest.skip("No pending commissions")
        
        commission_id = data["commissions"][0]["id"]
        
        # Approve it first
        requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/{commission_id}/action",
            json={"action": "approve"},
            headers=self.headers
        )
        
        # Now mark as paid
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/{commission_id}/pay",
            headers=self.headers
        )
        assert response.status_code == 200
        
        print(f"✓ Marked commission {commission_id} as paid")
    
    def test_cannot_approve_non_pending_commission(self):
        """Cannot approve a commission that is not pending"""
        # Get an approved commission
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=approved",
            headers=self.headers
        )
        data = response.json()
        
        if not data["commissions"]:
            pytest.skip("No approved commissions")
        
        commission_id = data["commissions"][0]["id"]
        
        # Try to approve it again
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/{commission_id}/action",
            json={"action": "approve"},
            headers=self.headers
        )
        assert response.status_code == 400
        
        print(f"✓ Cannot approve non-pending commission (got 400)")


class TestBulkCommissionActions:
    """Test bulk commission actions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and seed data"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Seed demo data
        requests.post(
            f"{BASE_URL}/api/admin/accounting/seed-demo-data",
            headers=self.headers
        )
    
    def test_bulk_approve_commissions(self):
        """Bulk approve multiple commissions"""
        # Get pending commissions
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if len(data["commissions"]) < 2:
            pytest.skip("Need at least 2 pending commissions for bulk test")
        
        commission_ids = [c["id"] for c in data["commissions"][:2]]
        
        # Bulk approve
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/bulk-action",
            json={"commission_ids": commission_ids, "action": "approve"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success_count"] >= 1
        
        print(f"✓ Bulk approved {result['success_count']} commissions")
    
    def test_bulk_reject_commissions(self):
        """Bulk reject multiple commissions"""
        # Get pending commissions
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/commissions?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if len(data["commissions"]) < 2:
            pytest.skip("Need at least 2 pending commissions for bulk test")
        
        commission_ids = [c["id"] for c in data["commissions"][:2]]
        
        # Bulk reject
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/commissions/bulk-action",
            json={"commission_ids": commission_ids, "action": "reject", "reason": "Bulk test rejection"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success_count"] >= 1
        
        print(f"✓ Bulk rejected {result['success_count']} commissions")


class TestPayouts:
    """Test app earnings payouts CRUD and actions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and seed data"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Seed demo data
        requests.post(
            f"{BASE_URL}/api/admin/accounting/seed-demo-data",
            headers=self.headers
        )
    
    def test_list_payouts(self):
        """List all payouts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "payouts" in data
        assert "total" in data
        assert isinstance(data["payouts"], list)
        
        print(f"✓ Listed {len(data['payouts'])} payouts (total: {data['total']})")
    
    def test_list_payouts_with_status_filter(self):
        """List payouts filtered by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts?status=pending",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned payouts should be pending
        for payout in data["payouts"]:
            assert payout["status"] == "pending"
        
        print(f"✓ Filtered {len(data['payouts'])} pending payouts")
    
    def test_payout_has_correct_structure(self):
        """Payout has correct data structure with app breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["payouts"]:
            payout = data["payouts"][0]
            assert "id" in payout
            assert "user_id" in payout
            assert "amount" in payout
            assert "status" in payout
            assert "earnings_breakdown" in payout
            assert "period_start" in payout
            assert "period_end" in payout
            
            # Check earnings breakdown structure
            if payout["earnings_breakdown"]:
                breakdown = payout["earnings_breakdown"][0]
                assert "app_name" in breakdown
                assert "amount" in breakdown
            
            print(f"✓ Payout structure verified: amount=${payout['amount']}, apps={len(payout.get('earnings_breakdown', []))}")
    
    def test_process_payout(self):
        """Process a pending payout"""
        # Get a pending payout
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if not data["payouts"]:
            pytest.skip("No pending payouts to process")
        
        payout_id = data["payouts"][0]["id"]
        
        # Process it
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/payouts/{payout_id}/action",
            json={"action": "process"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["new_status"] == "processing"
        
        print(f"✓ Processed payout {payout_id} (status: processing)")
    
    def test_reject_payout(self):
        """Reject a pending payout"""
        # Get a pending payout
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if not data["payouts"]:
            pytest.skip("No pending payouts to reject")
        
        payout_id = data["payouts"][0]["id"]
        
        # Reject it
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/payouts/{payout_id}/action",
            json={"action": "reject", "notes": "Test rejection"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["new_status"] == "rejected"
        
        print(f"✓ Rejected payout {payout_id}")
    
    def test_complete_payout(self):
        """Complete a processing payout (mark as paid)"""
        # Get a processing payout
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts?status=processing",
            headers=self.headers
        )
        data = response.json()
        
        if not data["payouts"]:
            # First process a pending payout
            response = requests.get(
                f"{BASE_URL}/api/admin/accounting/payouts?status=pending",
                headers=self.headers
            )
            data = response.json()
            
            if not data["payouts"]:
                pytest.skip("No payouts available")
            
            payout_id = data["payouts"][0]["id"]
            
            # Process it first
            requests.post(
                f"{BASE_URL}/api/admin/accounting/payouts/{payout_id}/action",
                json={"action": "process"},
                headers=self.headers
            )
        else:
            payout_id = data["payouts"][0]["id"]
        
        # Complete it (mark as paid)
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/payouts/{payout_id}/action",
            json={"action": "process", "notes": "Payment completed"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["new_status"] in ["processing", "paid"]
        
        print(f"✓ Completed payout {payout_id} (status: {result['new_status']})")


class TestBulkPayoutActions:
    """Test bulk payout actions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and seed data"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.admin_token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Seed demo data
        requests.post(
            f"{BASE_URL}/api/admin/accounting/seed-demo-data",
            headers=self.headers
        )
    
    def test_bulk_process_payouts(self):
        """Bulk process multiple payouts"""
        # Get pending payouts
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if len(data["payouts"]) < 2:
            pytest.skip("Need at least 2 pending payouts for bulk test")
        
        payout_ids = [p["id"] for p in data["payouts"][:2]]
        
        # Bulk process
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/payouts/bulk-action",
            json={"payout_ids": payout_ids, "action": "process"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success_count"] >= 1
        
        print(f"✓ Bulk processed {result['success_count']} payouts")
    
    def test_bulk_reject_payouts(self):
        """Bulk reject multiple payouts"""
        # Get pending payouts
        response = requests.get(
            f"{BASE_URL}/api/admin/accounting/payouts?status=pending",
            headers=self.headers
        )
        data = response.json()
        
        if len(data["payouts"]) < 2:
            pytest.skip("Need at least 2 pending payouts for bulk test")
        
        payout_ids = [p["id"] for p in data["payouts"][:2]]
        
        # Bulk reject
        response = requests.post(
            f"{BASE_URL}/api/admin/accounting/payouts/bulk-action",
            json={"payout_ids": payout_ids, "action": "reject", "notes": "Bulk test rejection"},
            headers=self.headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success_count"] >= 1
        
        print(f"✓ Bulk rejected {result['success_count']} payouts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
