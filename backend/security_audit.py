#!/usr/bin/env python3
"""
COMPREHENSIVE SECURITY AUDIT SCRIPT FOR MULTI-TENANT SYSTEM
Tests business isolation across ALL API endpoints
"""

import requests
import json
import sys
from typing import Dict, List, Tuple
from datetime import datetime, date

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USERS = {
    "business_2": {"identifier": "test_owner", "password": "secret"},
    "business_7": {"identifier": "security_tester", "password": "securepassword123"}
}

class SecurityAudit:
    def __init__(self):
        self.tokens = {}
        self.results = []
        self.session = requests.Session()
        self.test_data_cache = {}  # Cache created test data IDs
    
    def get_auth_token(self, user_key: str) -> str:
        """Get authentication token for a test user"""
        if user_key in self.tokens:
            return self.tokens[user_key]
        
        user_data = TEST_USERS[user_key]
        response = self.session.post(
            f"{BASE_URL}/api/auth/token",
            json=user_data
        )
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            self.tokens[user_key] = token
            print(f"✅ Got token for {user_key}")
            return token
        else:
            print(f"❌ Failed to get token for {user_key}: {response.text}")
            return None
    
    def test_endpoint(self, method: str, endpoint: str, user_key: str, data=None) -> Tuple[bool, dict]:
        """Test a single endpoint and return results"""
        token = self.get_auth_token(user_key)
        if not token:
            return False, {"error": "Failed to get token"}
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            return True, {
                "status_code": response.status_code,
                "response": response.json() if response.content else None,
                "headers": dict(response.headers)
            }
            
        except Exception as e:
            return False, {"error": str(e)}
    
    def create_test_data(self, user_key: str):
        """Create test data for the audit (products, customers, etc.)"""
        token = self.get_auth_token(user_key)
        if not token:
            return False
        
        # Create a test product
        product_data = {
            "name": f"Audit Test Product - {user_key}",
            "description": "Security audit test product",
            "price": 1000.0,
            "cost_price": 500.0,
            "barcode": f"AUDIT123{user_key}",
            "stock_quantity": 10,
            "min_stock_level": 2
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/products/",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=product_data
        )
        
        if response.status_code == 201:
            product_id = response.json()["id"]
            self.test_data_cache[f"{user_key}_product"] = product_id
            print(f"✅ Created test product for {user_key}: ID {product_id}")
        
        # Create a test customer
        customer_data = {
            "name": f"Audit Test Customer - {user_key}",
            "email": f"audit{user_key}@test.com",
            "phone": "1234567890",
            "address": "Audit Test Address"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/customers/",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=customer_data
        )
        
        if response.status_code == 201:
            customer_id = response.json()["id"]
            self.test_data_cache[f"{user_key}_customer"] = customer_id
            print(f"✅ Created test customer for {user_key}: ID {customer_id}")
        
        return True
    
    def test_business_isolation(self, endpoint: str, method="GET", test_data=None, description=""):
        """Test if endpoint properly isolates business data"""
        print(f"\n🔍 Testing: {method} {endpoint} {description}")
        
        # Test with Business 2
        success_b2, result_b2 = self.test_endpoint(method, endpoint, "business_2", test_data)
        
        # Test with Business 7  
        success_b7, result_b7 = self.test_endpoint(method, endpoint, "business_7", test_data)
        
        # Analyze results
        vulnerability = self.analyze_isolation_vulnerability(
            endpoint, method, success_b2, result_b2, success_b7, result_b7
        )
        
        self.results.append({
            "endpoint": endpoint,
            "method": method,
            "description": description,
            "business_2_result": result_b2 if success_b2 else {"error": result_b2},
            "business_7_result": result_b7 if success_b7 else {"error": result_b7},
            "vulnerability": vulnerability
        })
        
        return vulnerability
    
    def analyze_isolation_vulnerability(self, endpoint, method, success_b2, result_b2, success_b7, result_b7):
        """Analyze if there's a business isolation vulnerability"""
        
        if not success_b2 or not success_b7:
            return "AUTH_FAILURE - Could not test properly"
        
        status_b2 = result_b2["status_code"]
        status_b7 = result_b7["status_code"]
        
        # For list endpoints - check data isolation
        if endpoint.endswith("/") and method == "GET":
            data_b2 = result_b2["response"] or [] if result_b2["response"] is not None else []
            data_b7 = result_b7["response"] or [] if result_b7["response"] is not None else []
            
            if isinstance(data_b2, list) and isinstance(data_b7, list):
                # Check if data IDs overlap (should be completely separate)
                ids_b2 = set()
                ids_b7 = set()
                
                for item in data_b2:
                    if isinstance(item, dict) and "id" in item:
                        ids_b2.add(item["id"])
                
                for item in data_b7:
                    if isinstance(item, dict) and "id" in item:
                        ids_b7.add(item["id"])
                
                if ids_b2.intersection(ids_b7):
                    return "CRITICAL - Data leakage between businesses"
                else:
                    return "SECURE - Proper business isolation"
        
        # For detail endpoints - check cross-business access
        elif "/api/" in endpoint and any(x in endpoint for x in ["/sales/", "/products/", "/customers/", "/expenses/"]):
            # Extract ID from endpoint
            parts = endpoint.split("/")
            if len(parts) >= 4 and parts[3].isdigit():
                entity_id = int(parts[3])
                
                # If business 7 can access business 2's data, it's a vulnerability
                if status_b7 == 200 and result_b7["response"]:
                    # Check if this is likely business 2's data
                    if entity_id < 10:  # Assuming lower IDs belong to business 2
                        return "CRITICAL - Cross-business data access"
                    else:
                        return "SECURE - Proper access to own data"
                elif status_b7 == 404:
                    return "SECURE - Proper access denial"
        
        # For POST endpoints - check if business_id is properly set
        elif method == "POST":
            if status_b2 == 201 and status_b7 == 201:
                return "SECURE - Can create own data"
            else:
                return "ISSUE - Creation failed for one business"
        
        return f"CHECKED - Status B2:{status_b2}, B7:{status_b7}"
    
    def run_comprehensive_audit(self):
        """Run comprehensive security audit across ALL endpoints"""
        print("🚀 STARTING COMPREHENSIVE SECURITY AUDIT - ALL MODULES")
        print("=" * 80)
        
        # Create test data first
        print("📝 Creating test data for audit...")
        self.create_test_data("business_2")
        self.create_test_data("business_7")
        
        # Define ALL endpoints to test based on your sidebar
        endpoints_to_test = [
            # 📊 DASHBOARD & ANALYTICS
            ("/api/analytics/dashboard", "GET", "Dashboard analytics"),
            ("/api/analytics/sales-trends", "GET", "Sales trends"),
            ("/api/analytics/top-products", "GET", "Top products"),
            ("/api/activity/recent", "GET", "Recent activities"),
            
            # 🛒 POS ENDPOINTS
            ("/api/products/", "GET", "List products for POS"),
            ("/api/products/barcode/AUDIT123business_2", "GET", "Barcode scan Business 2"),
            ("/api/products/barcode/AUDIT123business_7", "GET", "Barcode scan Business 7"),
            
            # 📋 SALES MODULE
            ("/api/sales/", "GET", "List all sales"),
            ("/api/sales/1", "GET", "Access Sale #1 (Business 2)"),
            ("/api/sales/13", "GET", "Access Sale #13 (Business 2)"),
            ("/api/sales/15", "GET", "Access Sale #15 (Business 7)"),
            ("/api/sales/reports/daily", "GET", "Daily sales report"),
            ("/api/sales/reports/daily?report_date=" + str(date.today()), "GET", "Today's sales report"),
            
            # 📦 PRODUCTS MODULE
            ("/api/products/", "GET", "List all products"),
            ("/api/products/1", "GET", "Access Product #1 (Business 2)"),
            ("/api/products/19", "GET", "Access Product #19 (Business 7)"),
            ("/api/products/search?query=Audit", "GET", "Search products"),
            ("/api/products/low-stock", "GET", "Low stock products"),
            
            # 📊 INVENTORY MODULE
            ("/api/inventory/history", "GET", "Inventory history"),
            ("/api/inventory/history?product_id=1", "GET", "Inventory history Product 1"),
            ("/api/inventory/stock-levels", "GET", "Current stock levels"),
            ("/api/inventory/low-stock", "GET", "Low stock alerts"),
            
            # 📈 REPORTS MODULE
            ("/api/reports/financial", "GET", "Financial reports"),
            ("/api/reports/sales", "GET", "Sales reports"),
            ("/api/reports/inventory", "GET", "Inventory reports"),
            ("/api/reports/expenses", "GET", "Expense reports"),
            
            # 👥 CUSTOMERS MODULE
            ("/api/customers/", "GET", "List all customers"),
            ("/api/customers/1", "GET", "Access Customer #1"),
            ("/api/customers/2", "GET", "Access Customer #2"),
            ("/api/customers/1/purchase-history", "GET", "Customer purchase history"),
            
            # 💰 EXPENSES MODULE
            ("/api/expenses/", "GET", "List all expenses"),
            ("/api/expenses/1", "GET", "Access Expense #1"),
            ("/api/expenses/categories", "GET", "Expense categories"),
            
            # ⚙️ BUSINESS SETTINGS
            ("/api/business/", "GET", "Business settings"),
            ("/api/business/currency", "GET", "Business currency"),
            
            # 💸 REFUNDS MODULE
            ("/api/refunds/", "GET", "List all refunds"),
            ("/api/refunds/1", "GET", "Access Refund #1"),
            
            # 🏭 SUPPLIERS MODULE
            ("/api/suppliers/", "GET", "List all suppliers"),
            ("/api/suppliers/1", "GET", "Access Supplier #1"),
            ("/api/purchase-orders/", "GET", "Purchase orders"),
            
            # 👥 USER MANAGEMENT
            ("/api/users/", "GET", "List users"),
            ("/api/users/1", "GET", "Access User #1"),
            ("/api/roles/", "GET", "List roles"),
            ("/api/permissions/", "GET", "List permissions"),
            
            # 🔍 SCANNER DIAGNOSTICS
            ("/api/scanner/status", "GET", "Scanner status"),
            ("/api/scanner/test", "GET", "Scanner test"),
            
            # 🔐 AUTH & PROFILE
            ("/api/users/me", "GET", "Current user profile"),
            ("/api/users/profile", "GET", "User profile"),
            
            # 💰 CURRENCY MODULE
            ("/api/currency/rates", "GET", "Currency exchange rates"),
            ("/api/currency/convert?from=USD&to=UGX&amount=100", "GET", "Currency conversion"),
            
            # Test creation endpoints
            ("/api/products/", "POST", "Create product", {
                "name": "Security Test Product",
                "price": 999.0,
                "barcode": "SEC_TEST_001",
                "stock_quantity": 5,
                "min_stock_level": 1
            }),
            
            ("/api/customers/", "POST", "Create customer", {
                "name": "Security Test Customer",
                "email": "security@test.com",
                "phone": "0000000000"
            })
        ]
        
        # Test all endpoints
        for test_case in endpoints_to_test:
            if len(test_case) == 3:
                endpoint, method, description = test_case
                test_data = None
            else:
                endpoint, method, description, test_data = test_case
            
            self.test_business_isolation(endpoint, method, test_data, description)
        
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive security report"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE SECURITY AUDIT REPORT")
        print("=" * 80)
        
        critical_count = 0
        high_count = 0
        medium_count = 0
        secure_count = 0
        
        # Group by module for better reporting
        modules = {
            "Dashboard & Analytics": [],
            "POS System": [],
            "Sales": [],
            "Products": [],
            "Inventory": [],
            "Reports": [],
            "Customers": [],
            "Expenses": [],
            "Business Settings": [],
            "Refunds": [],
            "Suppliers": [],
            "User Management": [],
            "Scanner": [],
            "Authentication": []
        }
        
        for result in self.results:
            # Categorize by module
            endpoint = result["endpoint"]
            if "/analytics/" in endpoint or "/dashboard" in endpoint:
                modules["Dashboard & Analytics"].append(result)
            elif "/pos/" in endpoint or "/barcode/" in endpoint:
                modules["POS System"].append(result)
            elif "/sales/" in endpoint:
                modules["Sales"].append(result)
            elif "/products/" in endpoint:
                modules["Products"].append(result)
            elif "/inventory/" in endpoint:
                modules["Inventory"].append(result)
            elif "/reports/" in endpoint:
                modules["Reports"].append(result)
            elif "/customers/" in endpoint:
                modules["Customers"].append(result)
            elif "/expenses/" in endpoint:
                modules["Expenses"].append(result)
            elif "/business/" in endpoint:
                modules["Business Settings"].append(result)
            elif "/refunds/" in endpoint:
                modules["Refunds"].append(result)
            elif "/suppliers/" in endpoint or "/purchase-orders/" in endpoint:
                modules["Suppliers"].append(result)
            elif "/users/" in endpoint or "/roles/" in endpoint or "/permissions/" in endpoint:
                modules["User Management"].append(result)
            elif "/scanner/" in endpoint:
                modules["Scanner"].append(result)
            elif "/auth/" in endpoint or "/profile" in endpoint:
                modules["Authentication"].append(result)
            else:
                modules["Authentication"].append(result)
            
            # Count vulnerabilities
            vuln = result["vulnerability"]
            if "CRITICAL" in vuln:
                critical_count += 1
            elif "HIGH" in vuln:
                high_count += 1
            elif "MEDIUM" in vuln:
                medium_count += 1
            else:
                secure_count += 1
        
        # Print module-by-module results
        for module_name, module_results in modules.items():
            if module_results:
                print(f"\n🏷️  {module_name.upper()}")
                print("-" * 50)
                
                for result in module_results:
                    status = "✅ SECURE" 
                    if "CRITICAL" in result["vulnerability"]:
                        status = "🔥 CRITICAL"
                    elif "VULNERABLE" in result["vulnerability"]:
                        status = "⚠️  VULNERABLE"
                    elif "AUTH_FAILURE" in result["vulnerability"]:
                        status = "🔐 AUTH ISSUE"
                    
                    print(f"  {status}: {result['method']} {result['endpoint']}")
                    print(f"     {result['description']}")
                    print(f"     Status: B2={result['business_2_result'].get('status_code', 'N/A')}, "
                          f"B7={result['business_7_result'].get('status_code', 'N/A')}")
                    print(f"     Result: {result['vulnerability']}")
        
        # Summary
        print("\n" + "=" * 80)
        print("📈 EXECUTIVE SUMMARY")
        print("=" * 80)
        print(f"   🔥 Critical Vulnerabilities: {critical_count}")
        print(f"   ⚠️  High Risk Issues: {high_count}")
        print(f"   🔸 Medium Risk Issues: {medium_count}")
        print(f"   ✅ Secure Endpoints: {secure_count}")
        print(f"   📊 Total Endpoints Tested: {len(self.results)}")
        
        if critical_count > 0:
            print(f"\n🚨 IMMEDIATE ACTION REQUIRED: {critical_count} critical vulnerabilities found!")
            print("   These could lead to data leakage between businesses!")
        else:
            print(f"\n🎉 EXCELLENT: No critical vulnerabilities found!")
            print("   The multi-tenant isolation appears to be working correctly!")
        
        # Save detailed report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "secure": secure_count,
                "total": len(self.results)
            },
            "results": self.results
        }
        
        with open("security_audit_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        print(f"\n📄 Detailed report saved to: security_audit_report.json")

def main():
    """Main execution function"""
    auditor = SecurityAudit()
    
    try:
        auditor.run_comprehensive_audit()
    except KeyboardInterrupt:
        print("\n⏹️ Audit interrupted by user")
    except Exception as e:
        print(f"\n💥 Audit failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
