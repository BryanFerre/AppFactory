"""
Test Activity Points System Enhancements
- New badges: Top Node Operator, Top Ambassador
- Weekly/Monthly leaderboards
- External API endpoints for third-party consumption
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestBadgesEnhancements:
    """Test new badge definitions"""
    
    def test_badges_all_endpoint_returns_badges(self):
        """Test /api/activity/badges/all returns all badges"""
        response = requests.get(f"{BASE_URL}/api/activity/badges/all")
        assert response.status_code == 200
        data = response.json()
        assert "badges" in data
        assert "categories" in data
        assert "total" in data
        assert data["total"] >= 20  # Should have at least 20 badges
    
    def test_top_node_operator_badge_exists(self):
        """Test 'Top Node Operator' badge exists in badges list"""
        response = requests.get(f"{BASE_URL}/api/activity/badges/all")
        assert response.status_code == 200
        data = response.json()
        
        badge_ids = [b["id"] for b in data["badges"]]
        assert "top_node_operator" in badge_ids
        
        # Find and validate the badge
        top_node_badge = next(b for b in data["badges"] if b["id"] == "top_node_operator")
        assert top_node_badge["name"] == "Top Node Operator"
        assert top_node_badge["category"] == "special"
        assert top_node_badge["icon"] == "server"
        assert top_node_badge["points_bonus"] == 1000
        assert top_node_badge["requirement"]["type"] == "special"
        assert top_node_badge["requirement"]["condition"] == "top_node_operator"
    
    def test_top_ambassador_badge_exists(self):
        """Test 'Top Ambassador' badge exists in badges list"""
        response = requests.get(f"{BASE_URL}/api/activity/badges/all")
        assert response.status_code == 200
        data = response.json()
        
        badge_ids = [b["id"] for b in data["badges"]]
        assert "top_ambassador" in badge_ids
        
        # Find and validate the badge
        top_ambassador_badge = next(b for b in data["badges"] if b["id"] == "top_ambassador")
        assert top_ambassador_badge["name"] == "Top Ambassador"
        assert top_ambassador_badge["category"] == "special"
        assert top_ambassador_badge["icon"] == "megaphone"
        assert top_ambassador_badge["points_bonus"] == 1000
        assert top_ambassador_badge["requirement"]["type"] == "special"
        assert top_ambassador_badge["requirement"]["condition"] == "top_ambassador"
    
    def test_special_category_exists(self):
        """Test 'special' category exists in badge categories"""
        response = requests.get(f"{BASE_URL}/api/activity/badges/all")
        assert response.status_code == 200
        data = response.json()
        
        assert "special" in data["categories"]
        assert data["categories"]["special"] == "Special"


class TestWeeklyLeaderboard:
    """Test weekly leaderboard endpoint"""
    
    def test_weekly_leaderboard_endpoint_exists(self):
        """Test /api/activity/leaderboard/weekly endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/weekly")
        assert response.status_code == 200
    
    def test_weekly_leaderboard_structure(self):
        """Test weekly leaderboard response structure"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/weekly")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        assert "period" in data
        assert "period_start" in data
        assert "total" in data
        
        assert data["period"] == "weekly"
        assert data["period_start"] is not None
    
    def test_weekly_leaderboard_entry_structure(self):
        """Test weekly leaderboard entry has correct fields"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/weekly")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            assert "rank" in entry
            assert "user_id" in entry
            assert "name" in entry
            assert "points_this_week" in entry
            assert "tier" in entry
            assert entry["rank"] == 1
    
    def test_weekly_leaderboard_limit_param(self):
        """Test weekly leaderboard respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/weekly?limit=3")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["leaderboard"]) <= 3


class TestMonthlyLeaderboard:
    """Test monthly leaderboard endpoint"""
    
    def test_monthly_leaderboard_endpoint_exists(self):
        """Test /api/activity/leaderboard/monthly endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/monthly")
        assert response.status_code == 200
    
    def test_monthly_leaderboard_structure(self):
        """Test monthly leaderboard response structure"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/monthly")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        assert "period" in data
        assert "period_start" in data
        assert "total" in data
        
        assert data["period"] == "monthly"
        assert data["period_start"] is not None
    
    def test_monthly_leaderboard_entry_structure(self):
        """Test monthly leaderboard entry has correct fields"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/monthly")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            assert "rank" in entry
            assert "user_id" in entry
            assert "name" in entry
            assert "points_this_month" in entry
            assert "tier" in entry
            assert entry["rank"] == 1
    
    def test_monthly_leaderboard_limit_param(self):
        """Test monthly leaderboard respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard/monthly?limit=3")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["leaderboard"]) <= 3


class TestExternalAPIPointsExport:
    """Test external API for points export (third-party consumption)"""
    
    def test_points_export_endpoint_exists(self):
        """Test /api/external/activity/points/export endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/external/activity/points/export")
        assert response.status_code == 200
    
    def test_points_export_structure(self):
        """Test points export response structure"""
        response = requests.get(f"{BASE_URL}/api/external/activity/points/export")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "data" in data
        assert "pagination" in data
        assert "export_timestamp" in data
        
        # Check pagination structure
        assert "total" in data["pagination"]
        assert "limit" in data["pagination"]
        assert "offset" in data["pagination"]
        assert "has_more" in data["pagination"]
    
    def test_points_export_user_data_structure(self):
        """Test points export user data has correct fields"""
        response = requests.get(f"{BASE_URL}/api/external/activity/points/export?limit=1")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["data"]) > 0:
            user = data["data"][0]
            assert "user_id" in user
            assert "name" in user
            assert "email" in user
            assert "total_points" in user
            assert "tier" in user
            assert "points_by_category" in user
            assert "current_streak" in user
            assert "longest_streak" in user
    
    def test_points_export_pagination(self):
        """Test points export pagination works"""
        response = requests.get(f"{BASE_URL}/api/external/activity/points/export?limit=2&offset=0")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) <= 2
        assert data["pagination"]["limit"] == 2
        assert data["pagination"]["offset"] == 0


class TestExternalAPIUserPoints:
    """Test external API for specific user points"""
    
    def test_user_points_endpoint_with_valid_user(self):
        """Test /api/external/activity/points/user/{user_id} with valid user"""
        # First get a valid user_id from export
        export_response = requests.get(f"{BASE_URL}/api/external/activity/points/export?limit=1")
        assert export_response.status_code == 200
        export_data = export_response.json()
        
        if len(export_data["data"]) > 0:
            user_id = export_data["data"][0]["user_id"]
            
            response = requests.get(f"{BASE_URL}/api/external/activity/points/user/{user_id}")
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] == True
            assert "data" in data
            assert data["data"]["user_id"] == user_id
    
    def test_user_points_endpoint_structure(self):
        """Test user points response has correct structure"""
        export_response = requests.get(f"{BASE_URL}/api/external/activity/points/export?limit=1")
        assert export_response.status_code == 200
        export_data = export_response.json()
        
        if len(export_data["data"]) > 0:
            user_id = export_data["data"][0]["user_id"]
            
            response = requests.get(f"{BASE_URL}/api/external/activity/points/user/{user_id}")
            assert response.status_code == 200
            data = response.json()
            
            user_data = data["data"]
            assert "user_id" in user_data
            assert "name" in user_data
            assert "email" in user_data
            assert "total_points" in user_data
            assert "tier" in user_data
            assert "tier_color" in user_data
            assert "points_by_category" in user_data
            assert "next_tier" in user_data
            assert "points_to_next_tier" in user_data
            assert "current_streak" in user_data
            assert "longest_streak" in user_data
            assert "badges" in user_data
    
    def test_user_points_endpoint_invalid_user(self):
        """Test user points endpoint returns 404 for invalid user"""
        response = requests.get(f"{BASE_URL}/api/external/activity/points/user/invalid-user-id-12345")
        assert response.status_code == 404


class TestExternalAPILeaderboardExport:
    """Test external API for leaderboard export"""
    
    def test_leaderboard_export_all_period(self):
        """Test leaderboard export with 'all' period"""
        response = requests.get(f"{BASE_URL}/api/external/activity/leaderboard/export?period=all")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["period"] == "all"
        assert data["period_start"] is None
        assert "data" in data
        assert "total" in data
    
    def test_leaderboard_export_weekly_period(self):
        """Test leaderboard export with 'weekly' period"""
        response = requests.get(f"{BASE_URL}/api/external/activity/leaderboard/export?period=weekly")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["period"] == "weekly"
        assert data["period_start"] is not None
        assert "data" in data
    
    def test_leaderboard_export_monthly_period(self):
        """Test leaderboard export with 'monthly' period"""
        response = requests.get(f"{BASE_URL}/api/external/activity/leaderboard/export?period=monthly")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["period"] == "monthly"
        assert data["period_start"] is not None
        assert "data" in data
    
    def test_leaderboard_export_entry_structure(self):
        """Test leaderboard export entry has correct fields"""
        response = requests.get(f"{BASE_URL}/api/external/activity/leaderboard/export?period=all&limit=1")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["data"]) > 0:
            entry = data["data"][0]
            assert "rank" in entry
            assert "user_id" in entry
            assert "name" in entry
            assert "email" in entry
            assert "period_points" in entry
            assert "total_points" in entry
            assert "tier" in entry
    
    def test_leaderboard_export_limit_param(self):
        """Test leaderboard export respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/external/activity/leaderboard/export?period=all&limit=3")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["data"]) <= 3


class TestAllTimeLeaderboard:
    """Test all-time leaderboard endpoint (existing)"""
    
    def test_alltime_leaderboard_endpoint_exists(self):
        """Test /api/activity/leaderboard endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard")
        assert response.status_code == 200
    
    def test_alltime_leaderboard_structure(self):
        """Test all-time leaderboard response structure"""
        response = requests.get(f"{BASE_URL}/api/activity/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        assert "total" in data
        
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            assert "rank" in entry
            assert "user_id" in entry
            assert "total_points" in entry


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
