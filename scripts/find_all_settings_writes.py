import json

log_path = r"C:\Users\DELL\.gemini\antigravity\brain\5ffad68d-da27-4183-9b04-75222f1258f9\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                    args = tc.get("args", {})
                    target = args.get("TargetFile", "") or args.get("Target", "")
                    if "ContractSettings.jsx" in target or "ContractSettings_recovered.jsx" in target:
                        # Print some stats
                        content_keys = ["CodeContent", "ReplacementContent", "ReplacementChunks"]
                        found_content = ""
                        for k in content_keys:
                            if k in args:
                                val = args[k]
                                if isinstance(val, list):
                                    found_content = f"Chunks count: {len(val)}"
                                else:
                                    found_content = f"Text length: {len(val)}"
                        print(f"Line {line_num}: Tool {name} on {target}. Content info: {found_content}")
        except Exception as e:
            pass
