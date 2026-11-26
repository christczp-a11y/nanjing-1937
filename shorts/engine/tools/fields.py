# Bakes "time of Japanese control" fields. Value = minutes since 1937-11-01 00:00 local / 2, packed R*256+G; 65535 = never.
import json, math, numpy as np, datetime as dt
from PIL import Image, ImageDraw
import skfmm
from scipy import ndimage
import sys; sys.path.insert(0,'tools')
from bake import ll2w
IN='/mnt/project-files/nanjing-map/inbox/'
EPOCH=dt.datetime(1937,11,1)
def T(s):  # 'MM-DD HH:MM'
    m,rest=s.split('-'); d,hm=rest.split(' '); h,mi=hm.split(':')
    return (dt.datetime(1937,int(m),int(d),int(h),int(mi))-EPOCH).total_seconds()/60
def save(field,name,water=None):
    v=np.clip(np.round(np.nan_to_num(field,posinf=131070)/2),0,65535).astype(np.uint32)
    rgb=np.zeros(v.shape+(3,),np.uint8); rgb[...,0]=v>>8; rgb[...,1]=v&255
    if water is not None: rgb[...,2]=np.where(water,255,0)
    Image.fromarray(rgb).save(name)

# ---------- BIG (East China). Dates: city falls. Labels in seeds file.
BIG=json.load(open('bake/big.json'))
SEEDS_BIG=[ # name, lon, lat, date, label
 ('Shanghai',121.47,31.23,'11-12 00:00','S digest'),
 ('Shanghai north (Zhabei/Baoshan front, held since Aug-Oct)',121.45,31.33,'10-27 00:00','推测 (Zhabei fell 26-27 Oct)'),
 ('Jinshanwei landing',121.35,30.72,'11-05 12:00','推测 (well-known date, not in digest)'),
 ('Kunshan',120.98,31.38,'11-15 00:00','推测'),
 ('Jiaxing',120.75,30.75,'11-19 00:00','推测'),
 ('Suzhou',120.62,31.30,'11-19 12:00','推测'),
 ('Changshu',120.75,31.65,'11-19 12:00','推测'),
 ('Huzhou',120.09,30.87,'11-24 12:00','推测'),
 ('Wuxi',120.30,31.57,'11-26 00:00','推测'),
 ('Changzhou',119.95,31.78,'11-29 12:00','推测'),
 ('Guangde',119.42,30.89,'11-30 12:00','推测'),
 ('Jiangyin',120.27,31.91,'12-01 12:00','推测 (digest: Chinese pull back from Jiangyin 1 Dec)'),
 ('Danyang',119.58,32.00,'12-02 12:00','S digest'),
 ('Liyang',119.48,31.42,'12-01 00:00','推测'),
 ('Jurong',119.17,31.95,'12-04 12:00','S digest (3-5 Dec)'),
 ('Lishui',119.02,31.65,'12-05 12:00','推测'),
 ('Chunhua',118.93,31.93,'12-08 00:00','S digest'),
 ('Tangshan',119.05,32.06,'12-08 00:00','S digest'),
 ('Zhenjiang',119.45,32.20,'12-08 12:00','推测'),
 ('Xuancheng',118.75,30.95,'12-08 00:00','推测'),
 ('Wuhu',118.38,31.33,'12-10 00:00','推测'),
 ('Nanjing',118.78,32.05,'12-13 08:00','S digest'),
]
def big():
    X0,Z0,R=BIG['X0'],BIG['Z0'],BIG['R']
    water=np.load('bake/big_water.npy'); H,W=water.shape
    xs=X0+(np.arange(W)+.5)*R; zs=Z0+(np.arange(H)+.5)*R; XX,ZZ=np.meshgrid(xs,zs)
    # north-bank: label land with water=ocean|yangtze only -> component containing Shanghai+Nanjing
    from bake import poly_layer_ext
    split=poly_layer_ext(BIG,'yangtze')
    lab,n=ndimage.label(~split)
    def at(lon,lat):
        x,z=ll2w(lon,lat); return lab[int((z-Z0)/R),int((x-X0)/R)]
    south=np.isin(lab,[at(118.78,31.95),at(121.3,31.1),at(120.6,31.3)])
    v=4500/1440  # m per minute (6 km/day), 推测 shape
    f=np.full((H,W),np.inf); dmin=np.full((H,W),np.inf)
    for name,lon,lat,d,_ in SEEDS_BIG:
        x,z=ll2w(lon,lat); dist=np.hypot(XX-x,ZZ-z)
        f=np.minimum(f,T(d)+dist/v); dmin=np.minimum(dmin,dist)
    f=np.minimum(f,T('12-31 00:00'))
    f=ndimage.gaussian_filter(f,40)  # smooth seed circles into fronts (≈10 km)
    f[(dmin>90000)|~south]=np.inf
    # downsample x2 for the browser
    H2,W2=H//2,W//2
    f2=f[:H2*2,:W2*2].reshape(H2,2,W2,2).max((1,3)); w2=water[:H2*2,:W2*2].reshape(H2,2,W2,2).mean((1,3))>0.5
    save(f2,'bake/field_big.png',w2)
    json.dump(dict(X0=X0,Z0=Z0,R=R*2),open('bake/field_big.json','w')); print('big ok')

# ---------- CITY
CITY=json.load(open('bake/city.json'))
SEEDS_CITY=[ # name, x, z, time, speed km/h, inside_wall, label
 ('SE approach (Chunhua road)',11500,21500,'12-07 00:00',0.28,False,'S digest: Chunhua broken 8 Dec (frame edge, timing 推测)'),
 ('E approach (Tangshan road)',11800,-500,'12-08 00:00',0.12,False,'S digest: Tangshan 8 Dec'),
 ('S approach (Niushoushan)',-1500,21500,'12-08 00:00',0.27,False,'S digest: Jiangjunshan/Niushoushan given up night 9 Dec'),
 ('NE approach (Qixia)',11800,-12000,'12-10 12:00',0.10,False,'推测'),
 ('Guanghua Gate outside',3050,3100,'12-10 17:00',0.05,False,'S digest: breach 10 Dec'),
 ('Purple Mountain',6328,-2218,'12-12 18:00',0.10,False,'S digest: second peak 12 Dec'),
 ('Yuhuatai',-434,5655,'12-12 12:00',0.15,False,'S digest: overrun noon 12 Dec'),
 ('Zhonghua Gate outside',-320,4100,'12-12 17:00',0.20,False,'S digest'),
 ('Zhongshan Gate outside',4450,1000,'12-12 15:00',0.10,False,'S digest'),
 ('Shangxinhe',-5525,2473,'12-13 08:00',0.30,False,'推测 (MPs held 11-12 Dec)'),
 ('Xiaguan',-4000,-4700,'12-13 14:00',0.40,False,'推测 (16th Div reached Xiaguan 13 Dec)'),
 ('Mufushan',1209,-8538,'12-14 08:00',0.40,False,'S digest'),
 ('Zhongshan Gate inside',3850,985,'12-13 03:00',0.45,True,'S digest (~03:10, JP time?)'),
 ('Guanghua Gate inside',2800,2850,'12-13 04:00',0.45,True,'S digest'),
 ('Zhonghua Gate inside',-293,3872,'12-13 06:00',0.45,True,'S digest'),
 ('Taiping Gate inside',2550,-1100,'12-13 08:00',0.45,True,'S digest (16th Div entered 13 Dec)'),
 ('Shuixi Gate inside',-1367,2090,'12-13 10:00',0.45,True,'推测'),
 ('Pukou (north bank)',-6650,-5500,'12-14 10:00',0.5,False,'推测'),
]
def city():
    X0,Z0,R0=CITY['X0'],CITY['Z0'],CITY['R']; R=24.0
    water=np.load('bake/city_water.npy'); s=int(R/R0)
    H,W=water.shape[0]//s,water.shape[1]//s
    wsm=water[:H*s,:W*s].reshape(H,s,W,s).mean((1,3))>0.5
    elev=np.load('bake/city_elev.npy')[:H*s,:W*s].reshape(H,s,W,s).mean((1,3))
    wsm=ndimage.binary_opening(wsm,iterations=1)  # keep wide water as barrier; thin canals passable
    wall=json.load(open(IN+'wall.json'))['ring']
    P=[((x-X0)/R,(z-Z0)/R) for x,z,_ in wall]
    im=Image.new('L',(W,H),0); d=ImageDraw.Draw(im); d.polygon(P,fill=1); inside=np.asarray(im).astype(bool)
    im2=Image.new('L',(W,H),0); d2=ImageDraw.Draw(im2); d2.line(P+[P[0]],fill=1,width=3); wl=np.asarray(im2).astype(bool)
    f=np.full((H,W),np.inf)
    for name,x,z,t,kmh,ins,_ in SEEDS_CITY:
        i,j=int((z-Z0)/R),int((x-X0)/R)
        i=min(max(i,1),H-2); j=min(max(j,1),W-2)
        region=(inside&~wl) if ins else (~inside&~wl)
        barrier=wsm|~region
        spd=np.full((H,W),kmh*1000/60)/(1+np.maximum(elev-25,0)/30)  # hills slow the advance (Purple Mountain, Yuhuatai)
        phi=np.ones((H,W)); phi[i-1:i+2,j-1:j+2]=-1
        if barrier[i,j]: print('seed on barrier',name); 
        phi=np.ma.MaskedArray(phi,barrier)
        try: tt=skfmm.travel_time(phi,spd,dx=R)
        except Exception as e: print(name,e); continue
        tt=np.ma.filled(tt,np.inf)
        f=np.minimum(f,T(t)+tt)
    # far from the city, follow the big map so the two layers agree at the edges
    bm=json.load(open('bake/field_big.json')); bi=np.asarray(Image.open('bake/field_big.png')).astype(np.int64)
    bv=(bi[...,0]*256+bi[...,1])*2.0; bv[bv>=131070]=np.inf
    xs=X0+(np.arange(W)+.5)*R; zs=Z0+(np.arange(H)+.5)*R; XX,ZZ=np.meshgrid(xs,zs)
    bj=np.clip(((XX-bm['X0'])/bm['R']).astype(int),0,bv.shape[1]-1); bi_=np.clip(((ZZ-bm['Z0'])/bm['R']).astype(int),0,bv.shape[0]-1)
    fb=ndimage.uniform_filter(np.nan_to_num(bv[bi_,bj],posinf=T('12-31 00:00')),9)
    dist=np.hypot(XX-500,ZZ-800); wgt=np.clip((dist-7000)/5000,0,1)
    fc=np.minimum(f,T('12-31 00:00')); f=np.where(wgt>0, fc*(1-wgt)+np.minimum(fc,fb)*wgt, f)
    f[wl]=np.minimum(f[wl],T('12-13 06:00'))  # wall itself: taken by morning of 13 Dec (fill gaps)
    wfine=water[:H*s,:W*s].reshape(H,s,W,s).mean((1,3))>0.5
    save(f,'bake/field_city.png',wfine)
    json.dump(dict(X0=X0,Z0=Z0,R=R,W=W,H=H),open('bake/field_city.json','w'))
    print('city ok')
def big_from_city():
    # make the big field agree with the finer city field inside the city frame
    bm=json.load(open('bake/field_big.json')); bi=np.asarray(Image.open('bake/field_big.png')).astype(np.int64)
    bv=(bi[...,0]*256+bi[...,1])*2.0; bw=bi[...,2]>127; bv[bv>=131070]=np.inf
    cm=json.load(open('bake/field_city.json')); ci=np.asarray(Image.open('bake/field_city.png')).astype(np.int64)
    cv=(ci[...,0]*256+ci[...,1])*2.0; cv[cv>=131070]=np.inf
    H,W=bv.shape; xs=bm['X0']+(np.arange(W)+.5)*bm['R']; zs=bm['Z0']+(np.arange(H)+.5)*bm['R']; XX,ZZ=np.meshgrid(xs,zs)
    cj=((XX-cm['X0'])/cm['R']).astype(int); ck=((ZZ-cm['Z0'])/cm['R']).astype(int)
    inside=(cj>=0)&(cj<cm['W'])&(ck>=0)&(ck<cm['H'])
    vals=np.full(bv.shape,np.inf); vals[inside]=cv[ck[inside],cj[inside]]
    land=inside&np.isfinite(vals)
    bv[land]=vals[land]
    # outside the city frame: ease from the city's edge values to the big field over 15 km, so no rectangular seam
    fin=np.isfinite(cv); idx=ndimage.distance_transform_edt(~fin,return_distances=False,return_indices=True)
    cfill=cv[idx[0],idx[1]]
    cjc=np.clip(cj,0,cm['W']-1); ckc=np.clip(ck,0,cm['H']-1); edge=cfill[ckc,cjc]
    cx0,cz0=cm['X0'],cm['Z0']; cx1,cz1=cx0+cm['W']*cm['R'],cz0+cm['H']*cm['R']
    dx=np.maximum(np.maximum(cx0-XX,XX-cx1),0); dz=np.maximum(np.maximum(cz0-ZZ,ZZ-cz1),0); dout=np.hypot(dx,dz)
    w=np.clip(1-dout/15000,0,1); w=w*w*(3-2*w); out=(~inside)&(w>0)&~bw
    bfin=np.isfinite(bv)
    m1=out&bfin; bv[m1]=bv[m1]*(1-w[m1])+edge[m1]*w[m1]
    m2=out&~bfin; bv[m2]=edge[m2]+(1-w[m2])*30*1440  # 'never' areas (north bank): the city's front spreads slowly
    save(bv,'bake/field_big.png',bw); print('big<-city ok')
if __name__=='__main__':
    if 'big' in sys.argv: big()
    if 'city' in sys.argv: city()
    if 'merge' in sys.argv: big_from_city()
    json.dump(dict(big=SEEDS_BIG,city=SEEDS_CITY),open('bake/field_seeds.json','w'),ensure_ascii=False,indent=1)
