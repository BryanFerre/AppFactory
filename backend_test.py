#!/usr/bin/env python3
"""
NAPP Node Operator Dashboard - Backend API Testing
Tests all backend endpoints for the decentralized blockchain dashboard
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class NAPPBackendTester:
    def __init__(self, base_url="https://microbiz-node.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials from review request
        self.test_email = "newuser@napp.io"
        self.test_password = "testpass123"
        self.test_name = "New Operator"

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data and isinstance(response_data, dict):
            result["response_keys"] = list(response_data.keys())
            
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200) -> tuple[bool, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
                
            return success, response_data
            
        except requests.exceptions.Timeout:
            return False, "Request timeout (30s)"
        except requests.exceptions.ConnectionError:
            return False, "Connection error - backend may be down"
        except Exception as e:
            return False, f"Request error: {str(e)}"

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health & Basic Endpoints...")
        
        # Test root endpoint
        success, data = self.make_request('GET', '/')
        self.log_test("Root endpoint", success, 
                     f"Message: {data.get('message', 'N/A')}" if success else str(data))
        
        # Test health endpoint
        success, data = self.make_request('GET', '/health')
        self.log_test("Health check", success,
                     f"Status: {data.get('status', 'N/A')}" if success else str(data))

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        # Test registration with valid data
        reg_data = {
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        }
        
        success, data = self.make_request('POST', '/auth/register', reg_data, 200)
        
        if success:
            self.token = data.get('access_token')
            user_data = data.get('user', {})
            self.user_id = user_data.get('id')
            
            self.log_test("User registration", True, 
                         f"User ID: {self.user_id}, Token received: {bool(self.token)}")
        else:
            # If user already exists, try login instead
            if "already registered" in str(data).lower():
                self.log_test("User registration", True, "User already exists - will test login")
                return self.test_user_login()
            else:
                self.log_test("User registration", False, str(data))
                return False
        
        return success

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data, 200)
        
        if success:
            self.token = data.get('access_token')
            user_data = data.get('user', {})
            self.user_id = user_data.get('id')
            
            self.log_test("User login", True,
                         f"User ID: {self.user_id}, Token received: {bool(self.token)}")
        else:
            self.log_test("User login", False, str(data))
            
        return success

    def test_auth_me(self):
        """Test get current user"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        if not self.token:
            self.log_test("Auth me", False, "No token available")
            return False
            
        success, data = self.make_request('GET', '/auth/me')
        self.log_test("Get current user", success,
                     f"User: {data.get('name', 'N/A')}" if success else str(data))
        return success

    def test_node_endpoints(self):
        """Test node-related endpoints"""
        print("\n🔍 Testing Node Endpoints...")
        
        if not self.token:
            self.log_test("Node stats", False, "No authentication token")
            return False
        
        # Test node stats
        success, data = self.make_request('GET', '/node/stats')
        if success:
            required_fields = ['node_id', 'status', 'uptime_percent', 'cpu_usage', 'memory_usage']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                self.log_test("Node stats", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Node stats", True, 
                             f"Status: {data.get('status')}, Uptime: {data.get('uptime_percent')}%")
        else:
            self.log_test("Node stats", False, str(data))
        
        # Test node verification
        success, data = self.make_request('POST', '/node/verify')
        self.log_test("Node verification", success,
                     f"Message: {data.get('message', 'N/A')}" if success else str(data))

    def test_earnings_endpoints(self):
        """Test earnings-related endpoints"""
        print("\n🔍 Testing Earnings Endpoints...")
        
        if not self.token:
            self.log_test("Earnings", False, "No authentication token")
            return False
        
        # Test earnings data
        success, data = self.make_request('GET', '/earnings')
        if success:
            required_fields = ['today_opt', 'today_usd', 'week_opt', 'month_opt', 'earnings_by_app']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                self.log_test("Earnings data", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Earnings data", True,
                             f"Today: {data.get('today_opt')} OPT, Month: {data.get('month_opt')} OPT")
        else:
            self.log_test("Earnings data", False, str(data))
        
        # Test OPT price
        success, data = self.make_request('GET', '/price/opt')
        self.log_test("OPT price", success,
                     f"Price: ${data.get('price_usd', 'N/A')}" if success else str(data))

    def test_apps_endpoints(self):
        """Test app-related endpoints"""
        print("\n🔍 Testing Apps Endpoints...")
        
        if not self.token:
            self.log_test("Apps endpoints", False, "No authentication token")
            return False
        
        # Test installed apps
        success, data = self.make_request('GET', '/apps/installed')
        if success:
            app_count = len(data) if isinstance(data, list) else 0
            self.log_test("Installed apps", True, f"Found {app_count} installed apps")
        else:
            self.log_test("Installed apps", False, str(data))
        
        # Test available apps
        success, data = self.make_request('GET', '/apps/available')
        if success:
            app_count = len(data) if isinstance(data, list) else 0
            self.log_test("Available apps", True, f"Found {app_count} available apps")
        else:
            self.log_test("Available apps", False, str(data))
        
        # Test available apps with filters
        success, data = self.make_request('GET', '/apps/available?trending=true')
        if success:
            trending_count = len(data) if isinstance(data, list) else 0
            self.log_test("Trending apps filter", True, f"Found {trending_count} trending apps")
        else:
            self.log_test("Trending apps filter", False, str(data))

    def test_other_endpoints(self):
        """Test other dashboard endpoints"""
        print("\n🔍 Testing Other Dashboard Endpoints...")
        
        if not self.token:
            self.log_test("Other endpoints", False, "No authentication token")
            return False
        
        # Test capacity
        success, data = self.make_request('GET', '/capacity')
        if success:
            required_fields = ['total_capacity', 'used_capacity', 'available_capacity']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                self.log_test("Capacity data", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Capacity data", True,
                             f"Used: {data.get('used_capacity')}/{data.get('total_capacity')} GB")
        else:
            self.log_test("Capacity data", False, str(data))
        
        # Test payouts
        success, data = self.make_request('GET', '/payouts')
        if success:
            payout_count = len(data) if isinstance(data, list) else 0
            self.log_test("Payouts history", True, f"Found {payout_count} payout records")
        else:
            self.log_test("Payouts history", False, str(data))
        
        # Test promotion stats
        success, data = self.make_request('GET', '/promotion/stats')
        if success:
            required_fields = ['clicks', 'referrals', 'conversions']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                self.log_test("Promotion stats", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Promotion stats", True,
                             f"Clicks: {data.get('clicks')}, Referrals: {data.get('referrals')}")
        else:
            self.log_test("Promotion stats", False, str(data))
        
        # Test notifications
        success, data = self.make_request('GET', '/notifications')
        if success:
            notif_count = len(data) if isinstance(data, list) else 0
            self.log_test("Notifications", True, f"Found {notif_count} notifications")
        else:
            self.log_test("Notifications", False, str(data))
        
        # Test AI recommendations
        success, data = self.make_request('GET', '/ai/recommendations')
        if success:
            rec_count = len(data) if isinstance(data, list) else 0
            self.log_test("AI recommendations", True, f"Found {rec_count} recommendations")
        else:
            self.log_test("AI recommendations", False, str(data))

    def test_app_installation(self):
        """Test app installation flow"""
        print("\n🔍 Testing App Installation...")
        
        if not self.token:
            self.log_test("App installation", False, "No authentication token")
            return False
        
        # Get available apps first
        success, apps_data = self.make_request('GET', '/apps/available')
        if not success or not apps_data:
            self.log_test("App installation prep", False, "Could not fetch available apps")
            return False
        
        # Try to install the first available app
        if isinstance(apps_data, list) and len(apps_data) > 0:
            app_to_install = apps_data[0]
            app_id = app_to_install.get('id')
            app_name = app_to_install.get('name', 'Unknown')
            
            success, data = self.make_request('POST', f'/apps/install/{app_id}')
            if success:
                self.log_test("App installation", True, f"Installed {app_name}")
            else:
                # Check if it's a capacity issue or already installed
                error_msg = str(data)
                if "capacity" in error_msg.lower():
                    self.log_test("App installation", True, f"Capacity check working - {error_msg}")
                elif "already" in error_msg.lower():
                    self.log_test("App installation", True, f"App already installed - {error_msg}")
                else:
                    self.log_test("App installation", False, error_msg)
        else:
            self.log_test("App installation", False, "No available apps to install")

    def run_all_tests(self):
        """Run comprehensive backend test suite"""
        print("🚀 Starting NAPP Node Dashboard Backend Tests")
        print(f"📡 Testing API: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        self.test_health_check()
        
        # Test authentication flow
        auth_success = self.test_user_registration()
        if not auth_success:
            auth_success = self.test_user_login()
        
        if not auth_success:
            print("\n❌ CRITICAL: Authentication failed - cannot test protected endpoints")
            return self.generate_summary()
        
        # Test authenticated endpoints
        self.test_auth_me()
        self.test_node_endpoints()
        self.test_earnings_endpoints()
        self.test_apps_endpoints()
        self.test_other_endpoints()
        self.test_app_installation()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Categorize failures
        critical_failures = []
        minor_failures = []
        
        for result in self.test_results:
            if not result['success']:
                test_name = result['test'].lower()
                if any(keyword in test_name for keyword in ['login', 'register', 'health', 'node stats']):
                    critical_failures.append(result)
                else:
                    minor_failures.append(result)
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(critical_failures)}):")
            for failure in critical_failures:
                print(f"  - {failure['test']}: {failure['details']}")
        
        if minor_failures:
            print(f"\n⚠️  MINOR FAILURES ({len(minor_failures)}):")
            for failure in minor_failures:
                print(f"  - {failure['test']}: {failure['details']}")
        
        if success_rate >= 90:
            print(f"\n✅ Backend is in excellent condition!")
        elif success_rate >= 70:
            print(f"\n⚠️  Backend has some issues but is mostly functional")
        else:
            print(f"\n❌ Backend has significant issues requiring attention")
        
        return {
            'success_rate': success_rate,
            'tests_run': self.tests_run,
            'tests_passed': self.tests_passed,
            'critical_failures': critical_failures,
            'minor_failures': minor_failures,
            'all_results': self.test_results
        }

def main():
    """Main test execution"""
    tester = NAPPBackendTester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results['success_rate'] >= 70:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())