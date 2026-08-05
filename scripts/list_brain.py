import os

brain_dir = r"C:\Users\DELL\.gemini\antigravity\brain"
if os.path.exists(brain_dir):
    for item in os.listdir(brain_dir):
        path = os.path.join(brain_dir, item)
        if os.path.isdir(path):
            print(f"Dir: {item}")
            # check logs
            log_dir = os.path.join(path, ".system_generated", "logs")
            if os.path.exists(log_dir):
                print(f"  Logs found: {os.listdir(log_dir)}")
else:
    print("Brain dir does not exist")
