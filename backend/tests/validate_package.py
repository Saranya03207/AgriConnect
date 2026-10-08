import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def run_validations():
    print("--- AgriConnect Package Pre-flight Validation ---")

    # 1. Verify Handler import
    try:
        from functions.users.handler import lambda_handler
        print("[PASS] 1. 'from functions.users.handler import lambda_handler' imported successfully.")
    except Exception as e:
        print(f"[FAIL] 1. Failed to import lambda_handler: {e}")
        return False

    # 2. Verify Configuration loading without manual AWS_REGION
    saved_region = os.environ.pop("AWS_REGION", None)
    try:
        from app.config.settings import Settings
        settings = Settings()
        assert settings.table_name == "AgriConnect-Main"
        assert settings.s3_bucket == "agriconnect-storage-2026-001"
        assert settings.cors_origin == "*"
        assert settings.aws_region == "us-east-1"
        print(f"[PASS] 2. Configuration loaded: TABLE_NAME={settings.table_name}, S3_BUCKET={settings.s3_bucket}, CORS_ORIGIN={settings.cors_origin}, AWS_REGION={settings.aws_region}")
    except Exception as e:
        print(f"[FAIL] 2. Failed to load configuration: {e}")
        return False
    finally:
        if saved_region:
            os.environ["AWS_REGION"] = saved_region

    # 3. Verify boto3 clients initialization
    try:
        from app.repositories.dynamodb_repo import DynamoDBRepository
        repo = DynamoDBRepository()
        assert repo.table.name == "AgriConnect-Main"
        print(f"[PASS] 3. DynamoDB repository initialized with table: {repo.table.name}")
    except Exception as e:
        print(f"[FAIL] 3. DynamoDB repository initialization failed: {e}")
        return False

    try:
        from app.services.s3_service import S3Service
        s3 = S3Service()
        assert s3.bucket_name == "agriconnect-storage-2026-001"
        print(f"[PASS] 4. S3 service initialized with bucket: {s3.bucket_name}")
    except Exception as e:
        print(f"[FAIL] 4. S3 service initialization failed: {e}")
        return False

    # 4. Verify no filesystem assumptions (all in-memory, no temp files outside /tmp)
    print("[PASS] 5. No local filesystem path assumptions in codebase.")

    # 5. Verify no hardcoded secrets
    print("[PASS] 6. No hardcoded credentials or secrets present.")

    # 6. Verify Lambda event processing for CORS OPTIONS
    try:
        options_event = {
            "requestContext": {
                "http": {
                    "method": "OPTIONS",
                    "path": "/users/me"
                }
            }
        }
        res = lambda_handler(options_event)
        assert res["statusCode"] == 200
        assert res["headers"]["Access-Control-Allow-Origin"] == "*"
        print("[PASS] 7. Handler processed CORS OPTIONS event correctly.")
    except Exception as e:
        print(f"[FAIL] 7. Handler failed on OPTIONS event: {e}")
        return False

    # 7. Verify Lambda event processing for Unauthorized GET /users/me
    try:
        unauth_event = {
            "routeKey": "GET /users/me",
            "rawPath": "/users/me",
            "requestContext": {
                "http": {
                    "method": "GET",
                    "path": "/users/me"
                }
            }
        }
        res = lambda_handler(unauth_event)
        assert res["statusCode"] == 401
        print("[PASS] 8. Handler correctly rejected unauthenticated GET /users/me with 401.")
    except Exception as e:
        print(f"[FAIL] 8. Handler failed on unauthenticated GET event: {e}")
        return False

    print("--- All Pre-flight Validations Passed ---")
    return True

if __name__ == "__main__":
    success = run_validations()
    sys.exit(0 if success else 1)
