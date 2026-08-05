import json

log_path = r"C:\Users\DELL\.gemini\antigravity\brain\5ffad68d-da27-4183-9b04-75222f1258f9\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            if not tool_calls:
                continue
                
            for tc in tool_calls:
                if tc.get("name") in ["replace_file_content", "multi_replace_file_content"]:
                    args = tc.get("args", {})
                    target = args.get("TargetFile", "")
                    if "ContractSettings.jsx" in target:
                        print(f"\n--- Tool call at line {line_num} ({tc.get('name')}) ---")
                        if tc.get("name") == "replace_file_content":
                            print(f"StartLine: {args.get('StartLine')}, EndLine: {args.get('EndLine')}")
                            print("TargetContent:")
                            print(args.get("TargetContent"))
                            print("ReplacementContent:")
                            print(args.get("ReplacementContent"))
                        else:
                            chunks = args.get("ReplacementChunks", [])
                            print(f"Multi-replace chunks count: {len(chunks)}")
                            for idx, chunk in enumerate(chunks):
                                print(f"  Chunk {idx}: StartLine={chunk.get('StartLine')}, EndLine={chunk.get('EndLine')}")
                                print("  TargetContent:")
                                print(chunk.get("TargetContent"))
                                print("  ReplacementContent:")
                                print(chunk.get("ReplacementContent"))
        except Exception as e:
            pass
