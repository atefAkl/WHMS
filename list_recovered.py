import os

for f in os.listdir("C:/laragon/www/WHMS"):
    if f.startswith("recovered_"):
        path = os.path.join("C:/laragon/www/WHMS", f)
        size = os.path.getsize(path)
        print(f"{f}: {size} bytes")
