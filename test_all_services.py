import os
import time
import requests
import subprocess
from urllib3.exceptions import NewConnectionError

def start_services():
    """Start required services using docker-compose"""
    print("Starting services...")
    services = ["tika", "auto-tagging", "ai-summarization"]
    cmd = ["docker-compose", "up", "-d"] + services
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error starting services:\n{result.stderr}")
            return False
    
        # Wait for services to be ready with retries
        print("Waiting for services to start...")
        max_retries = 5
        for i in range(max_retries):
            time.sleep(5)
            if all(check_service(url) for url in [
                "http://localhost:9998",
                "http://localhost:8001/health",
                "http://localhost:8002/health"
            ]):
                return True
            print(f"Retry {i+1}/{max_retries} - Waiting for services...")
        
        print("Timeout waiting for services to start")
        return False
    except subprocess.CalledProcessError as e:
        print(f"Failed to start services: {str(e)}")
        return False

def stop_services():
    """Stop the test services"""
    print("\nStopping services...")
    subprocess.run(["docker-compose", "stop", "tika", "auto-tagging", "ai-summarization"])

def check_service(url):
    """Check if a service is available"""
    try:
        response = requests.get(url, timeout=2)
        if response.status_code != 200:
            print(f"Service at {url} returned status {response.status_code}")
        return response.status_code == 200
    except (requests.exceptions.ConnectionError, NewConnectionError) as e:
        print(f"Connection error checking {url}: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error checking {url}: {str(e)}")
        return False

def test_services():
    """Test all available services"""
    services = {
        "Tika": "http://localhost:9998",
        "Auto Tagging": "http://localhost:8001/health", 
        "AI Summarization": "http://localhost:8002/health"
    }

    print("\n=== Testing Services ===")
    for name, url in services.items():
        if check_service(url):
            print(f"\nTesting {name} service...")
            
            if name == "Tika":
                # Test Tika text extraction
                test_file = "test.txt"
                try:
                    with open(test_file, "w") as f:
                        f.write("Test document about AI and machine learning.")
                    
                    with open(test_file, "rb") as f:
                        response = requests.put(
                            "http://localhost:9998/tika",
                            data=f,
                            headers={"Accept": "text/plain"},
                            timeout=5
                        )
                    print(f"Status: {response.status_code}")
                    print(f"Extracted text: {response.text[:100]}...")
                except Exception as e:
                    print(f"Tika test failed: {str(e)}")
            
            elif name == "Auto Tagging":
                # Test auto-tagging
                try:
                    sample_text = "AI is transforming industries through ML."
                    labels = ["technology", "science", "business"]
                    response = requests.post(
                        "http://localhost:8001/generate-tags",
                        json={"text": sample_text, "candidate_labels": labels},
                        timeout=5
                    )
                    print(f"Generated tags: {response.json()}")
                except Exception as e:
                    print(f"Tagging test failed: {str(e)}")
            
            elif name == "AI Summarization":
                # Test summarization
                try:
                    long_text = """Artificial intelligence (AI) is intelligence demonstrated by machines..."""
                    response = requests.post(
                        "http://localhost:8002/summarize", 
                        json={"text": long_text, "max_length": 150},
                        timeout=5
                    )
                    print(f"Summary: {response.json()}")
                except Exception as e:
                    print(f"Summarization test failed: {str(e)}")
        else:
            print(f"\n{name} service not available")

if __name__ == "__main__":
    try:
        if not start_services():
            print("\nFailed to start one or more services. See logs above.")
            exit(1)
            
        test_services()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
    finally:
        stop_services()