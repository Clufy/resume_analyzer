
import sys
import os
from fastapi.testclient import TestClient

# Add backend to path so we can import app.main
sys.path.append(os.getcwd())

try:
    import main
    app = main.app
except ImportError:
    # If running from root dir
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    import main
    app = main.app 

client = TestClient(app)

def test_delete():
    print("Listing resumes...")
    response = client.get("/resume/resumes")
    if response.status_code != 200:
        print(f"Failed to list resumes: {response.text}")
        return
    
    resumes = response.json()
    if not resumes:
        print("No resumes found to delete. Skipping resume delete test.")
    else:
        target_resume = resumes[0]
        resume_id = target_resume["id"]
        print(f"Targeting resume ID {resume_id} ({target_resume.get('filename')}) for deletion...")

        # Delete
        response = client.delete(f"/resume/resume/{resume_id}")
        if response.status_code == 200:
            print(f"Delete response: {response.json()}")
            
            # Verify
            response = client.get(f"/resume/resume/{resume_id}")
            if response.status_code == 404:
                print("SUCCESS: Resume not found (as expected).")
            else:
                print(f"FAILURE: Resume still exists or error. Status: {response.status_code}")
        else:
            print(f"Failed to delete resume: {response.status_code} - {response.text}")

    # Matches
    print("\nListing matches...")
    response = client.get("/resume/matches")
    if response.status_code != 200:
        print(f"Failed to list matches: {response.text}")
        return

    matches = response.json()
    if not matches:
        print("No matches found to delete. Skipping match delete test.")
        return

    target_match = matches[0]
    match_id = target_match["id"]
    print(f"Targeting match ID {match_id} for deletion...")

    response = client.delete(f"/resume/match/{match_id}")
    if response.status_code == 200:
        print(f"Delete response: {response.json()}")
        
        # Verify
        response = client.get("/resume/matches")
        current_matches = response.json()
        if not any(m["id"] == match_id for m in current_matches):
            print("SUCCESS: Match deletion verified.")
        else:
            print("FAILURE: Match still found in list.")
    else:
        print(f"Failed to delete match: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_delete()
