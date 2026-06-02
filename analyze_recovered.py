import sys

# Set standard output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

with open("C:/laragon/www/WHMS/resources/js/Pages/Settings/ContractSettings_recovered.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

missing_count = 0
code_count = 0
for idx, line in enumerate(lines, 1):
    if "MISSING LINE" in line:
        missing_count += 1
    else:
        code_count += 1
        if len(line.strip()) > 0 and code_count < 100:
            print(f"Line {idx}: {line.strip()}")

print(f"Total lines: {len(lines)}")
print(f"Missing lines: {missing_count}")
print(f"Code lines: {code_count}")
