import json

log_path = r"C:\Users\DELL\.gemini\antigravity\brain\5ffad68d-da27-4183-9b04-75222f1258f9\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        if line_num in [3342, 3379]:
            try:
                data = json.loads(line)
                tool_calls = data.get("tool_calls", [])
                for tc in tool_calls:
                    name = tc.get("name")
                    args = tc.get("args", {})
                    target = args.get("TargetFile", "")
                    content = args.get("CodeContent", "")
                    print(f"Line {line_num}: {name} to {target}, content length = {len(content)}")
                    out_path = f"C:/laragon/www/WHMS/extracted_line_{line_num}.jsx"
                    with open(out_path, "w", encoding="utf-8") as out:
                        out.write(content)
                    print(f"  Saved to {out_path}")
            except Exception as e:
                print(f"Error at line {line_num}: {e}")
