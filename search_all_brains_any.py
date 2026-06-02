import os
import json

brain_dir = r"C:\Users\DELL\.gemini\antigravity\brain"

for item in os.listdir(brain_dir):
    path = os.path.join(brain_dir, item)
    if os.path.isdir(path):
        log_file = os.path.join(path, ".system_generated", "logs", "transcript.jsonl")
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        data = json.loads(line)
                        tool_calls = data.get("tool_calls", [])
                        for tc in tool_calls:
                            name = tc.get("name")
                            args = tc.get("args", {})
                            target = args.get("TargetFile", "") or args.get("Target", "")
                            if "ContractSettings" in target or "ContractSettings" in json.dumps(args):
                                print(f"Log {item} Line {line_num}: Tool {name} on {target}")
                                for k in ["CodeContent", "ReplacementContent", "ReplacementChunks"]:
                                    if k in args:
                                        print(f"  {k} size: {len(args[k]) if not isinstance(args[k], list) else f'list of size {len(args[k])}'}")
                    except Exception as e:
                        pass
