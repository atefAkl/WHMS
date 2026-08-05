import json

log_path = r"C:\Users\DELL\.gemini\antigravity\brain\5ffad68d-da27-4183-9b04-75222f1258f9\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                # serialize args to see if ContractSettings is in it
                args_str = json.dumps(args)
                if "ContractSettings" in args_str:
                    print(f"Line {line_num}: Tool {name}, target={args.get('TargetFile') or args.get('Target')}")
        except Exception as e:
            pass
