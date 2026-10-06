#!/usr/bin/env python3
"""
DarkSwap Passthrough Proxy Test Suite
Tests both PRIVATE ROUTE (HoudiniSwap) and PRIVACY SWAP (NEAR Intents) methods
"""

import requests
import json
import random
import uuid
import time
from typing import Dict, Any, Optional

# Base URL from frontend/.env
BASE_URL = "https://darkswap-frontend.preview.emergentagent.com/api/ds"

# Test addresses
EVM_ADDRESS = "0x68b3a9f8940f418e8051ebb659e8ed278fea41f6"
SOLANA_ADDRESS = "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9"

# Test results tracking
test_results = []


def log_test(step: str, passed: bool, details: str, response_data: Optional[Dict] = None):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = {
        "step": step,
        "status": status,
        "passed": passed,
        "details": details,
        "response_data": response_data
    }
    test_results.append(result)
    print(f"\n{status} - {step}")
    print(f"Details: {details}")
    if response_data:
        print(f"Response keys: {list(response_data.keys())}")


def generate_random_amount() -> str:
    """Generate a unique random amount between 4 and 9 with decimals"""
    return f"{random.uniform(4.0, 9.0):.6f}"


def make_request(method: str, endpoint: str, params: Optional[Dict] = None, 
                 json_data: Optional[Dict] = None, retry_on_502: bool = True) -> tuple:
    """Make HTTP request with optional retry on 502"""
    url = f"{BASE_URL}/{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=json_data, timeout=30)
        else:
            return None, f"Unsupported method: {method}"
        
        # Retry once on 502 (upstream flakiness)
        if response.status_code == 502 and retry_on_502:
            print(f"  ⚠️  Got 502, retrying once...")
            time.sleep(2)
            if method == "GET":
                response = requests.get(url, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=json_data, timeout=30)
        
        return response, None
    except Exception as e:
        return None, f"Request failed: {str(e)}"


def test_private_route_houdini():
    """Test PRIVATE ROUTE (HoudiniSwap) - Steps 1-5"""
    print("\n" + "="*80)
    print("TESTING PRIVATE ROUTE (HoudiniSwap)")
    print("="*80)
    
    # Step 1: Get source tokens and find SOL
    print("\n[Step 1] GET /api/ds/tokens?side=source")
    response, error = make_request("GET", "tokens", params={"side": "source"})
    
    if error:
        log_test("Step 1: Get source tokens", False, error)
        return None, None
    
    if response.status_code != 200:
        log_test("Step 1: Get source tokens", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return None, None
    
    try:
        data = response.json()
        if "tokens" not in data or not isinstance(data["tokens"], list):
            log_test("Step 1: Get source tokens", False, 
                    f"Expected {{tokens:[...]}} structure, got: {data}")
            return None, None
        
        # Find SOL token
        sol_token = None
        for token in data["tokens"]:
            if token.get("symbol") == "SOL":
                sol_token = token
                break
        
        if not sol_token:
            log_test("Step 1: Get source tokens", False, 
                    f"SOL token not found in {len(data['tokens'])} tokens")
            return None, None
        
        sol_id = sol_token.get("id")
        if not sol_id:
            log_test("Step 1: Get source tokens", False, 
                    "SOL token found but has no 'id' field")
            return None, None
        
        log_test("Step 1: Get source tokens", True, 
                f"Found {len(data['tokens'])} tokens, SOL id: {sol_id}", 
                {"token_count": len(data["tokens"]), "sol_id": sol_id})
        
    except Exception as e:
        log_test("Step 1: Get source tokens", False, f"JSON parse error: {str(e)}")
        return None, None
    
    # Step 2: Get destination tokens with term=WBTC
    print("\n[Step 2] GET /api/ds/tokens?side=destination&term=WBTC")
    response, error = make_request("GET", "tokens", 
                                   params={"side": "destination", "term": "WBTC"})
    
    if error:
        log_test("Step 2: Get destination tokens", False, error)
        return None, None
    
    if response.status_code != 200:
        log_test("Step 2: Get destination tokens", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return None, None
    
    try:
        data = response.json()
        if "tokens" not in data or not isinstance(data["tokens"], list):
            log_test("Step 2: Get destination tokens", False, 
                    f"Expected {{tokens:[...]}} structure, got: {data}")
            return None, None
        
        if len(data["tokens"]) == 0:
            log_test("Step 2: Get destination tokens", False, 
                    "Expected non-empty tokens array")
            return None, None
        
        # Prefer WBTC, but take first token if WBTC not found
        dest_token = None
        for token in data["tokens"]:
            if token.get("symbol") == "WBTC":
                dest_token = token
                break
        
        if not dest_token:
            dest_token = data["tokens"][0]
        
        dest_id = dest_token.get("id")
        if not dest_id:
            log_test("Step 2: Get destination tokens", False, 
                    "Destination token has no 'id' field")
            return None, None
        
        log_test("Step 2: Get destination tokens", True, 
                f"Found {len(data['tokens'])} tokens, using {dest_token.get('symbol', 'unknown')} id: {dest_id}", 
                {"token_count": len(data["tokens"]), "dest_id": dest_id})
        
    except Exception as e:
        log_test("Step 2: Get destination tokens", False, f"JSON parse error: {str(e)}")
        return None, None
    
    # Step 3: Get quote
    amount = generate_random_amount()
    print(f"\n[Step 3] GET /api/ds/quotes?amount={amount}&from={sol_id}&to={dest_id}")
    response, error = make_request("GET", "quotes", 
                                   params={"amount": amount, "from": sol_id, "to": dest_id})
    
    if error:
        log_test("Step 3: Get quote", False, error)
        return None, None
    
    if response.status_code != 200:
        log_test("Step 3: Get quote", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return None, None
    
    try:
        data = response.json()
        if "quotes" not in data or not isinstance(data["quotes"], list):
            log_test("Step 3: Get quote", False, 
                    f"Expected {{quotes:[...]}} structure, got: {data}")
            return None, None
        
        if len(data["quotes"]) == 0:
            log_test("Step 3: Get quote", False, 
                    "Expected non-empty quotes array")
            return None, None
        
        quote = data["quotes"][0]
        required_keys = ["quoteId", "amountIn", "amountOut", "amountOutUsd"]
        missing_keys = [k for k in required_keys if k not in quote]
        
        if missing_keys:
            log_test("Step 3: Get quote", False, 
                    f"Quote missing required keys: {missing_keys}")
            return None, None
        
        quote_id = quote["quoteId"]
        log_test("Step 3: Get quote", True, 
                f"Got quote: quoteId={quote_id}, amountIn={quote['amountIn']}, amountOut={quote['amountOut']}, amountOutUsd={quote['amountOutUsd']}", 
                {"quoteId": quote_id, "amountOut": quote["amountOut"]})
        
    except Exception as e:
        log_test("Step 3: Get quote", False, f"JSON parse error: {str(e)}")
        return None, None
    
    # Step 4: Create order
    # Determine the correct address based on destination token chain
    # If destination is on Solana, use Solana address; otherwise use EVM address
    # Check if dest_token has chainName or decode the token ID
    dest_chain = dest_token.get("chainName", "").lower()
    if not dest_chain:
        # Try to infer from token ID (contains "c":"solana" or "c":"ethereum")
        import base64
        try:
            # Token IDs are JWT-like, decode the payload part
            token_parts = dest_id.split('.')
            if len(token_parts) >= 2:
                # Add padding if needed
                payload = token_parts[1]
                padding = 4 - len(payload) % 4
                if padding != 4:
                    payload += '=' * padding
                decoded = base64.b64decode(payload).decode('utf-8')
                if '"c":"solana"' in decoded or '"c":"Solana"' in decoded:
                    dest_chain = "solana"
                elif '"c":"ethereum"' in decoded or '"c":"Ethereum"' in decoded:
                    dest_chain = "ethereum"
        except:
            pass
    
    # Use appropriate address
    address_to_use = SOLANA_ADDRESS if "solana" in dest_chain else EVM_ADDRESS
    
    print(f"\n[Step 4] POST /api/ds/orders (using {dest_chain or 'unknown'} address)")
    order_payload = {
        "quoteId": quote_id,
        "addressTo": address_to_use
    }
    response, error = make_request("POST", "orders", json_data=order_payload)
    
    if error:
        log_test("Step 4: Create order", False, error)
        return None, None
    
    if response.status_code != 200:
        log_test("Step 4: Create order", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return None, None
    
    try:
        data = response.json()
        required_keys = ["houdiniId", "depositAddress", "receiverAddress", 
                        "inAmount", "outAmount", "displayStatus", "expires"]
        missing_keys = [k for k in required_keys if k not in data]
        
        if missing_keys:
            log_test("Step 4: Create order", False, 
                    f"Order response missing required keys: {missing_keys}")
            return None, None
        
        houdini_id = data["houdiniId"]
        log_test("Step 4: Create order", True, 
                f"Order created: houdiniId={houdini_id}, depositAddress={data['depositAddress']}, displayStatus={data['displayStatus']}", 
                {"houdiniId": houdini_id, "displayStatus": data["displayStatus"]})
        
    except Exception as e:
        log_test("Step 4: Create order", False, f"JSON parse error: {str(e)}")
        return None, None
    
    # Step 5: Get order status
    print(f"\n[Step 5] GET /api/ds/orders/{houdini_id}")
    response, error = make_request("GET", f"orders/{houdini_id}")
    
    if error:
        log_test("Step 5: Get order status", False, error)
        return None, None
    
    if response.status_code != 200:
        log_test("Step 5: Get order status", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return None, None
    
    try:
        data = response.json()
        if "displayStatus" not in data:
            log_test("Step 5: Get order status", False, 
                    f"Order status missing 'displayStatus' field: {data}")
            return None, None
        
        log_test("Step 5: Get order status", True, 
                f"Order status retrieved: displayStatus={data['displayStatus']}", 
                {"displayStatus": data["displayStatus"]})
        
    except Exception as e:
        log_test("Step 5: Get order status", False, f"JSON parse error: {str(e)}")
        return None, None
    
    return sol_id, dest_id


def test_privacy_swap_near():
    """Test PRIVACY SWAP (NEAR Intents) - Steps 6-9"""
    print("\n" + "="*80)
    print("TESTING PRIVACY SWAP (NEAR Intents)")
    print("="*80)
    
    # Step 6: Get NEAR source tokens and find SOL on Solana
    print("\n[Step 6] GET /api/ds/near/tokens?side=source")
    response, error = make_request("GET", "near/tokens", params={"side": "source"})
    
    if error:
        log_test("Step 6: Get NEAR source tokens", False, error)
        return
    
    if response.status_code != 200:
        log_test("Step 6: Get NEAR source tokens", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return
    
    try:
        data = response.json()
        if "tokens" not in data or not isinstance(data["tokens"], list):
            log_test("Step 6: Get NEAR source tokens", False, 
                    f"Expected {{tokens:[...]}} structure, got: {data}")
            return
        
        # Find SOL token with chainName Solana
        near_sol_token = None
        for token in data["tokens"]:
            if token.get("symbol") == "SOL" and token.get("chainName") == "Solana":
                near_sol_token = token
                break
        
        if not near_sol_token:
            log_test("Step 6: Get NEAR source tokens", False, 
                    f"SOL token on Solana not found in {len(data['tokens'])} tokens")
            return
        
        near_sol_id = near_sol_token.get("id")
        if not near_sol_id:
            log_test("Step 6: Get NEAR source tokens", False, 
                    "SOL token found but has no 'id' field")
            return
        
        log_test("Step 6: Get NEAR source tokens", True, 
                f"Found {len(data['tokens'])} tokens, SOL (Solana) id: {near_sol_id}", 
                {"token_count": len(data["tokens"]), "near_sol_id": near_sol_id})
        
    except Exception as e:
        log_test("Step 6: Get NEAR source tokens", False, f"JSON parse error: {str(e)}")
        return
    
    # Step 7: Get NEAR destination tokens and find ETH on Ethereum
    print("\n[Step 7] GET /api/ds/near/tokens?side=destination")
    response, error = make_request("GET", "near/tokens", params={"side": "destination"})
    
    if error:
        log_test("Step 7: Get NEAR destination tokens", False, error)
        return
    
    if response.status_code != 200:
        log_test("Step 7: Get NEAR destination tokens", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return
    
    try:
        data = response.json()
        if "tokens" not in data or not isinstance(data["tokens"], list):
            log_test("Step 7: Get NEAR destination tokens", False, 
                    f"Expected {{tokens:[...]}} structure, got: {data}")
            return
        
        # Find ETH token with chainName Ethereum
        near_eth_token = None
        for token in data["tokens"]:
            if token.get("chainName") == "Ethereum":
                # Prefer ETH symbol, but any Ethereum token will do
                if token.get("symbol") == "ETH":
                    near_eth_token = token
                    break
                elif not near_eth_token:
                    near_eth_token = token
        
        if not near_eth_token:
            log_test("Step 7: Get NEAR destination tokens", False, 
                    f"No Ethereum token found in {len(data['tokens'])} tokens")
            return
        
        near_eth_id = near_eth_token.get("id")
        if not near_eth_id:
            log_test("Step 7: Get NEAR destination tokens", False, 
                    "Ethereum token found but has no 'id' field")
            return
        
        log_test("Step 7: Get NEAR destination tokens", True, 
                f"Found {len(data['tokens'])} tokens, {near_eth_token.get('symbol', 'unknown')} (Ethereum) id: {near_eth_id}", 
                {"token_count": len(data["tokens"]), "near_eth_id": near_eth_id})
        
    except Exception as e:
        log_test("Step 7: Get NEAR destination tokens", False, f"JSON parse error: {str(e)}")
        return
    
    # Step 8: Create NEAR quote
    amount = generate_random_amount()
    print(f"\n[Step 8] POST /api/ds/near/quote")
    quote_payload = {
        "from": near_sol_id,
        "to": near_eth_id,
        "amount": amount,
        "recipient": EVM_ADDRESS,
        "refundTo": SOLANA_ADDRESS
    }
    response, error = make_request("POST", "near/quote", json_data=quote_payload)
    
    if error:
        log_test("Step 8: Create NEAR quote", False, error)
        return
    
    if response.status_code != 200:
        log_test("Step 8: Create NEAR quote", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return
    
    try:
        data = response.json()
        required_keys = ["quoteId", "amountOut", "estimatedSeconds"]
        missing_keys = [k for k in required_keys if k not in data]
        
        if missing_keys:
            log_test("Step 8: Create NEAR quote", False, 
                    f"NEAR quote missing required keys: {missing_keys}")
            return
        
        near_quote_id = data["quoteId"]
        log_test("Step 8: Create NEAR quote", True, 
                f"NEAR quote created: quoteId={near_quote_id}, amountOut={data['amountOut']}, estimatedSeconds={data['estimatedSeconds']}", 
                {"quoteId": near_quote_id, "amountOut": data["amountOut"]})
        
    except Exception as e:
        log_test("Step 8: Create NEAR quote", False, f"JSON parse error: {str(e)}")
        return
    
    # Step 9: Create NEAR order
    request_id = str(uuid.uuid4())
    print(f"\n[Step 9] POST /api/ds/near/orders")
    order_payload = {
        "quoteId": near_quote_id,
        "requestId": request_id
    }
    response, error = make_request("POST", "near/orders", json_data=order_payload)
    
    if error:
        log_test("Step 9: Create NEAR order", False, error)
        return
    
    if response.status_code != 200:
        log_test("Step 9: Create NEAR order", False, 
                f"Expected 200, got {response.status_code}: {response.text}")
        return
    
    try:
        data = response.json()
        required_keys = ["depositAddress", "requestId", "status"]
        missing_keys = [k for k in required_keys if k not in data]
        
        if missing_keys:
            log_test("Step 9: Create NEAR order", False, 
                    f"NEAR order missing required keys: {missing_keys}")
            return
        
        log_test("Step 9: Create NEAR order", True, 
                f"NEAR order created: depositAddress={data['depositAddress']}, requestId={data['requestId']}, status={data['status']}", 
                {"depositAddress": data["depositAddress"], "status": data["status"]})
        
    except Exception as e:
        log_test("Step 9: Create NEAR order", False, f"JSON parse error: {str(e)}")
        return


def test_allowlist_guard():
    """Test that non-allowed paths are blocked"""
    print("\n" + "="*80)
    print("TESTING ALLOWLIST GUARD")
    print("="*80)
    
    print("\n[Allowlist Test] GET /api/ds/rewards/config (should be blocked)")
    response, error = make_request("GET", "rewards/config", retry_on_502=False)
    
    if error:
        log_test("Allowlist guard test", False, error)
        return
    
    if response.status_code == 403:
        log_test("Allowlist guard test", True, 
                "Non-allowed path correctly blocked with 403", 
                {"status_code": 403})
    else:
        log_test("Allowlist guard test", False, 
                f"Expected 403 for blocked path, got {response.status_code}: {response.text}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for r in test_results if r["passed"])
    failed = sum(1 for r in test_results if not r["passed"])
    total = len(test_results)
    
    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%\n")
    
    if failed > 0:
        print("Failed Tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  ❌ {r['step']}: {r['details']}")
    
    print("\n" + "="*80)


if __name__ == "__main__":
    print("="*80)
    print("DarkSwap Passthrough Proxy Test Suite")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"EVM Address: {EVM_ADDRESS}")
    print(f"Solana Address: {SOLANA_ADDRESS}")
    
    # Run all tests
    test_private_route_houdini()
    test_privacy_swap_near()
    test_allowlist_guard()
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    failed = sum(1 for r in test_results if not r["passed"])
    exit(0 if failed == 0 else 1)
