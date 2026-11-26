import json
IN='/mnt/project-files/nanjing-map/inbox/'
w=json.load(open(IN+'wall.json'))
ring=[[round(x),round(z)] for x,z,_ in w['ring'][::6]]
gates=[dict(id=g['id'],name=g['name_en'],x=round(g['x']),z=round(g['z']),kind=g['kind']) for g in w['gates']]
P=json.load(open(IN+'places.json'))['places']
places={p['id']:dict(name=p.get('name_en'),x=p.get('x'),z=p.get('z'),kind=p.get('kind')) for p in P}
zone=[p for p in P if p['id']=='zone'][0]['area']
fires=[dict(id=f['id'],kind=f['kind'],ignite=f['ignite'],out=f.get('out'),i=f.get('intensity',1),coords=f['geom']['coords'],ev=f.get('evidence')) for f in json.load(open(IN+'timeline.json'))['fires'] if f['geom']['type']=='area']
json.dump(dict(ring=ring,gates=gates,places=places,zone=zone,fires=fires,breaches=w['breaches']),open('web/assets/world.json','w'))
print(len(ring),len(gates),len(places),len(fires))
