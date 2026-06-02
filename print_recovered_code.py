import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("C:/laragon/www/WHMS/resources/js/Pages/Settings/ContractSettings_recovered.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for idx, line in enumerate(lines, 1):
    if "MISSING LINE" not in line:
        print(f"{idx}: {line}", end="")
