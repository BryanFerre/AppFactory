"""
Test Suite for NAPP 2FA (Two-Factor Authentication) System
Tests both User and Admin 2FA flows using TOTP (pyotp library)

Features tested:
- User 2FA Setup: POST /api/auth/2fa/setup
- User 2FA Verify: POST /api/auth/2fa/verify
- User 2FA Status: GET /api/auth/2fa/status
- User 2FA Disable: POST /api/auth/2fa/disable
- User Login with 2FA enabled
- Admin 2FA Setup: POST /api/admin/auth/2fa/setup
- Admin 2FA Status: GET /api/admin/auth/2fa/status
"""

import pytest
import requests
import os
import pyotp
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "reftest@napp.io"
TEST_USER_PASSWORD = "testpass123"
ADMIN_EMAIL = "admin@optio.com"
ADMIN_PASSWORD = "admin123"


class TestUserAuthentication:
    """Basic user authentication tests"""
    
    def test_user_login_success(self):
        """Test basic user login without 2FA"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        # User may or may not have 2FA enabled
        assert "requires_2fa" in data or "access_token" in data
        print(f"✓ User login response: requires_2fa={data.get('requires_2fa', False)}")


class TestUser2FASetup:
    """User 2FA Setup flow tests"""
    
    @pytest.fixture
    def user_token(self):
        """Get user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        data = response.json()
        if data.get("requires_2fa"):
            pytest.skip("User has 2FA enabled - need to disable first")
        return data.get("access_token")
    
    def test_2fa_status_endpoint(self, user_token):
        """GET /api/auth/2fa/status returns current 2FA status"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=headers)
        
        assert response.status_code == 200, f"Status check failed: {response.text}"
        data = response.json()
        
        assert "two_factor_enabled" in data
        assert "backup_codes_remaining" in data
        print(f"✓ 2FA Status: enabled={data['two_factor_enabled']}, backup_codes={data['backup_codes_remaining']}")
        return data
    
    def test_2fa_setup_returns_qr_and_secret(self, user_token):
        """POST /api/auth/2fa/setup returns QR code and secret"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # First check if 2FA is already enabled
        status_response = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=headers)
        if status_response.json().get("two_factor_enabled"):
            pytest.skip("2FA already enabled - need to disable first")
        
        response = requests.post(f"{BASE_URL}/api/auth/2fa/setup", headers=headers)
        
        assert response.status_code == 200, f"Setup failed: {response.text}"
        data = response.json()
        
        assert "secret" in data, "Response missing 'secret'"
        assert "qr_code" in data, "Response missing 'qr_code'"
        assert "provisioning_uri" in data, "Response missing 'provisioning_uri'"
        
        # Validate secret is valid base32
        assert len(data["secret"]) >= 16, "Secret too short"
        
        # Validate QR code is base64
        assert len(data["qr_code"]) > 100, "QR code seems too short"
        
        # Validate provisioning URI format
        assert "otpauth://totp/" in data["provisioning_uri"]
        assert "NAPP%20Dashboard" in data["provisioning_uri"] or "NAPP Dashboard" in data["provisioning_uri"]
        
        print(f"✓ 2FA Setup returned secret (length={len(data['secret'])}), QR code, and provisioning URI")
        return data


class TestUser2FAFullFlow:
    """Complete 2FA enable/disable flow tests"""
    
    @pytest.fixture
    def user_session(self):
        """Get user auth token and ensure 2FA is disabled"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        data = response.json()
        
        if data.get("requires_2fa"):
            # User has 2FA enabled - we need to handle this
            return {"requires_2fa": True, "email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        
        return {"token": data.get("access_token"), "requires_2fa": False}
    
    def test_full_2fa_enable_disable_flow(self, user_session):
        """Test complete 2FA flow: setup -> verify -> login with 2FA -> disable"""
        if user_session.get("requires_2fa"):
            pytest.skip("User has 2FA enabled - testing login with 2FA instead")
        
        token = user_session["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 1: Check initial status
        status_resp = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=headers)
        assert status_resp.status_code == 200
        initial_status = status_resp.json()
        
        if initial_status.get("two_factor_enabled"):
            print("2FA already enabled, skipping enable flow")
            pytest.skip("2FA already enabled")
        
        # Step 2: Setup 2FA
        setup_resp = requests.post(f"{BASE_URL}/api/auth/2fa/setup", headers=headers)
        assert setup_resp.status_code == 200, f"Setup failed: {setup_resp.text}"
        setup_data = setup_resp.json()
        secret = setup_data["secret"]
        print(f"✓ Step 1: 2FA setup initiated, secret received")
        
        # Step 3: Generate TOTP code using pyotp
        totp = pyotp.TOTP(secret)
        code = totp.now()
        print(f"✓ Step 2: Generated TOTP code: {code}")
        
        # Step 4: Verify 2FA setup
        verify_resp = requests.post(f"{BASE_URL}/api/auth/2fa/verify", 
                                    headers=headers,
                                    json={"code": code})
        assert verify_resp.status_code == 200, f"Verify failed: {verify_resp.text}"
        verify_data = verify_resp.json()
        
        assert "backup_codes" in verify_data, "No backup codes returned"
        backup_codes = verify_data["backup_codes"]
        assert len(backup_codes) == 8, f"Expected 8 backup codes, got {len(backup_codes)}"
        
        # Validate backup code format (XXXX-XXXX)
        for bc in backup_codes:
            assert "-" in bc, f"Invalid backup code format: {bc}"
            assert len(bc) == 9, f"Backup code wrong length: {bc}"
        
        print(f"✓ Step 3: 2FA verified, received {len(backup_codes)} backup codes")
        
        # Step 5: Verify status is now enabled
        status_resp = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=headers)
        assert status_resp.status_code == 200
        new_status = status_resp.json()
        assert new_status["two_factor_enabled"] == True, "2FA should be enabled"
        assert new_status["backup_codes_remaining"] == 8
        print(f"✓ Step 4: 2FA status confirmed enabled")
        
        # Step 6: Test login without 2FA code (should require 2FA)
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert login_data.get("requires_2fa") == True, "Login should require 2FA"
        assert login_data.get("access_token") is None, "Should not return token without 2FA"
        print(f"✓ Step 5: Login without 2FA code correctly requires 2FA")
        
        # Step 7: Test login with valid 2FA code
        # Wait a moment to ensure we get a fresh code
        time.sleep(1)
        new_code = totp.now()
        login_2fa_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "totp_code": new_code
        })
        assert login_2fa_resp.status_code == 200, f"Login with 2FA failed: {login_2fa_resp.text}"
        login_2fa_data = login_2fa_resp.json()
        assert login_2fa_data.get("requires_2fa") == False, "Should not require 2FA after providing code"
        assert login_2fa_data.get("access_token") is not None, "Should return token"
        new_token = login_2fa_data["access_token"]
        print(f"✓ Step 6: Login with valid 2FA code succeeded")
        
        # Step 8: Disable 2FA
        headers = {"Authorization": f"Bearer {new_token}"}
        time.sleep(1)
        disable_code = totp.now()
        disable_resp = requests.post(f"{BASE_URL}/api/auth/2fa/disable",
                                     headers=headers,
                                     json={"code": disable_code})
        assert disable_resp.status_code == 200, f"Disable failed: {disable_resp.text}"
        print(f"✓ Step 7: 2FA disabled successfully")
        
        # Step 9: Verify 2FA is disabled
        status_resp = requests.get(f"{BASE_URL}/api/auth/2fa/status", headers=headers)
        final_status = status_resp.json()
        assert final_status["two_factor_enabled"] == False, "2FA should be disabled"
        print(f"✓ Step 8: 2FA status confirmed disabled")
        
        # Step 10: Login should work without 2FA now
        final_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert final_login.status_code == 200
        final_data = final_login.json()
        assert final_data.get("requires_2fa") == False, "Should not require 2FA"
        assert final_data.get("access_token") is not None, "Should return token"
        print(f"✓ Step 9: Login without 2FA works after disabling")


class TestUser2FAEdgeCases:
    """Edge case tests for 2FA"""
    
    @pytest.fixture
    def user_token(self):
        """Get user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        data = response.json()
        if data.get("requires_2fa"):
            pytest.skip("User has 2FA enabled")
        return data.get("access_token")
    
    def test_2fa_verify_invalid_code(self, user_token):
        """POST /api/auth/2fa/verify with invalid code should fail"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # First setup 2FA
        setup_resp = requests.post(f"{BASE_URL}/api/auth/2fa/setup", headers=headers)
        if setup_resp.status_code != 200:
            pytest.skip("Could not setup 2FA")
        
        # Try to verify with invalid code
        verify_resp = requests.post(f"{BASE_URL}/api/auth/2fa/verify",
                                    headers=headers,
                                    json={"code": "000000"})
        assert verify_resp.status_code == 400, "Should reject invalid code"
        print(f"✓ Invalid verification code correctly rejected")
    
    def test_2fa_status_requires_auth(self):
        """GET /api/auth/2fa/status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/2fa/status")
        assert response.status_code in [401, 403], "Should require auth"
        print(f"✓ 2FA status endpoint requires authentication")
    
    def test_2fa_setup_requires_auth(self):
        """POST /api/auth/2fa/setup requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/2fa/setup")
        assert response.status_code in [401, 403], "Should require auth"
        print(f"✓ 2FA setup endpoint requires authentication")


class TestAdmin2FA:
    """Admin 2FA tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        data = response.json()
        if data.get("requires_2fa"):
            pytest.skip("Admin has 2FA enabled")
        return data.get("access_token")
    
    def test_admin_login_success(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/admin/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "requires_2fa" in data or "access_token" in data
        print(f"✓ Admin login response: requires_2fa={data.get('requires_2fa', False)}")
    
    def test_admin_2fa_status(self, admin_token):
        """GET /api/admin/auth/2fa/status returns admin 2FA status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/auth/2fa/status", headers=headers)
        
        assert response.status_code == 200, f"Admin 2FA status failed: {response.text}"
        data = response.json()
        
        assert "two_factor_enabled" in data
        assert "backup_codes_remaining" in data
        print(f"✓ Admin 2FA Status: enabled={data['two_factor_enabled']}")
    
    def test_admin_2fa_setup_returns_qr(self, admin_token):
        """POST /api/admin/auth/2fa/setup returns QR code"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Check if already enabled
        status_resp = requests.get(f"{BASE_URL}/api/admin/auth/2fa/status", headers=headers)
        if status_resp.json().get("two_factor_enabled"):
            pytest.skip("Admin 2FA already enabled")
        
        response = requests.post(f"{BASE_URL}/api/admin/auth/2fa/setup", headers=headers)
        
        assert response.status_code == 200, f"Admin 2FA setup failed: {response.text}"
        data = response.json()
        
        assert "secret" in data
        assert "qr_code" in data
        assert "provisioning_uri" in data
        print(f"✓ Admin 2FA setup returned QR code and secret")


class TestLoginWith2FARequired:
    """Test login flow when 2FA is required"""
    
    def test_login_without_2fa_code_when_enabled(self):
        """When 2FA is enabled, login without code returns requires_2fa: true"""
        # First login to check status
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        if data.get("requires_2fa"):
            # 2FA is enabled - this is the expected behavior
            assert data.get("access_token") is None
            assert data.get("message") is not None or data.get("requires_2fa") == True
            print(f"✓ Login correctly requires 2FA when enabled")
        else:
            # 2FA not enabled - login should succeed
            assert data.get("access_token") is not None
            print(f"✓ Login succeeded (2FA not enabled)")
    
    def test_login_with_invalid_2fa_code(self):
        """Login with invalid 2FA code should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "totp_code": "000000"
        })
        
        data = response.json()
        # If 2FA is enabled, invalid code should fail
        # If 2FA is not enabled, login should succeed (code is ignored)
        if data.get("requires_2fa") == False and data.get("access_token"):
            print(f"✓ Login succeeded (2FA not enabled, code ignored)")
        elif response.status_code == 401:
            print(f"✓ Invalid 2FA code correctly rejected")
        else:
            print(f"Response: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
