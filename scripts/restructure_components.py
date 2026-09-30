"""
KRUSHI - Component Folder Restructuring & Codebase Cleanup Script
Transforms flat frontend/src/components/*.tsx into modular component folders:
  frontend/src/components/<ComponentName>/
    ├── <ComponentName>.tsx
    ├── <ComponentName>.css
    └── index.ts
Also cleans up root duplicate files and moves upload_to_supabase.py to scripts/.
"""

import os
import shutil

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
COMP_DIR = os.path.join(ROOT_DIR, "frontend", "src", "components")

COMPONENTS = [
    "AlertsView",
    "AnalyticsView",
    "AuthModal",
    "ConsumerVerifyView",
    "CreateShipmentView",
    "DashboardView",
    "DevicesView",
    "MonitoringView",
    "Navbar",
    "ShipmentsView",
    "Sidebar",
    "TraceabilityView",
    "TransitHistoryView",
    "TruckOverlay"
]

def main():
    print(f"Starting component restructuring in {COMP_DIR}...")

    # 1. Update firmware/cloud_manager.cpp with root version comments if exists
    root_cm = os.path.join(ROOT_DIR, "cloud_manager.cpp")
    fw_cm = os.path.join(ROOT_DIR, "firmware", "cloud_manager.cpp")
    if os.path.exists(root_cm):
        shutil.copy2(root_cm, fw_cm)
        print("Updated firmware/cloud_manager.cpp with root comments.")

    # 2. Move upload_to_supabase.py to scripts/
    root_uts = os.path.join(ROOT_DIR, "upload_to_supabase.py")
    scripts_uts = os.path.join(ROOT_DIR, "scripts", "upload_to_supabase.py")
    if os.path.exists(root_uts):
        shutil.move(root_uts, scripts_uts)
        print("Moved upload_to_supabase.py to scripts/.")

    # 3. Remove loose redundant files from root
    loose_files = [
        "cloud_manager.cpp",
        "cloud_manager.h",
        "config.h",
        "diagnostics.h",
        "network_manager.h",
        "storage_manager.h",
        "truck1.webp"
    ]
    for filename in loose_files:
        path = os.path.join(ROOT_DIR, filename)
        if os.path.exists(path):
            os.remove(path)
            print(f"Removed loose root file: {filename}")

    # 4. Remove root __pycache__ if exists
    root_pycache = os.path.join(ROOT_DIR, "__pycache__")
    if os.path.exists(root_pycache):
        shutil.rmtree(root_pycache)
        print("Removed root __pycache__.")

    # 5. Remove unused frontend template files
    app_css = os.path.join(ROOT_DIR, "frontend", "src", "App.css")
    if os.path.exists(app_css):
        os.remove(app_css)
        print("Removed unused template frontend/src/App.css.")

    assets_dir = os.path.join(ROOT_DIR, "frontend", "src", "assets")
    if os.path.exists(assets_dir):
        for f in os.listdir(assets_dir):
            fp = os.path.join(assets_dir, f)
            if os.path.isfile(fp):
                os.remove(fp)
                print(f"Removed unused template asset: {f}")

    # 6. Restructure components
    barrel_exports = []
    for name in COMPONENTS:
        old_file = os.path.join(COMP_DIR, f"{name}.tsx")
        target_dir = os.path.join(COMP_DIR, name)
        os.makedirs(target_dir, exist_ok=True)
        target_tsx = os.path.join(target_dir, f"{name}.tsx")
        target_css = os.path.join(target_dir, f"{name}.css")
        target_index = os.path.join(target_dir, "index.ts")

        if os.path.exists(old_file):
            with open(old_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Update relative import paths
            content = content.replace("from '../types'", "from '../../types'")
            content = content.replace("from '../services/api'", "from '../../services/api'")
            content = content.replace("from './AuthModal'", "from '../AuthModal'")
            content = content.replace("from './TruckOverlay'", "from '../TruckOverlay'")

            # Add CSS import at the top
            css_import = f"import './{name}.css';\n"
            if css_import not in content:
                content = css_import + content

            with open(target_tsx, "w", encoding="utf-8") as f:
                f.write(content)

            # Create component-specific CSS file
            if not os.path.exists(target_css):
                with open(target_css, "w", encoding="utf-8") as f:
                    f.write(
                        f"/* Scoped Styles for {name} Component */\n"
                        f".{name.lower()}-view {{\n"
                        f"  /* Component specific styling & micro-animations */\n"
                        f"}}\n"
                    )

            # Create index.ts
            with open(target_index, "w", encoding="utf-8") as f:
                f.write(f"export * from './{name}';\n")

            # Remove old flat file
            os.remove(old_file)
            print(f"Migrated component: {name} -> {name}/{name}.tsx + {name}.css + index.ts")

        barrel_exports.append(f"export * from './{name}';")

    # 7. Create top-level components/index.ts
    top_index = os.path.join(COMP_DIR, "index.ts")
    with open(top_index, "w", encoding="utf-8") as f:
        f.write("// KRUSHI Component Library - Central Barrel Export\n")
        f.write("\n".join(barrel_exports) + "\n")
    print(f"Created top-level barrel export: {top_index}")

    print("Component restructuring complete!")

if __name__ == "__main__":
    main()
