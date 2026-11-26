import json, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
IN='/mnt/project-files/nanjing-map/inbox/'
phi=math.radians(32.05)
M_LAT=111132.954-559.822*math.cos(2*phi)+1.175*math.cos(4*phi)
M_LON=111412.84*math.cos(phi)-93.5*math.cos(3*phi)
def ll2w(lon,lat): return ((lon-118.78)*M_LON, -(lat-32.05)*M_LAT)
def w2ll(x,z): return (x/M_LON+118.78, -z/M_LAT+32.05)
def merc(lon,lat,zoom):
    n=2**zoom; return ((lon+180)/360*n*256, (1-np.arcsinh(np.tan(np.radians(lat)))/np.pi)/2*n*256)
def demgrid(npy,zoom,bbox,X0,X1,Z0,Z1,R):
    lon0,lat0,lon1,lat1=bbox
    gx0,gy0=merc(lon0,lat1,zoom); gx0=int(gx0); gy0=int(gy0)  # crop origin (same int truncation as dem.py)
    d=np.load(npy)
    W,H=int((X1-X0)/R),int((Z1-Z0)/R)
    xs=X0+(np.arange(W)+.5)*R; zs=Z0+(np.arange(H)+.5)*R
    XX,ZZ=np.meshgrid(xs,zs); lon,lat=w2ll(XX,ZZ)
    mx,my=merc(lon,lat,zoom); u=mx-gx0; v=my-gy0
    # bilinear
    u=np.clip(u,0,d.shape[1]-1.001); v=np.clip(v,0,d.shape[0]-1.001)
    iu=u.astype(int); iv=v.astype(int); fu=u-iu; fv=v-iv
    e=(d[iv,iu]*(1-fu)*(1-fv)+d[iv,iu+1]*fu*(1-fv)+d[iv+1,iu]*(1-fu)*fv+d[iv+1,iu+1]*fu*fv)
    return e
def hillshade(e,R,exag=1.0,az=315,alt=40):
    gy,gx=np.gradient(e*exag,R)
    slope=np.arctan(np.hypot(gx,gy)); aspect=np.arctan2(-gx,gy)
    azr=math.radians(360-az+90); altr=math.radians(alt)
    hs=np.sin(altr)*np.cos(slope)+np.cos(altr)*np.sin(slope)*np.cos(azr-aspect)
    return np.clip(hs,0,1)
LAND=np.array([214,206,190],float); LAND_HI=np.array([196,186,166],float)
WATER=np.array([58,74,84],float)
def compose(e,water,R,exag,name,blur_relief=0):
    hs=hillshade(e,R,exag)
    flat=hillshade(np.zeros_like(e),R)
    shade=(hs-flat[0,0])  # relative
    h=np.clip(e/400,0,1)[...,None]
    col=LAND*(1-h*0.5)+LAND_HI*(h*0.5)
    col=col*(1+shade[...,None]*0.9)
    w=water.astype(float)[...,None]
    col=col*(1-w)+WATER*w
    img=Image.fromarray(np.clip(col,0,255).astype(np.uint8))
    img.save(name,quality=90)
    return img

def city():
    X0,X1,Z0,Z1,R=-12000,12000,-18000,22000,6.0
    e=demgrid('data/dem_city.npy',13,(118.62,31.83,118.94,32.24),X0,X1,Z0,Z1,R)
    W,H=e.shape[1],e.shape[0]
    a=np.asarray(Image.open('bake/water_banks.png'))>0
    b=np.asarray(Image.open('bake/water_backdrop.png'))>0
    xs=X0+(np.arange(W)+.5)*R; zs=Z0+(np.arange(H)+.5)*R
    XX,ZZ=np.meshgrid(xs,zs)
    inside=(XX>-6912)&(XX<6912)&(ZZ>-9984)&(ZZ<6400)
    from scipy import ndimage
    demw=np.asarray(Image.fromarray(((e<=3.2)*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7)))>0
    lab,n=ndimage.label(demw); sizes=ndimage.sum(demw,lab,range(1,n+1))
    big=np.isin(lab,1+np.nonzero(sizes>20000)[0])
    water=a|b|big
    e=ndimage.gaussian_filter(e,3)
    m=Image.fromarray((water*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
    wf=np.asarray(m)/255.0
    e2=np.where(water,np.minimum(e,4),e)
    compose(e2,wf,R,2.0,'bake/city.jpg')
    np.save('bake/city_water.npy',water); np.save('bake/city_elev.npy',e2.astype(np.float32))
    json.dump(dict(X0=X0,X1=X1,Z0=Z0,Z1=Z1,R=R),open('bake/city.json','w'))
    # heightmap (8-bit, 0..500m) for 3D relief
    Image.fromarray(np.clip(e2/500*255,0,255).astype(np.uint8)).resize((W//4,H//4),Image.BILINEAR).save('bake/city_h.png')

def rivers_near(r):
    from scipy import ndimage
    return ndimage.binary_dilation(r,iterations=12)
def big():
    X0,X1,Z0,Z1,R=-330000,450000,-380000,500000,250.0
    e=demgrid('data/dem_big.npy',8,(115.0,27.5,123.6,35.8),X0,X1,Z0,Z1,R)
    W,H=e.shape[1],e.shape[0]
    def poly_layer(fn,filt=None,width=None):
        im=Image.new('L',(W,H),0); d=ImageDraw.Draw(im)
        g=json.load(open(fn))
        for f in g['features']:
            if filt and not filt(f['properties']): continue
            geo=f['geometry']; t=geo['type']; cs=geo['coordinates']
            def P(ring): 
                out=[]
                for lon,lat,*_ in ring:
                    x,z=ll2w(lon,lat); out.append(((x-X0)/R,(z-Z0)/R))
                return out
            if t=='Polygon': polys=[cs]
            elif t=='MultiPolygon': polys=cs
            elif t=='LineString': lines=[cs]
            elif t=='MultiLineString': lines=cs
            if t in('Polygon','MultiPolygon'):
                for pg in polys:
                    d.polygon(P(pg[0]),fill=255)
                    for hole in pg[1:]: d.polygon(P(hole),fill=0)
            else:
                for ln in lines:
                    pts=P(ln)
                    if len(pts)>1:
                        wd=width(f['properties']) if width else 2
                        d.line(pts,fill=255,width=max(1,int(wd)),joint='curve')
        return np.asarray(im)>0
    land=poly_layer('data/ne_10m_land.geojson')
    lakes=poly_layer('data/ne_10m_lakes.geojson')
    def rw(p):
        n=(p.get('name') or '')
        return 12 if 'Yangtze' in n or 'Chang' in n else 3
    rivers=poly_layer('data/ne_10m_rivers_lake_centerlines.geojson',filt=lambda p:(p.get('scalerank') or 9)<=8,width=rw)
    demw=np.asarray(Image.fromarray(((e<=2.0)*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)))>0
    from scipy import ndimage
    lab,n=ndimage.label(demw); sizes=ndimage.sum(demw,lab,range(1,n+1))
    bigw=np.isin(lab,1+np.nonzero(sizes>400)[0])
    water=(~land)|lakes|rivers|(bigw&rivers_near(rivers))
    e=ndimage.gaussian_filter(e,0.7)
    m=Image.fromarray((water*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    e2=np.where(water,0,np.maximum(e,0))
    compose(e2,np.asarray(m)/255.0,R,4.0,'bake/big.jpg')
    np.save('bake/big_water.npy',water)
    json.dump(dict(X0=X0,X1=X1,Z0=Z0,Z1=Z1,R=R),open('bake/big.json','w'))
    print(W,H)
def poly_layer_ext(meta,kind):
    X0,Z0,R=meta['X0'],meta['Z0'],meta['R']; W=int((meta['X1']-X0)/R); H=int((meta['Z1']-Z0)/R)
    im=Image.new('L',(W,H),0); d=ImageDraw.Draw(im)
    def P(ring): return [(((ll2w(lon,lat)[0])-X0)/R,((ll2w(lon,lat)[1])-Z0)/R) for lon,lat,*_ in ring]
    for f in json.load(open('data/ne_10m_land.geojson'))['features']:
        g=f['geometry']; ps=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
        for pg in ps: d.polygon(P(pg[0]),fill=255)
    land=np.asarray(im)>0
    im=Image.new('L',(W,H),0); d=ImageDraw.Draw(im)
    for f in json.load(open('data/ne_10m_rivers_lake_centerlines.geojson'))['features']:
        if (f['properties'].get('name') or '')!='Yangtze': continue
        g=f['geometry']; ls=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
        for l in ls: d.line(P(l),fill=255,width=9)
    return (~land)|(np.asarray(im)>0)
import sys
if __name__=='__main__':
    if 'city' in sys.argv: city()
    if 'big' in sys.argv: big()
