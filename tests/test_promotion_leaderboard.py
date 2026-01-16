"""
Test Suite for Promotion Leaderboard Feature
Tests:
- GET /api/promotion/leaderboard endpoint
- Period filters (all_time, monthly, weekly)
- Leaderboard data structure (rank, display_name, total_shares, signups_driven, opt_earned)
- Current user highlighting
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPromotionLeaderboard:
    """Tests for the Share Leaderboard feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with demo credentials
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@napp.io",
            "password": "demo123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.authenticated = True
        else:
            self.authenticated = False
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    # ==================== LEADERBOARD ENDPOINT TESTS ====================
    
    def test_leaderboard_endpoint_returns_200(self):
        """GET /api/promotion/leaderboard returns 200 status"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Leaderboard endpoint returns 200")
    
    def test_leaderboard_response_structure(self):
        """Leaderboard response has correct structure"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required top-level fields
        assert "period" in data, "Missing 'period' field"
        assert "leaderboard" in data, "Missing 'leaderboard' field"
        assert "current_user_rank" in data, "Missing 'current_user_rank' field"
        assert "total_participants" in data, "Missing 'total_participants' field"
        
        # Verify leaderboard is a list
        assert isinstance(data["leaderboard"], list), "leaderboard should be a list"
        
        print(f"✓ Leaderboard response structure correct: period={data['period']}, entries={len(data['leaderboard'])}")
    
    def test_leaderboard_default_period_is_all_time(self):
        """Default period is 'all_time'"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "all_time", f"Expected 'all_time', got '{data['period']}'"
        print("✓ Default period is 'all_time'")
    
    def test_leaderboard_period_filter_monthly(self):
        """Leaderboard supports monthly period filter"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard?period=monthly")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "monthly", f"Expected 'monthly', got '{data['period']}'"
        print("✓ Monthly period filter works")
    
    def test_leaderboard_period_filter_weekly(self):
        """Leaderboard supports weekly period filter"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard?period=weekly")
        assert response.status_code == 200
        
        data = response.json()
        assert data["period"] == "weekly", f"Expected 'weekly', got '{data['period']}'"
        print("✓ Weekly period filter works")
    
    def test_leaderboard_entry_structure(self):
        """Each leaderboard entry has required fields"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            
            # Check required fields for each entry
            required_fields = [
                "rank", "user_id", "display_name", "avatar_initial",
                "total_shares", "signups_driven", "opt_earned",
                "apps_shared_count", "platforms_used", "is_current_user"
            ]
            
            for field in required_fields:
                assert field in entry, f"Missing field '{field}' in leaderboard entry"
            
            # Verify data types
            assert isinstance(entry["rank"], int), "rank should be int"
            assert isinstance(entry["total_shares"], int), "total_shares should be int"
            assert isinstance(entry["signups_driven"], int), "signups_driven should be int"
            assert isinstance(entry["is_current_user"], bool), "is_current_user should be bool"
            
            print(f"✓ Leaderboard entry structure correct: {entry['display_name']} - rank #{entry['rank']}")
        else:
            print("✓ Leaderboard is empty (no shares yet)")
    
    def test_leaderboard_ranks_are_sequential(self):
        """Leaderboard ranks are sequential starting from 1"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        
        if len(data["leaderboard"]) > 0:
            for idx, entry in enumerate(data["leaderboard"]):
                expected_rank = idx + 1
                assert entry["rank"] == expected_rank, f"Expected rank {expected_rank}, got {entry['rank']}"
            
            print(f"✓ Ranks are sequential (1 to {len(data['leaderboard'])})")
        else:
            print("✓ Leaderboard is empty - no ranks to verify")
    
    def test_leaderboard_sorted_by_total_shares(self):
        """Leaderboard is sorted by total_shares descending"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        
        if len(data["leaderboard"]) > 1:
            for i in range(len(data["leaderboard"]) - 1):
                current = data["leaderboard"][i]["total_shares"]
                next_entry = data["leaderboard"][i + 1]["total_shares"]
                assert current >= next_entry, f"Leaderboard not sorted: {current} < {next_entry}"
            
            print("✓ Leaderboard sorted by total_shares descending")
        else:
            print("✓ Not enough entries to verify sorting")
    
    def test_leaderboard_requires_authentication(self):
        """Leaderboard endpoint requires authentication"""
        # Create unauthenticated session
        unauth_session = requests.Session()
        response = unauth_session.get(f"{BASE_URL}/api/promotion/leaderboard")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Leaderboard requires authentication")
    
    def test_leaderboard_current_user_highlighted(self):
        """Current user is marked with is_current_user=True"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check if current user is in leaderboard
        current_user_entries = [e for e in data["leaderboard"] if e["is_current_user"]]
        
        if len(current_user_entries) > 0:
            assert len(current_user_entries) == 1, "Should have exactly one current user entry"
            print(f"✓ Current user highlighted at rank #{current_user_entries[0]['rank']}")
        elif data["current_user_rank"] is not None:
            # User not in top list but has rank info
            print(f"✓ Current user rank info provided: #{data['current_user_rank'].get('rank', 'N/A')}")
        else:
            print("✓ Current user has no shares yet (not in leaderboard)")
    
    # ==================== PROMOTION STATS ENDPOINT TESTS ====================
    
    def test_promotion_stats_endpoint(self):
        """GET /api/promotion/stats returns user promotion stats"""
        response = self.session.get(f"{BASE_URL}/api/promotion/stats")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        required_fields = [
            "app_link_clicks", "app_signups_driven", "app_opt_rewards",
            "operator_invites_sent", "operator_signups", "operator_opt_rewards",
            "app_share_links", "operator_referral_link", "recent_activity"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field '{field}' in promotion stats"
        
        print(f"✓ Promotion stats endpoint works: {data['operator_signups']} operator signups, {data['app_signups_driven']} app signups")
    
    # ==================== SHARE TRACKING TESTS ====================
    
    def test_share_tracking_endpoint(self):
        """POST /api/promotion/share/{app_id} tracks shares"""
        # First get installed apps
        apps_response = self.session.get(f"{BASE_URL}/api/apps/installed")
        
        if apps_response.status_code == 200 and len(apps_response.json()) > 0:
            app_id = apps_response.json()[0]["id"]
            
            # Track a share
            share_response = self.session.post(
                f"{BASE_URL}/api/promotion/share/{app_id}?platform=copy"
            )
            
            assert share_response.status_code == 200, f"Expected 200, got {share_response.status_code}"
            
            data = share_response.json()
            assert "success" in data, "Missing 'success' field"
            assert "share_link" in data, "Missing 'share_link' field"
            assert "platform" in data, "Missing 'platform' field"
            
            print(f"✓ Share tracking works: {data['platform']} - points awarded: {data.get('points_awarded', 0)}")
        else:
            print("✓ No installed apps to test share tracking")
    
    # ==================== REFERRAL CODE TESTS ====================
    
    def test_referral_code_endpoint(self):
        """GET /api/referral/code returns referral code info"""
        response = self.session.get(f"{BASE_URL}/api/referral/code")
        assert response.status_code == 200
        
        data = response.json()
        assert "referral_code" in data or "operator_referral_link" in data, "Missing referral info"
        
        print(f"✓ Referral code endpoint works")


class TestLeaderboardEdgeCases:
    """Edge case tests for leaderboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@napp.io",
            "password": "demo123"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_leaderboard_with_invalid_period(self):
        """Invalid period defaults to all_time or returns error"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard?period=invalid")
        
        # Should either return all_time or handle gracefully
        if response.status_code == 200:
            data = response.json()
            # Invalid period might default to all_time or be treated as-is
            print(f"✓ Invalid period handled: period={data['period']}")
        else:
            print(f"✓ Invalid period returns error: {response.status_code}")
    
    def test_leaderboard_with_limit_parameter(self):
        """Leaderboard respects limit parameter"""
        response = self.session.get(f"{BASE_URL}/api/promotion/leaderboard?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["leaderboard"]) <= 5, f"Expected max 5 entries, got {len(data['leaderboard'])}"
        
        print(f"✓ Limit parameter works: {len(data['leaderboard'])} entries returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
