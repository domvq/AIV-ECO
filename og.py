from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random, sys
W, H = 1200, 630
img = Image.new("RGB", (W, H))
px = img.load()
top, mid, bot = (27,163,173), (10,104,115), (5,60,70)
for y in range(H):
    t = y / H
    c = [int(top[i] + (mid[i]-top[i]) * t/0.5) if t < .5 else int(mid[i] + (bot[i]-mid[i]) * (t-.5)/.5) for i in range(3)]
    for x in range(W): px[x, y] = tuple(c)
glow = Image.new("RGBA", (W, H), (0,0,0,0)); g = ImageDraw.Draw(glow)
sx, sy = 930, 120
for r in range(300, 0, -6):
    a = int(140 * (1 - r/300) ** 2)
    g.ellipse((sx-r, sy-r, sx+r, sy+r), fill=(210,252,255,a))
rays = Image.new("RGBA", (W, H), (0,0,0,0)); rd = ImageDraw.Draw(rays); random.seed(4)
for k in range(46):
    ang = math.radians(20 + k * 3.4 + random.uniform(-1, 1)); L = random.uniform(500, 900); w = random.uniform(.5, 1.6)
    p1 = (sx + math.cos(ang - math.radians(w)) * L, sy + math.sin(ang - math.radians(w)) * L)
    p2 = (sx + math.cos(ang + math.radians(w)) * L, sy + math.sin(ang + math.radians(w)) * L)
    rd.polygon([(sx, sy), p1, p2], fill=(255,255,255,random.randint(10,26)))
img = Image.alpha_composite(img.convert("RGBA"), rays.filter(ImageFilter.GaussianBlur(3)))
img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(10)))
grass = Image.new("RGBA", (W, H), (0,0,0,0)); gd = ImageDraw.Draw(grass); random.seed(9)
for layer, (base, tip, hk) in enumerate([((11,44,31),(44,106,60),.6), ((17,56,15),(90,154,42),.8), ((23,63,14),(140,198,63),1)]):
    for i in range(260):
        x = random.uniform(-10, W+10); h = random.uniform(70, 190) * hk; lean = random.uniform(-.35, .4); w = random.uniform(2, 4) + layer
        tx, ty = x + lean*h, H - h
        pts = []
        for s in range(11):
            t = s/10; bx = x + (tx-x)*t*t; by = H - h*t
            pts.append((bx, by, w*(1-t)+.4))
        left = [(p[0]-p[2]/2, p[1]) for p in pts]; right = [(p[0]+p[2]/2, p[1]) for p in pts][::-1]
        col = tuple(int(base[j] + (tip[j]-base[j]) * .85) for j in range(3))
        gd.polygon(left + right, fill=col + (235,))
img = Image.alpha_composite(img, grass)
shade = Image.new("RGBA", (W, H), (0,0,0,0)); sd = ImageDraw.Draw(shade)
for x in range(W):
    a = int(120 * max(0, 1 - x / 820)); sd.line([(x, 0), (x, H)], fill=(2,34,40,a))
img = Image.alpha_composite(img, shade)
d = ImageDraw.Draw(img)
F = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"; FB = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"; FR = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
def font(p, s):
    try: return ImageFont.truetype(p, s)
    except Exception: return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)
# AIV mark (same strokes as the app logo), then "Eco"
mark = Image.new("RGBA", (1044, 394), (0,0,0,0)); md = ImageDraw.Draw(mark)
def path(points): md.line([(x-168, y-188) for x, y in points], fill=(255,255,255,255), width=48, joint="curve")
for pts in [[(210,538),(402,232),(582,538)], [(372,432),(428,432)], [(700,232),(700,538)], [(822,232),(992,536),(1164,232)]]:
    path(pts)
    for x, y in (pts[0], pts[-1]): md.ellipse((x-168-24, y-188-24, x-168+24, y-188+24), fill=(255,255,255,255))
mark = mark.resize((int(1044*.16), int(394*.16)), Image.LANCZOS)
img.alpha_composite(mark, (70, 70))
d.text((70 + mark.width + 18, 66), "Eco", font=font(FB, 64), fill=(163,214,76))
d.text((70, 210), "The AI that uses", font=font(FB, 72), fill=(255,255,255))
d.text((70, 292), "less water.", font=font(FB, 72), fill=(255,255,255))
d.text((70, 398), "Your favorite AI models with less water and", font=font(FR, 30), fill=(214,239,238))
d.text((70, 438), "energy consumption. Free to use.", font=font(FR, 30), fill=(214,239,238))
img.convert("RGB").save(sys.argv[1], optimize=True)
print("ok")
