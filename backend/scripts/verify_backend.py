import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def check_health():
    print("Checking health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("Health check passed:", response.json())
            return True
        else:
            print("Health check failed:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Health check error:", e)
        return False

def check_resumes():
    print("Checking resumes list...")
    try:
        response = requests.get(f"{BASE_URL}/resume/resumes")
        if response.status_code == 200:
            resumes = response.json()
            print("Resumes list passed, count:", len(resumes))
            return resumes[0]["id"] if resumes else None
        else:
            print("Resumes list failed:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Resumes list error:", e)
        return False

def check_matches():
    print("Checking matches list...")
    try:
        response = requests.get(f"{BASE_URL}/resume/matches")
        if response.status_code == 200:
            print("Matches list passed, count:", len(response.json()))
            return True
        else:
            print("Matches list failed:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Matches list error:", e)
        return False

def check_create_match(resume_id):
    if not resume_id:
        print("Skipping create match (no resume available)")
        return True
        
    print(f"Checking create match for resume {resume_id}...")
    try:
        payload = {
            "resume_id": resume_id, 
            "job_description": "We are looking for a software engineer with Python skills."
        }
        response = requests.post(f"{BASE_URL}/resume/match", json=payload)
        if response.status_code == 200:
            print("Create match passed:", response.json().get("match_score"))
            return True
        else:
            print("Create match failed:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Create match error:", e)
        return False

def check_stats():
    print("Checking stats...")
    try:
        response = requests.get(f"{BASE_URL}/resume/stats")
        if response.status_code == 200:
            print("Stats passed:", response.json())
            return True
        else:
            print("Stats failed:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Stats error:", e)
        return False

if __name__ == "__main__":
    # Wait for server to start if running immediately
    time.sleep(2)
    
    if not check_health():
        sys.exit(1)
        
    resume_id = check_resumes()
    if resume_id is False: # Check explicitly for False as it returns ID or False
        sys.exit(1)
        
    if not check_matches():
        sys.exit(1)
        
    if not check_create_match(resume_id):
        sys.exit(1)
        
    if not check_stats():
        sys.exit(1)
        
    print("All checks passed!")
