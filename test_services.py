import requests
import os
from urllib3.exceptions import NewConnectionError

def check_service(url):
    try:
        response = requests.get(url, timeout=2)
        return response.status_code == 200
    except (requests.exceptions.ConnectionError, NewConnectionError):
        return False

def test_services():
    services = {
        "Tika": "http://localhost:9998",
        "Auto Tagging": "http://localhost:8001/health",
        "AI Summarization": "http://localhost:8002/health"
    }

    print("=== Service Availability ===")
    available_services = {}
    for name, url in services.items():
        if check_service(url):
            print(f"{name}: Available")
            available_services[name] = url
        else:
            print(f"{name}: Not available")

    # Test Tika service if available
    if "Tika" in available_services:
        print("\n=== Testing Tika Service ===")
        test_file = "test.txt"
        try:
            with open(test_file, "w") as f:
                f.write("This is a test document about artificial intelligence and machine learning.")
            
            print("Extracting text:")
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

    # Test Auto Tagging if available
    if "Auto Tagging" in available_services:
        print("\n=== Testing Auto Tagging ===")
        try:
            health = requests.get("http://localhost:8001/health", timeout=5)
            print(f"Health check: {health.status_code} - {health.json()}")
            
            sample_text = "Artificial intelligence is transforming industries through machine learning."
            labels = ["technology", "science", "business", "education"]
            print(f"\nGenerating tags for: '{sample_text}'")
            tags = requests.post(
                "http://localhost:8001/generate-tags",
                json={"text": sample_text, "candidate_labels": labels},
                timeout=5
            )
            print(f"Generated tags: {tags.json()}")
        except Exception as e:
            print(f"Tagging test failed: {str(e)}")

    # Test AI Summarization if available
    if "AI Summarization" in available_services:
        print("\n=== Testing AI Summarization ===")
        try:
            health = requests.get("http://localhost:8002/health", timeout=5)
            print(f"Health check: {health.status_code} - {health.json()}")
            
            long_text = """Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals."""
            print(f"\nSummarizing text: '{long_text[:50]}...'")
            summary = requests.post(
                "http://localhost:8002/summarize",
                json={"text": long_text, "max_length": 150},
                timeout=5
            )
            print(f"Summary: {summary.json()}")
        except Exception as e:
            print(f"Summarization test failed: {str(e)}")

if __name__ == "__main__":
    test_services()