"""Quick Supabase connectivity and table verification script.

Run this from the backend directory:
    python test_supabase.py
"""

import sys
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client
from app.core.config import settings

def main():
    print("=" * 50)
    print("Supabase Connection Test")
    print("=" * 50)
    print(f"URL: {settings.supabase_url}")
    print()

    sb = create_client(settings.supabase_url, settings.supabase_key)
    passed = 0
    failed = 0

    # Test 1: resumes table
    try:
        r = sb.table("resumes").select("id").limit(1).execute()
        print("[PASS] resumes table      — accessible")
        passed += 1
    except Exception as e:
        print(f"[FAIL] resumes table      — {e}")
        failed += 1

    # Test 2: job_descriptions table
    try:
        r = sb.table("job_descriptions").select("id").limit(1).execute()
        print("[PASS] job_descriptions   — accessible")
        passed += 1
    except Exception as e:
        print(f"[FAIL] job_descriptions   — {e}")
        failed += 1

    # Test 3: matches table
    try:
        r = sb.table("matches").select("id").limit(1).execute()
        print("[PASS] matches table      — accessible")
        passed += 1
    except Exception as e:
        print(f"[FAIL] matches table      — {e}")
        failed += 1

    # Test 4: storage bucket
    try:
        buckets = sb.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if "resumes" in bucket_names:
            print("[PASS] storage bucket     — 'resumes' exists")
            passed += 1
        else:
            print(f"[FAIL] storage bucket     — 'resumes' not found (found: {bucket_names})")
            failed += 1
    except Exception as e:
        print(f"[FAIL] storage bucket     — {e}")
        failed += 1

    # Test 5: insert + delete a test row
    try:
        r = sb.table("resumes").insert({
            "filename": "__test__.pdf",
            "text": "test row - safe to delete",
        }).execute()
        test_id = r.data[0]["id"]
        sb.table("resumes").delete().eq("id", test_id).execute()
        print("[PASS] insert/delete      — write operations work")
        passed += 1
    except Exception as e:
        print(f"[FAIL] insert/delete      — {e}")
        failed += 1

    print()
    print(f"Results: {passed} passed, {failed} failed")
    if failed == 0:
        print("ALL TESTS PASSED!")
    else:
        print("Some tests failed — check your credentials and migration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
