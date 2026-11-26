import json, numpy as np
from PIL import Image, ImageDraw
IN='/mnt/project-files/nanjing-map/inbox/'
# city raster frame (metres): x -10000..10000, z -14000..8000, 5 m/px
X0,X1,Z0,Z1,R=-12000,12000,-18000,22000,6.0
W,H=int((X1-X0)/R),int((Z1-Z0)/R)
def px(x,z): return ((x-X0)/R,(z-Z0)/R)
b=json.load(open(IN+'banks.json'))['reaches']
from collections import defaultdict
polys=defaultdict(list)
for r in b: polys[(r['poly'],r['hole'])].append(r)
im=Image.new('L',(W,H),0); d=ImageDraw.Draw(im)
for (pid,hole),rs in sorted(polys.items(), key=lambda k:k[0][1]):
    pts=[]
    for r in rs:
        p=r['p']; pts+= [px(p[i]/10,p[i+1]/10) for i in range(0,len(p),2)]
    if len(pts)>2: d.polygon(pts, fill=0 if hole else 255)
im.save('bake/water_banks.png')
bw=json.load(open(IN+'backdrop_water.json'))['polys']
im2=Image.new('L',(W,H),0); d2=ImageDraw.Draw(im2)
for p in bw:
    for ring in p['rings']:
        pts=[px(ring[i],ring[i+1]) for i in range(0,len(ring),3)]
        if len(pts)>2: d2.polygon(pts, fill=255)
im2.save('bake/water_backdrop.png')
print(W,H)
