"""
Test Categories Taxonomy API
Tests for the new app category taxonomy system including:
- Categories API (19 main categories with subcategories)
- Tags API (10 tags)
- Category detail with subcategories
- Apps by category endpoint
- Featured collections
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCategoriesAPI:
    """Test categories endpoints"""
    
    def test_get_all_categories_returns_19_categories(self):
        """Verify all 19 categories are returned"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 19, f"Expected 19 categories, got {len(data)}"
        
        # Verify expected categories exist
        category_ids = [c['id'] for c in data]
        expected_categories = [
            'productivity-work', 'business-finance', 'artificial-intelligence',
            'developer-tools', 'marketing-growth', 'communication',
            'design-creativity', 'education-learning', 'health-wellness',
            'lifestyle-personal', 'entertainment-media', 'web3-blockchain',
            'security-privacy', 'smart-home-iot', 'utilities',
            'travel-local', 'sales-commerce', 'community-social', 'experimental'
        ]
        for cat_id in expected_categories:
            assert cat_id in category_ids, f"Missing category: {cat_id}"
    
    def test_categories_have_required_fields(self):
        """Verify each category has required fields"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        for category in data:
            assert 'id' in category, "Category missing 'id'"
            assert 'name' in category, "Category missing 'name'"
            assert 'icon' in category, "Category missing 'icon'"
            assert 'color' in category, "Category missing 'color'"
            assert 'subcategories' in category, "Category missing 'subcategories'"
            assert 'app_count' in category, "Category missing 'app_count'"
            assert isinstance(category['subcategories'], list), "Subcategories should be a list"
    
    def test_categories_have_subcategories(self):
        """Verify categories have subcategories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        # Check that most categories have subcategories
        categories_with_subs = [c for c in data if len(c['subcategories']) > 0]
        assert len(categories_with_subs) >= 15, "Most categories should have subcategories"
        
        # Check subcategory structure
        for category in categories_with_subs:
            for sub in category['subcategories']:
                assert 'id' in sub, "Subcategory missing 'id'"
                assert 'name' in sub, "Subcategory missing 'name'"


class TestTagsAPI:
    """Test tags endpoint"""
    
    def test_get_all_tags_returns_10_tags(self):
        """Verify all 10 tags are returned"""
        response = requests.get(f"{BASE_URL}/api/categories/tags")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 10, f"Expected 10 tags, got {len(data)}"
    
    def test_tags_have_required_fields(self):
        """Verify each tag has required fields"""
        response = requests.get(f"{BASE_URL}/api/categories/tags")
        assert response.status_code == 200
        
        data = response.json()
        expected_tags = ['ai', 'web3', 'no-code', 'privacy-first', 'rewards-enabled',
                        'open-source', 'enterprise', 'free-tier', 'mobile-first', 'api-available']
        
        tag_ids = [t['id'] for t in data]
        for tag_id in expected_tags:
            assert tag_id in tag_ids, f"Missing tag: {tag_id}"
        
        for tag in data:
            assert 'id' in tag, "Tag missing 'id'"
            assert 'name' in tag, "Tag missing 'name'"
            assert 'color' in tag, "Tag missing 'color'"


class TestCategoryDetail:
    """Test category detail endpoint"""
    
    def test_get_category_detail(self):
        """Verify category detail returns subcategories with counts"""
        response = requests.get(f"{BASE_URL}/api/categories/productivity-work")
        assert response.status_code == 200
        
        data = response.json()
        assert data['id'] == 'productivity-work'
        assert data['name'] == 'Productivity & Work'
        assert 'subcategories' in data
        assert len(data['subcategories']) > 0
        
        # Check subcategories have app_count
        for sub in data['subcategories']:
            assert 'app_count' in sub, "Subcategory should have app_count"
    
    def test_get_category_detail_not_found(self):
        """Verify 404 for non-existent category"""
        response = requests.get(f"{BASE_URL}/api/categories/non-existent-category")
        assert response.status_code == 404


class TestAppsInCategory:
    """Test apps by category endpoint"""
    
    def test_get_apps_in_category(self):
        """Verify apps endpoint returns paginated results"""
        response = requests.get(f"{BASE_URL}/api/categories/productivity-work/apps")
        assert response.status_code == 200
        
        data = response.json()
        assert 'apps' in data
        assert 'total' in data
        assert 'page' in data
        assert 'pages' in data
        assert isinstance(data['apps'], list)
    
    def test_get_apps_in_category_with_filters(self):
        """Verify apps endpoint accepts filter parameters"""
        response = requests.get(
            f"{BASE_URL}/api/categories/artificial-intelligence/apps",
            params={'tags': 'ai', 'sort_by': 'newest', 'page': 1, 'limit': 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'apps' in data
    
    def test_get_apps_in_invalid_category(self):
        """Verify 404 for non-existent category"""
        response = requests.get(f"{BASE_URL}/api/categories/invalid-category/apps")
        assert response.status_code == 404


class TestFeaturedCollections:
    """Test featured collections endpoint"""
    
    def test_get_featured_collections(self):
        """Verify featured collections are returned"""
        response = requests.get(f"{BASE_URL}/api/categories/collections")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 8, "Should have at least 8 featured collections"
        
        # Check expected collections
        collection_ids = [c['id'] for c in data]
        expected = ['trending', 'new-noteworthy', 'staff-picks', 'ai-powered']
        for coll_id in expected:
            assert coll_id in collection_ids, f"Missing collection: {coll_id}"
    
    def test_get_collection_apps(self):
        """Verify collection apps endpoint works"""
        response = requests.get(f"{BASE_URL}/api/categories/collection/trending")
        assert response.status_code == 200
        
        data = response.json()
        assert 'apps' in data
        assert 'total' in data


class TestDeveloperSubmission:
    """Test developer app submission with categories"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@napp.io",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_developer_submissions_endpoint(self, auth_token):
        """Verify developer submissions endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/developer/submissions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestFeaturedPricing:
    """Test featured listing pricing"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@napp.io",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_featured_checkout_requires_approved_app(self, auth_token):
        """Verify featured checkout requires approved app"""
        # Try to checkout with a non-existent submission
        response = requests.post(
            f"{BASE_URL}/api/developer/featured/checkout",
            json={
                "submission_id": "non-existent-id",
                "plan": "30_days",
                "origin_url": "https://example.com"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should return 404 for non-existent submission
        assert response.status_code == 404


class TestAdminFeatureApp:
    """Test admin feature/unfeature endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": "admin@optio.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_admin_can_access_app_submissions(self, admin_token):
        """Verify admin can access app submissions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/apps/submissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
