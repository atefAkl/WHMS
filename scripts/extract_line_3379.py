import json

log_path = r"C:\Users\DELL\.gemini\antigravity\brain\5ffad68d-da27-4183-9b04-75222f1258f9\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        if line_num == 3379:
            try:
                data = json.loads(line)
                tool_calls = data.get("tool_calls", [])
                for tc in tool_calls:
                    args = tc.get("args", {})
                    content = args.get("CodeContent", "")
                    print(f"Type of CodeContent: {type(content)}")
                    if isinstance(content, str):
                        print(f"Content length: {len(content)}")
                        print(f"Lines count: {len(content.splitlines())}")
                        # Save it to a clean file
                        with open("C:/laragon/www/WHMS/resources/js/Pages/Settings/ContractSettings_extracted.jsx", "w", encoding="utf-8") as out:
                            out.write(content)
                        print("Saved to ContractSettings_extracted.jsx successfully!")
            except Exception as e:
                print(f"Error: {e}")
