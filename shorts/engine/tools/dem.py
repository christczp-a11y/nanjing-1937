import math, os, sys, io, urllib.request, numpy as np
from PIL import Image
def tile(lon,lat,z):
    n=2**z; x=(lon+180)/360*n; y=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n; return x,y
def fetch(z,x,y,cache):
    p=f"{cache}/{z}_{x}_{y}.png"
    if not os.path.exists(p):
        urllib.request.urlretrieve(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",p)
    a=np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    return a[...,0]*256+a[...,1]+a[...,2]/256-32768
def mosaic(lon0,lat0,lon1,lat1,z,cache,out):
    os.makedirs(cache,exist_ok=True)
    x0,y0=tile(lon0,lat1,z); x1,y1=tile(lon1,lat0,z)
    tx0,ty0,tx1,ty1=int(x0),int(y0),int(x1),int(y1)
    rows=[]
    for ty in range(ty0,ty1+1):
        rows.append(np.concatenate([fetch(z,tx,ty,cache) for tx in range(tx0,tx1+1)],axis=1))
    m=np.concatenate(rows,axis=0)
    # crop to exact
    px0=int((x0-tx0)*256); py0=int((y0-ty0)*256); px1=int((x1-tx0)*256); py1=int((y1-ty0)*256)
    m=m[py0:py1,px0:px1]
    np.save(out,m); print(out,m.shape,m.min(),m.max())
z=int(sys.argv[1]); a=list(map(float,sys.argv[2:6])); mosaic(*a,z,"/home/claude/nmap/data/tiles",sys.argv[6])
