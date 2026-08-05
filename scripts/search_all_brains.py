import os
import json

brain_dir = r"C:\Users\DELL\.gemini\antigravity\brain"
found_versions = []

for item in os.listdir(brain_dir):
    path = os.path.join(brain_dir, item)
    if os.path.isdir(path):
        log_file = os.path.join(path, ".system_generated", "logs", "transcript.jsonl")
        if os.path.exists(log_file):
            print(f"Scanning log file in {item}...")
            with open(log_file, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        data = json.loads(line)
                        tool_calls = data.get("tool_calls", [])
                        for tc in tool_calls:
                            name = tc.get("name")
                            if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                                args = tc.get("args", {})
                                target = args.get("TargetFile", "") or args.get("Target", "")
                                if "ContractSettings.jsx" in target:
                                    content = args.get("CodeContent", "") or args.get("ReplacementContent", "")
                                    if isinstance(content, str) and len(content) > 10000:
                                        print(f"  -> Found write at line {line_num} in {item}, size = {len(content)}")
                                        found_versions.append((item, line_num, content))
                    except Exception as e:
                        pass

# Sort by size or just inspect the largest one
if found_versions:
    found_versions.sort(key=lambda x: len(x[2]), reverse=True)
    largest_folder, largest_line, largest_content = found_versions[0]
    print(f"\nLargest version: size {len(largest_content)} from folder {largest_folder} line {largest_line}")
    out_path = "C:/laragon/www/WHMS/resources/js/Pages/Settings/ContractSettings_perfect_recovered.jsx"
    with open(out_path, "w", encoding="utf-8") as out:
        out.write(largest_content)
    print(f"Saved largest content to {out_path}")
else:
    print("No version larger than 10000 bytes found.")
