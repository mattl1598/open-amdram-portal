from pathlib import Path

input_dir = Path(__file__).resolve().parent.parent / ".build" / "reactx"
output_file = Path(__file__).resolve().parent.parent / "webapp" / "static" / "react" / "app.js"

if not input_dir.exists():
    raise FileNotFoundError(f"Build directory not found: {input_dir}")

files = sorted(p for p in input_dir.rglob("*.js") if p.is_file())

combined = "\n\n".join(path.read_text(encoding="utf-8") for path in files)

output_file.parent.mkdir(parents=True, exist_ok=True)
output_file.write_text(combined, encoding="utf-8")

print(f"Bundled {len(files)} file(s) into {output_file}")