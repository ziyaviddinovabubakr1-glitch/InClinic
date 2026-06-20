"""Make InClinic logos transparent with full figure visible."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"


def is_background(r: int, g: int, b: int, a: int) -> bool:
    if a < 10:
        return True
    # pure black
    if r + g + b < 35:
        return True
    # dark navy (loader / site bg tones)
    if r < 22 and g < 45 and b < 75 and max(r, g, b) - min(r, g, b) < 40:
        return True
    return False


def remove_background(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_background(r, g, b, a):
                px[x, y] = (0, 0, 0, 0)
    return im


def trim_and_pad(im: Image.Image, pad_ratio: float = 0.08) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    cropped = im.crop(bbox)
    cw, ch = cropped.size
    pad = int(max(cw, ch) * pad_ratio)
    out = Image.new("RGBA", (cw + pad * 2, ch + pad * 2), (0, 0, 0, 0))
    out.paste(cropped, (pad, pad), cropped)
    return out


def fit_square(im: Image.Image, size: int) -> Image.Image:
    im = trim_and_pad(im)
    w, h = im.size
    scale = min(size / w, size / h) * 0.92
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def process_icon() -> None:
    src = PUBLIC / "logo-icon.png"
    im = Image.open(src)
    transparent = remove_background(im)
    transparent.save(PUBLIC / "logo-icon.png", optimize=True)

    square = fit_square(transparent, 512)
    square.save(PUBLIC / "logo-icon-512.png", optimize=True)
    print("icon ok:", square.size)


def process_full() -> None:
    src = PUBLIC / "logo-full.png"
    im = Image.open(src)
    transparent = remove_background(im)
    transparent.save(PUBLIC / "logo-full.png", optimize=True)
    print("full ok:", transparent.size)


if __name__ == "__main__":
    process_icon()
    process_full()
