import os
import shutil
import subprocess
import sys
import zipfile


def build_deployment_package():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    staging_dir = os.path.join(project_root, "build_procurement_lambda")
    zip_output_path = os.path.join(project_root, "agriconnect-procurement-deployment.zip")

    print(f"Project root: {project_root}")
    print(f"Staging directory: {staging_dir}")
    print(f"Target ZIP: {zip_output_path}")

    # 1. Clean previous build directory and zip
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    if os.path.exists(zip_output_path):
        os.remove(zip_output_path)

    os.makedirs(staging_dir, exist_ok=True)

    # 2. Install Linux x86_64 Python 3.12 dependencies into staging
    print("\n[Step 1] Installing Python 3.12 Linux dependencies...")
    cmd = [
        sys.executable, "-m", "pip", "install",
        "--target", staging_dir,
        "--platform", "manylinux2014_x86_64",
        "--implementation", "cp",
        "--python-version", "3.12",
        "--only-binary=:all:",
        "pydantic>=2.6.0"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error during pip install: {result.stderr}")
        sys.exit(1)
    print("Dependencies successfully installed into staging.")

    # 3. Copy application code: app/
    print("\n[Step 2] Copying app/ package...")
    src_app = os.path.join(project_root, "backend", "app")
    dest_app = os.path.join(staging_dir, "app")
    shutil.copytree(src_app, dest_app, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))

    # 4. Copy functions/procurement/ code
    print("\n[Step 3] Copying functions/ package...")
    dest_functions = os.path.join(staging_dir, "functions")
    os.makedirs(dest_functions, exist_ok=True)
    # Copy functions/__init__.py
    src_functions_init = os.path.join(project_root, "backend", "functions", "__init__.py")
    if os.path.exists(src_functions_init):
        shutil.copy2(src_functions_init, os.path.join(dest_functions, "__init__.py"))
    else:
        with open(os.path.join(dest_functions, "__init__.py"), "w") as f:
            f.write('"""Functions package"""\n')

    # Copy functions/procurement/
    src_procurement = os.path.join(project_root, "backend", "functions", "procurement")
    dest_procurement = os.path.join(dest_functions, "procurement")
    shutil.copytree(src_procurement, dest_procurement, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))

    # 5. Clean any __pycache__ or *.pyc files in staging
    print("\n[Step 4] Cleaning cache files...")
    for root, dirs, files in os.walk(staging_dir):
        for d in dirs:
            if d == "__pycache__":
                shutil.rmtree(os.path.join(root, d))
        for f in files:
            if f.endswith(".pyc"):
                os.remove(os.path.join(root, f))

    # 6. Create ZIP file
    print("\n[Step 5] Building ZIP archive...")
    with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(staging_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, staging_dir)
                zipf.write(full_path, rel_path)

    zip_size_bytes = os.path.getsize(zip_output_path)
    zip_size_mb = zip_size_bytes / (1024 * 1024)
    print(f"ZIP package created: {zip_output_path}")
    print(f"ZIP package size: {zip_size_bytes} bytes ({zip_size_mb:.2f} MB)")

    # 7. Inspect ZIP entries
    print("\n[Step 6] Verifying ZIP package contents...")
    with zipfile.ZipFile(zip_output_path, "r") as zipf:
        names = zipf.namelist()
        has_app_init = "app/__init__.py" in names
        has_procurement_handler = "functions/procurement/handler.py" in names
        has_pydantic = any(n.startswith("pydantic/") for n in names)
        has_pydantic_core = any("pydantic_core" in n for n in names)

        print(f" - app/__init__.py: {'PRESENT' if has_app_init else 'MISSING'}")
        print(f" - functions/procurement/handler.py: {'PRESENT' if has_procurement_handler else 'MISSING'}")
        print(f" - pydantic package: {'PRESENT' if has_pydantic else 'MISSING'}")
        print(f" - pydantic_core (Linux): {'PRESENT' if has_pydantic_core else 'MISSING'}")

        if not (has_app_init and has_procurement_handler and has_pydantic and has_pydantic_core):
            print("ERROR: Deployment package is missing critical components!")
            sys.exit(1)

    # 8. Clean up temporary staging directory
    shutil.rmtree(staging_dir)
    print("\n[Done] Package build and verification complete.")


if __name__ == "__main__":
    build_deployment_package()
