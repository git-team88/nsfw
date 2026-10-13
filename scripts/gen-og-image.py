#!/usr/bin/env python3
"""
gen-og-image.py — 生成 public/og-image.png（1200x630，og:image / twitter:image 用）

用法：python3 scripts/gen-og-image.py [输出路径]      默认 public/og-image.png
依赖：Pillow（pip install pillow）；CJK 字体自动探测（Noto Sans CJK / 苹方 / 思源黑体）

三个站共用这份脚本，只改顶部 SITE；配色取自各站前端实际用色（Home / base.css 里出现最多的几个），
logo 用 public/logo.png（= src/assets/images/header/logo.png）。
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

SITE = "nsfw"

THEMES = {
    # bl：浅色系 —— 灰蓝文字 + 天蓝/淡紫渐变（和 logo 一致）
    "bl": dict(
        bg=(246, 248, 252), bg2=(230, 237, 246),
        accent=(147, 196, 232), accent2=(195, 176, 230),
        fg=(71, 84, 107), fg_sub=(133, 146, 168), fg_mute=(159, 176, 228),
        logo_w=520, url="www.blfans.ai",
    ),
    # social：奶白底 + 墨色文字 + 粉/黄点缀（贴纸风，和站内一致；#161122 是文字/描边色，不是背景）
    "social": dict(
        bg=(255, 251, 244), bg2=(255, 253, 247),
        accent=(255, 77, 141), accent2=(255, 210, 63),
        fg=(22, 17, 34), fg_sub=(91, 85, 102), fg_mute=(154, 147, 164),
        logo_w=540, url="www.moegen.ai",
    ),
    # nsfw：深灰底 + 粉色强调 + 浅灰文字
    "nsfw": dict(
        bg=(26, 26, 26), bg2=(44, 44, 44),
        accent=(255, 79, 154), accent2=(255, 45, 127),
        fg=(245, 245, 245), fg_sub=(170, 170, 170), fg_mute=(255, 154, 202),
        logo_w=560, url="www.fansfans.ai",
    ),
}

W, H = 1200, 630
TAGLINE = "AI で小説・漫画・アニメドラマを一括生成"
SUB = "AI Novel · Comic · Anime Drama"
DESC = "ひとことで物語を —— 30K 文字無料からスタート"

FONT_CANDIDATES = [
    ("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    ("/System/Library/Fonts/PingFang.ttc", "/System/Library/Fonts/PingFang.ttc"),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", "/System/Library/Fonts/Hiragino Sans GB.ttc"),
    ("/Library/Fonts/SourceHanSansJP-Bold.otf", "/Library/Fonts/SourceHanSansJP-Regular.otf"),
    ("C:/Windows/Fonts/msgothic.ttc", "C:/Windows/Fonts/msgothic.ttc"),
]

def pick_fonts():
    for b, r in FONT_CANDIDATES:
        if os.path.exists(b) and os.path.exists(r):
            return b, r
    sys.exit("找不到 CJK 字体，请安装 Noto Sans CJK 或在 FONT_CANDIDATES 里补上本机字体路径")

def load(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.truetype(path, size)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "public/og-image.png"
    T = THEMES[SITE]
    bold_path, regular_path = pick_fonts()
    f_tag = load(bold_path, 54)
    f_sub = load(regular_path, 34)
    f_desc = load(regular_path, 28)
    f_url = load(regular_path, 26)

    # 底色：左上 → 右下 的轻微渐变
    img = Image.new("RGB", (W, H), T["bg"])
    px = img.load()
    for y in range(H):
        for x in range(0, W, 4):
            c = lerp(T["bg"], T["bg2"], (x / W * 0.6 + y / H * 0.4))
            for dx in range(4):
                if x + dx < W:
                    px[x + dx, y] = c

    img = img.convert("RGBA")

    d = ImageDraw.Draw(img)

    # 左侧强调条：accent → accent2 竖向渐变
    for y in range(H):
        d.line([(0, y), (14, y)], fill=lerp(T["accent"], T["accent2"], y / H))

    x = 96

    # logo（透明底 PNG，按主题宽度等比缩放，LANCZOS 保证小图放大不糊）
    logo_path = os.path.join(os.path.dirname(out) or ".", "logo.png")
    y_cursor = 96
    if os.path.exists(logo_path):
        lg = Image.open(logo_path).convert("RGBA")
        ratio = T["logo_w"] / lg.width
        lg = lg.resize((T["logo_w"], int(lg.height * ratio)), Image.LANCZOS)
        img.alpha_composite(lg, (x - 8, y_cursor))
        y_cursor += lg.height + 44
    else:
        print(f"⚠ 未找到 {logo_path}，跳过 logo", file=sys.stderr)
        y_cursor += 120

    # 标语
    d = ImageDraw.Draw(img)
    d.text((x, y_cursor), TAGLINE, font=f_tag, fill=T["fg"])
    y_cursor += 54 + 22
    # 强调短线
    d.rounded_rectangle([x, y_cursor, x + 96, y_cursor + 6], radius=3, fill=T["accent"])
    y_cursor += 6 + 28
    d.text((x, y_cursor), SUB, font=f_sub, fill=T["fg_sub"])
    y_cursor += 34 + 14
    d.text((x, y_cursor), DESC, font=f_desc, fill=T["fg_sub"])

    # 右下角域名
    tw = d.textlength(T["url"], font=f_url)
    d.text((W - 96 - tw, H - 96), T["url"], font=f_url, fill=T["fg"])

    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"已生成 {out}  ({W}x{H}, {os.path.getsize(out):,} 字节, 风格={SITE})")

if __name__ == "__main__":
    main()
