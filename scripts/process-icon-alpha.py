"""Remove solid/chroma/checkerboard backgrounds from icon PNGs."""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image


def dist(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5


def get_backdrop_rgb(img: Image.Image) -> tuple[int, int, int]:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    pts = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2),
    ]
    rs = gs = bs = 0
    for x, y in pts:
        r, g, b, _ = px[x, y]
        rs += r
        gs += g
        bs += b
    n = len(pts)
    return rs // n, gs // n, bs // n


def is_background_pixel(
    r: int,
    g: int,
    b: int,
    *,
    doctor: bool = False,
    backdrop: tuple[int, int, int] | None = None,
) -> bool:
    if doctor and backdrop is not None:
        # Remove uniform export backdrop (navy / gray) but keep coat & skin tones
        if dist((r, g, b), backdrop) < 48:
            return True
        if r > 245 and g > 245 and b > 245:
            return True
        if abs(r - g) < 12 and abs(g - b) < 12 and 170 <= r <= 220:
            return True
        return False
    # Chroma key green
    if g > 180 and r < 120 and b < 120 and g > r + 40 and g > b + 40:
        return True
    # White / near-white (outer export background)
    if r > 245 and g > 245 and b > 245:
        return True
    # Checkerboard grays
    if abs(r - g) < 12 and abs(g - b) < 12 and 170 <= r <= 220:
        return True
    # Light gray card backgrounds inside service icons
    if abs(r - g) < 10 and abs(g - b) < 10 and r > 210:
        return True
    # Dark UI panel blues baked into service icon exports
    if b > r and b > g and b > 90 and r < 80 and g < 110:
        return True
    if r < 45 and g < 70 and b > 70:
        return True
    return False


def flood_transparent(img: Image.Image, *, doctor: bool = False) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    seen: set[tuple[int, int]] = set()
    q: deque[tuple[int, int]] = deque()
    backdrop = get_backdrop_rgb(img) if doctor else None

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if (x, y) in seen or x < 0 or x >= w or y < 0 or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if not is_background_pixel(r, g, b, doctor=doctor, backdrop=backdrop):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return rgba


def trim_alpha(img: Image.Image, pad: int = 2) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def process_file(path: Path, *, doctor: bool = False) -> None:
    src = Image.open(path)
    out = trim_alpha(flood_transparent(src, doctor=doctor), pad=4 if doctor else 2)
    side = max(out.width, out.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - out.width) // 2
    # Doctors: sit slightly lower so bust fills the frame
    oy = (side - out.height) // 2 + (int(side * 0.04) if doctor else 0)
    canvas.paste(out, (ox, oy), out)
    canvas.save(path, "PNG", optimize=True)
    print(f"processed {path.name} -> {path.stat().st_size // 1024} KB")


def main() -> None:
    args = sys.argv[1:]
    doctor_mode = "--doctor" in args
    targets = [Path(p) for p in args if p != "--doctor"]
    if not targets:
        root = Path(__file__).resolve().parents[1] / "public" / "icons" / "medical"
        targets = sorted(root.glob("*.png"))
        doctor_mode = False
    for path in targets:
        is_doc = doctor_mode or "doctor" in path.name
        process_file(path, doctor=is_doc)


if __name__ == "__main__":
    main()
