import os
import pkg_resources

# Path to your requirements.txt
REQ_FILE = "requirements.txt"

# Collect all imports from .py files
imports = set()
for root, _, files in os.walk("."):
    for f in files:
        if f.endswith(".py"):
            with open(os.path.join(root, f), "r", encoding="utf-8") as file:
                for line in file:
                    line = line.strip()
                    if line.startswith("import ") or line.startswith("from "):
                        parts = line.replace("import", "from").split()
                        if len(parts) >= 2:
                            imports.add(parts[1].split(".")[0])

# Read requirements.txt
with open(REQ_FILE) as f:
    reqs = {pkg_resources.Requirement.parse(line).name.lower() 
            for line in f if line.strip() and not line.startswith("#")}

# Normalize imports (basic lowercase match)
used = {i.lower() for i in imports}

print("🔍 Imports found in code but missing from requirements.txt:")
missing = used - reqs
print(missing if missing else "✅ None, all imports are covered.")

