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
    checkerboard: bool = False,
    backdrop: tuple[int, int, int] | None = None,
) -> bool:
    if checkerboard:
        # Checkerboard PNG exports — remove gray tiles only; keep white lab coat
        if abs(r - g) < 12 and abs(g - b) < 12 and 170 <= r <= 220:
            return True
        return False
    if doctor and backdrop is not None:
        # Remove uniform export backdrop (navy / gray) but keep coat & skin tones
        if dist((r, g, b), backdrop) < 48:
            return True
        if abs(r - g) < 12 and abs(g - b) < 12 and 170 <= r <= 220:
            return True
        return False
    if doctor:
        # Green-screen doctor exports — chroma + light gray only
        if g > 180 and r < 120 and b < 120 and g > r + 40 and g > b + 40:
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


def flood_transparent(
    img: Image.Image,
    *,
    doctor: bool = False,
    checkerboard: bool = False,
) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    seen: set[tuple[int, int]] = set()
    q: deque[tuple[int, int]] = deque()
    backdrop = get_backdrop_rgb(img) if doctor and not checkerboard else None

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
        if not is_background_pixel(
            r, g, b, doctor=doctor, checkerboard=checkerboard, backdrop=backdrop
        ):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return rgba


def strip_green_screen(img: Image.Image) -> Image.Image:
    """Remove chroma-key green from interior pockets (not only edge flood)."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if g > 160 and r < 140 and b < 140 and g > r + 28 and g > b + 28:
                px[x, y] = (r, g, b, 0)
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


def portrait_canvas(out: Image.Image, *, pad_pct: float = 0.035) -> Image.Image:
    """Tight portrait export — figure fills the frame (no square letterboxing)."""
    w, h = out.width, out.height
    px = max(6, int(min(w, h) * pad_pct))
    canvas = Image.new("RGBA", (w + 2 * px, h + 2 * px), (0, 0, 0, 0))
    canvas.paste(out, (px, px), out)
    return canvas


def process_file(
    path: Path,
    *,
    doctor: bool = False,
    checkerboard: bool = False,
    portrait: bool = False,
) -> None:
    src = Image.open(path)
    flooded = flood_transparent(src, doctor=doctor, checkerboard=checkerboard)
    if doctor and not checkerboard:
        flooded = strip_green_screen(flooded)
    out = trim_alpha(flooded, pad=4 if doctor or checkerboard else 2)
    if doctor or checkerboard:
        target_h = int(max(out.width, out.height) * 0.96)
        scale = target_h / max(out.height, 1)
        if scale > 1.01 or scale < 0.99:
            nw = max(1, int(out.width * scale))
            nh = max(1, int(out.height * scale))
            out = out.resize((nw, nh), Image.Resampling.LANCZOS)

    if portrait:
        final = portrait_canvas(out)
        final.save(path, "PNG", optimize=True)
        print(
            f"processed {path.name} (portrait {final.width}x{final.height})"
            f" -> {path.stat().st_size // 1024} KB"
        )
        return

    side = max(out.width, out.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - out.width) // 2
    oy = side - out.height - max(2, int(side * 0.02))
    canvas.paste(out, (ox, max(0, oy)), out)
    canvas.save(path, "PNG", optimize=True)
    print(f"processed {path.name} -> {path.stat().st_size // 1024} KB")


def main() -> None:
    args = sys.argv[1:]
    doctor_mode = "--doctor" in args
    checkerboard_mode = "--checkerboard" in args
    portrait_mode = "--portrait" in args
    flags = {"--doctor", "--checkerboard", "--portrait"}
    targets = [Path(p) for p in args if p not in flags]
    if not targets:
        root = Path(__file__).resolve().parents[1] / "public" / "icons" / "medical"
        targets = sorted(root.glob("*.png"))
        doctor_mode = False
        checkerboard_mode = False
        portrait_mode = False
    for path in targets:
        if checkerboard_mode:
            process_file(path, checkerboard=True, portrait=portrait_mode)
        elif doctor_mode or "doctor-female-src" in path.name:
            process_file(path, doctor=True, portrait=portrait_mode)
        else:
            process_file(path, portrait=portrait_mode)


if __name__ == "__main__":
    main()
