"""
Test Suite for Stripe Integration, Products, Licenses, and Purchase Flow
Tests the new features: Public landing page APIs, Admin product management, 
Stripe checkout creation, and License management
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://appcloud-impact.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"
USER_EMAIL = "user1@example.com"
USER_PASSWORD = "password123"


class TestPublicProductsAPI:
    """Test public product endpoints (no auth required)"""
    
    def test_get_products_list(self):
        """GET /api/products - Returns list of active products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert isinstance(data["products"], list)
        print(f"✓ GET /api/products - Found {data['total']} products")
    
    def test_get_cloudnode_product_by_slug(self):
        """GET /api/products/slug/optio-cloudnode - Returns CloudNode product"""
        response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        assert response.status_code == 200
        
        product = response.json()
        assert product["slug"] == "optio-cloudnode"
        assert product["name"] == "Optio CloudNode"
        assert product["price"] == 5000.0
        assert product["is_active"] == True
        assert product["is_featured"] == True
        assert "features" in product
        assert isinstance(product["features"], list)
        assert len(product["features"]) > 0
        print(f"✓ GET /api/products/slug/optio-cloudnode - Product found: {product['name']} at ${product['price']}")
    
    def test_get_product_by_id(self):
        """GET /api/products/{id} - Returns product by ID"""
        # First get the product list to get an ID
        list_response = requests.get(f"{BASE_URL}/api/products")
        products = list_response.json()["products"]
        
        if products:
            product_id = products[0]["id"]
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            
            product = response.json()
            assert product["id"] == product_id
            print(f"✓ GET /api/products/{product_id} - Product retrieved successfully")
        else:
            pytest.skip("No products available to test")
    
    def test_get_nonexistent_product(self):
        """GET /api/products/slug/nonexistent - Returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/slug/nonexistent-product")
        assert response.status_code == 404
        print("✓ GET /api/products/slug/nonexistent - Returns 404 as expected")


class TestPurchaseCheckoutAPI:
    """Test purchase/checkout endpoints"""
    
    def test_create_checkout_session(self):
        """POST /api/purchase/create-checkout - Creates Stripe checkout session"""
        # Get product ID first
        product_response = requests.get(f"{BASE_URL}/api/products/slug/optio-cloudnode")
        product = product_response.json()
        
        checkout_data = {
            "product_id": product["id"],
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "name": "Test Buyer",
            "referral_code": None,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/purchase/create-checkout",
            json=checkout_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "checkout_url" in data
        assert "session_id" in data
        assert "order_id" in data
        assert data["checkout_url"].startswith("https://checkout.stripe.com")
        print(f"✓ POST /api/purchase/create-checkout - Checkout session created: {data['session_id'][:20]}...")
    
    def test_create_checkout_invalid_product(self):
        """POST /api/purchase/create-checkout - Returns 404 for invalid product"""
        checkout_data = {
            "product_id": "invalid-product-id",
            "email": "test@example.com",
            "name": "Test Buyer",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/purchase/create-checkout",
            json=checkout_data
        )
        
        assert response.status_code == 404
        print("✓ POST /api/purchase/create-checkout - Returns 404 for invalid product")
    
    def test_create_checkout_missing_fields(self):
        """POST /api/purchase/create-checkout - Returns 422 for missing fields"""
        checkout_data = {
            "product_id": "some-id"
            # Missing required fields
        }
        
        response = requests.post(
            f"{BASE_URL}/api/purchase/create-checkout",
            json=checkout_data
        )
        
        assert response.status_code == 422
        print("✓ POST /api/purchase/create-checkout - Returns 422 for missing fields")


class TestLicensesAPI:
    """Test license management endpoints"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": USER_EMAIL, "password": USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User authentication failed")
    
    def test_get_user_licenses(self, user_token):
        """GET /api/licenses - Returns user's licenses"""
        response = requests.get(
            f"{BASE_URL}/api/licenses",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "licenses" in data
        assert "total" in data
        assert isinstance(data["licenses"], list)
        print(f"✓ GET /api/licenses - User has {data['total']} licenses")
    
    def test_get_licenses_unauthorized(self):
        """GET /api/licenses - Returns 401/403 without auth"""
        response = requests.get(f"{BASE_URL}/api/licenses")
        assert response.status_code in [401, 403]
        print(f"✓ GET /api/licenses - Returns {response.status_code} without auth")


class TestAdminProductsAPI:
    """Test admin product management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin authentication failed")
    
    def test_admin_get_products(self, admin_token):
        """GET /api/admin/products - Returns all products for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        # Admin endpoint should include sales_count
        if data["products"]:
            assert "sales_count" in data["products"][0]
        print(f"✓ GET /api/admin/products - Found {data['total']} products")
    
    def test_admin_get_products_stats(self, admin_token):
        """GET /api/admin/products/stats/overview - Returns product stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/products/stats/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_products" in data
        assert "active_products" in data
        assert "top_products_by_revenue" in data
        print(f"✓ GET /api/admin/products/stats/overview - Total: {data['total_products']}, Active: {data['active_products']}")
    
    def test_admin_create_product(self, admin_token):
        """POST /api/admin/products - Creates new product"""
        unique_slug = f"test-product-{uuid.uuid4().hex[:8]}"
        product_data = {
            "name": "Test Product",
            "slug": unique_slug,
            "description": "A test product for automated testing",
            "short_description": "Test product",
            "price": 100.0,
            "currency": "USD",
            "category": "node",
            "features": ["Feature 1", "Feature 2"],
            "is_active": True,
            "is_featured": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "product_id" in data
        assert "product" in data
        assert data["product"]["slug"] == unique_slug
        
        # Store for cleanup
        self.created_product_id = data["product_id"]
        print(f"✓ POST /api/admin/products - Created product: {unique_slug}")
        
        return data["product_id"]
    
    def test_admin_update_product(self, admin_token):
        """PUT /api/admin/products/{id} - Updates product"""
        # First create a product
        unique_slug = f"test-update-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/products",
            json={
                "name": "Product to Update",
                "slug": unique_slug,
                "description": "Original description",
                "price": 100.0
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        product_id = create_response.json()["product_id"]
        
        # Update the product
        update_data = {
            "name": "Updated Product Name",
            "price": 150.0
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["product"]["name"] == "Updated Product Name"
        assert data["product"]["price"] == 150.0
        print(f"✓ PUT /api/admin/products/{product_id} - Product updated successfully")
        
        # Cleanup - delete the product
        requests.delete(
            f"{BASE_URL}/api/admin/products/{product_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_admin_delete_product(self, admin_token):
        """DELETE /api/admin/products/{id} - Deletes product"""
        # First create a product
        unique_slug = f"test-delete-{uuid.uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/products",
            json={
                "name": "Product to Delete",
                "slug": unique_slug,
                "description": "Will be deleted",
                "price": 50.0
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        product_id = create_response.json()["product_id"]
        
        # Delete the product
        response = requests.delete(
            f"{BASE_URL}/api/admin/products/{product_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["delete_type"] == "hard"  # No orders, so hard delete
        print(f"✓ DELETE /api/admin/products/{product_id} - Product deleted (hard delete)")
    
    def test_admin_products_unauthorized(self):
        """GET /api/admin/products - Returns 401/403 without admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code in [401, 403]
        print(f"✓ GET /api/admin/products - Returns {response.status_code} without admin auth")
    
    def test_admin_duplicate_slug_rejected(self, admin_token):
        """POST /api/admin/products - Rejects duplicate slug"""
        # Try to create product with existing slug
        product_data = {
            "name": "Duplicate Product",
            "slug": "optio-cloudnode",  # Already exists
            "description": "Should fail",
            "price": 100.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400
        assert "slug already exists" in response.json()["detail"].lower()
        print("✓ POST /api/admin/products - Rejects duplicate slug")


class TestAdminLicensesAPI:
    """Test admin license management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin authentication failed")
    
    def test_admin_get_licenses(self, admin_token):
        """GET /api/admin/licenses - Returns all licenses"""
        response = requests.get(
            f"{BASE_URL}/api/admin/licenses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "licenses" in data
        assert "total" in data
        print(f"✓ GET /api/admin/licenses - Found {data['total']} licenses")
    
    def test_admin_get_licenses_stats(self, admin_token):
        """GET /api/admin/licenses/stats/overview - Returns license stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/licenses/stats/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_licenses" in data
        assert "active_licenses" in data
        print(f"✓ GET /api/admin/licenses/stats/overview - Total: {data['total_licenses']}, Active: {data['active_licenses']}")


class TestAdminOrdersAPI:
    """Test admin order management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin authentication failed")
    
    def test_admin_get_orders(self, admin_token):
        """GET /api/admin/orders - Returns all orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        assert "total" in data
        print(f"✓ GET /api/admin/orders - Found {data['total']} orders")
    
    def test_admin_get_order_stats(self, admin_token):
        """GET /api/admin/orders/stats - Returns order statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_orders" in data
        assert "completed_orders" in data
        assert "pending_orders" in data
        assert "total_revenue" in data
        print(f"✓ GET /api/admin/orders/stats - Total: {data['total_orders']}, Revenue: ${data['total_revenue']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
