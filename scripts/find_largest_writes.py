import json

log_path = r"C:\Users\DELL\.gemini\antigravity\brain\5ffad68d-da27-4183-9b04-75222f1258f9\.system_generated\logs\transcript.jsonl"

largest_size = 0
largest_line = 0
largest_name = ""
largest_target = ""

with open(log_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                target = args.get("TargetFile", "") or args.get("Target", "")
                if "ContractSettings" in target or "ContractSettings" in json.dumps(args):
                    content = args.get("CodeContent", "") or args.get("ReplacementContent", "")
                    if isinstance(content, list):
                        # chunks
                        content_len = sum(len(c.get("ReplacementContent", "")) for c in content)
                    else:
                        content_len = len(content)
                    
                    if content_len > largest_size:
                        largest_size = content_len
                        largest_line = line_num
                        largest_name = name
                        largest_target = target
        except Exception as e:
            pass

print(f"Largest mention at Line {largest_line}: Tool {largest_name} on {largest_target}, size = {largest_size} bytes")
