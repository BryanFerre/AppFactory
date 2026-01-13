"""
Test AI Promotional Content Generation
Tests for:
- GET /api/ai/recommendations - AI-generated promotional content with social posts
- GET /api/ai/app-promotions/{app_id} - App-specific promotional content
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dashtest_1768344856@test.io"
TEST_PASSWORD = "testpass123"


class TestAIPromotionalContent:
    """Test AI promotional content generation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            if data.get("requires_2fa"):
                pytest.skip("Test user has 2FA enabled - skipping")
            token = data.get("access_token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
                self.user = data.get("user", {})
            else:
                pytest.skip("Failed to get access token")
        else:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    # ==================== AI RECOMMENDATIONS TESTS ====================
    
    def test_ai_recommendations_returns_200(self):
        """Test GET /api/ai/recommendations returns 200 status"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ GET /api/ai/recommendations returns 200")
    
    def test_ai_recommendations_returns_array(self):
        """Test that recommendations endpoint returns an array"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) > 0, "Expected at least one recommendation"
        print(f"✓ Recommendations returns array with {len(data)} items")
    
    def test_ai_recommendations_has_required_fields(self):
        """Test that each recommendation has required fields"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["type", "title", "description", "priority"]
        
        for i, rec in enumerate(data):
            for field in required_fields:
                assert field in rec, f"Recommendation {i} missing field: {field}"
            print(f"  ✓ Recommendation {i}: '{rec.get('title', 'N/A')}' has all required fields")
        
        print(f"✓ All {len(data)} recommendations have required fields")
    
    def test_ai_recommendations_has_social_post_type(self):
        """Test that at least one recommendation is a social_post type"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        social_posts = [r for r in data if r.get("type") == "social_post"]
        assert len(social_posts) > 0, "Expected at least one social_post type recommendation"
        print(f"✓ Found {len(social_posts)} social_post type recommendations")
    
    def test_ai_recommendations_social_post_has_post_content(self):
        """Test that social_post type recommendations have post_content"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        social_posts = [r for r in data if r.get("type") == "social_post"]
        
        for i, post in enumerate(social_posts):
            assert "post_content" in post, f"Social post {i} missing post_content"
            assert post.get("post_content") is not None, f"Social post {i} has null post_content"
            assert len(post.get("post_content", "")) > 0, f"Social post {i} has empty post_content"
            print(f"  ✓ Social post {i}: has post_content ({len(post.get('post_content', ''))} chars)")
        
        print(f"✓ All {len(social_posts)} social posts have post_content")
    
    def test_ai_recommendations_social_post_has_hashtags(self):
        """Test that social_post type recommendations have hashtags array"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        social_posts = [r for r in data if r.get("type") == "social_post"]
        
        for i, post in enumerate(social_posts):
            assert "hashtags" in post, f"Social post {i} missing hashtags field"
            assert isinstance(post.get("hashtags"), list), f"Social post {i} hashtags is not a list"
            print(f"  ✓ Social post {i}: has {len(post.get('hashtags', []))} hashtags: {post.get('hashtags', [])}")
        
        print(f"✓ All {len(social_posts)} social posts have hashtags array")
    
    def test_ai_recommendations_social_post_has_social_platforms(self):
        """Test that social_post type recommendations have social_platforms array"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        social_posts = [r for r in data if r.get("type") == "social_post"]
        valid_platforms = ["twitter", "linkedin", "facebook"]
        
        for i, post in enumerate(social_posts):
            assert "social_platforms" in post, f"Social post {i} missing social_platforms field"
            platforms = post.get("social_platforms", [])
            assert isinstance(platforms, list), f"Social post {i} social_platforms is not a list"
            
            # Check that platforms are valid
            for platform in platforms:
                assert platform in valid_platforms, f"Invalid platform: {platform}"
            
            print(f"  ✓ Social post {i}: platforms = {platforms}")
        
        print(f"✓ All {len(social_posts)} social posts have valid social_platforms")
    
    def test_ai_recommendations_has_priority_levels(self):
        """Test that recommendations have valid priority levels"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        valid_priorities = ["high", "medium", "low"]
        
        for i, rec in enumerate(data):
            priority = rec.get("priority")
            assert priority in valid_priorities, f"Recommendation {i} has invalid priority: {priority}"
            print(f"  ✓ Recommendation {i}: priority = {priority}")
        
        print("✓ All recommendations have valid priority levels")
    
    def test_ai_recommendations_requires_auth(self):
        """Test that recommendations endpoint requires authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ GET /api/ai/recommendations requires authentication")
    
    # ==================== APP-SPECIFIC PROMOTIONS TESTS ====================
    
    def test_get_installed_apps_for_promotion(self):
        """Get installed apps to use for app-specific promotion tests"""
        response = self.session.get(f"{BASE_URL}/api/apps/installed")
        assert response.status_code == 200
        apps = response.json()
        assert isinstance(apps, list), "Expected list of apps"
        
        # Store first app ID for later tests
        if apps:
            self.test_app_id = apps[0].get("id")
            self.test_app_name = apps[0].get("name")
            print(f"✓ Found {len(apps)} installed apps. Using '{self.test_app_name}' (ID: {self.test_app_id}) for tests")
        else:
            print("⚠ No installed apps found")
    
    def test_app_promotions_returns_200(self):
        """Test GET /api/ai/app-promotions/{app_id} returns 200"""
        # First get an installed app
        apps_response = self.session.get(f"{BASE_URL}/api/apps/installed")
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No installed apps to test")
        
        app_id = apps[0].get("id")
        response = self.session.get(f"{BASE_URL}/api/ai/app-promotions/{app_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/ai/app-promotions/{app_id} returns 200")
    
    def test_app_promotions_has_required_fields(self):
        """Test that app promotions response has required fields"""
        apps_response = self.session.get(f"{BASE_URL}/api/apps/installed")
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No installed apps to test")
        
        app_id = apps[0].get("id")
        response = self.session.get(f"{BASE_URL}/api/ai/app-promotions/{app_id}")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["app_id", "app_name", "social_posts", "promotion_tips", "target_audience", "referral_link"]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            print(f"  ✓ Field '{field}' present")
        
        print("✓ App promotions response has all required fields")
    
    def test_app_promotions_social_posts_structure(self):
        """Test that app promotions social_posts have correct structure"""
        apps_response = self.session.get(f"{BASE_URL}/api/apps/installed")
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No installed apps to test")
        
        app_id = apps[0].get("id")
        response = self.session.get(f"{BASE_URL}/api/ai/app-promotions/{app_id}")
        assert response.status_code == 200
        data = response.json()
        
        social_posts = data.get("social_posts", [])
        assert isinstance(social_posts, list), "social_posts should be a list"
        assert len(social_posts) > 0, "Expected at least one social post"
        
        for i, post in enumerate(social_posts):
            assert "platform" in post, f"Post {i} missing platform"
            assert "content" in post, f"Post {i} missing content"
            assert "hashtags" in post, f"Post {i} missing hashtags"
            print(f"  ✓ Post {i}: platform={post.get('platform')}, content length={len(post.get('content', ''))}")
        
        print(f"✓ App promotions has {len(social_posts)} properly structured social posts")
    
    def test_app_promotions_has_promotion_tips(self):
        """Test that app promotions has promotion_tips array"""
        apps_response = self.session.get(f"{BASE_URL}/api/apps/installed")
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No installed apps to test")
        
        app_id = apps[0].get("id")
        response = self.session.get(f"{BASE_URL}/api/ai/app-promotions/{app_id}")
        assert response.status_code == 200
        data = response.json()
        
        tips = data.get("promotion_tips", [])
        assert isinstance(tips, list), "promotion_tips should be a list"
        assert len(tips) > 0, "Expected at least one promotion tip"
        
        for i, tip in enumerate(tips):
            assert isinstance(tip, str), f"Tip {i} should be a string"
            print(f"  ✓ Tip {i}: {tip[:50]}...")
        
        print(f"✓ App promotions has {len(tips)} promotion tips")
    
    def test_app_promotions_has_referral_link(self):
        """Test that app promotions has a valid referral_link"""
        apps_response = self.session.get(f"{BASE_URL}/api/apps/installed")
        apps = apps_response.json()
        
        if not apps:
            pytest.skip("No installed apps to test")
        
        app_id = apps[0].get("id")
        response = self.session.get(f"{BASE_URL}/api/ai/app-promotions/{app_id}")
        assert response.status_code == 200
        data = response.json()
        
        referral_link = data.get("referral_link")
        assert referral_link is not None, "referral_link should not be None"
        assert isinstance(referral_link, str), "referral_link should be a string"
        assert len(referral_link) > 0, "referral_link should not be empty"
        assert "ref=" in referral_link, "referral_link should contain ref parameter"
        
        print(f"✓ App promotions has referral_link: {referral_link}")
    
    def test_app_promotions_invalid_app_id(self):
        """Test that invalid app_id returns fallback content (200) or 404"""
        response = self.session.get(f"{BASE_URL}/api/ai/app-promotions/invalid-app-id-12345")
        # The endpoint may return 200 with fallback content or 404
        # Current implementation returns fallback content for invalid IDs
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            # Should still have valid structure even for fallback
            assert "social_posts" in data, "Fallback should have social_posts"
            print("✓ Invalid app_id returns fallback content (200)")
        else:
            print("✓ Invalid app_id returns 404")
    
    def test_app_promotions_requires_auth(self):
        """Test that app promotions endpoint requires authentication"""
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/ai/app-promotions/some-app-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ GET /api/ai/app-promotions requires authentication")
    
    # ==================== CONTENT QUALITY TESTS ====================
    
    def test_ai_recommendations_content_quality(self):
        """Test that AI-generated content is meaningful (not empty/placeholder)"""
        response = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        for i, rec in enumerate(data):
            # Check title is meaningful
            title = rec.get("title", "")
            assert len(title) > 5, f"Recommendation {i} title too short: '{title}'"
            
            # Check description is meaningful
            desc = rec.get("description", "")
            assert len(desc) > 10, f"Recommendation {i} description too short: '{desc}'"
            
            # For social posts, check post_content
            if rec.get("type") == "social_post":
                content = rec.get("post_content", "")
                assert len(content) > 20, f"Social post {i} content too short: '{content}'"
        
        print("✓ All recommendations have meaningful content")
    
    def test_ai_recommendations_refresh_generates_content(self):
        """Test that calling recommendations multiple times works (simulating refresh)"""
        # First call
        response1 = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Wait a moment
        time.sleep(1)
        
        # Second call (simulating refresh)
        response2 = self.session.get(f"{BASE_URL}/api/ai/recommendations")
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Both should return valid data
        assert len(data1) > 0, "First call should return recommendations"
        assert len(data2) > 0, "Second call should return recommendations"
        
        print("✓ Refresh (multiple calls) generates content successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
