def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
P={
 'navy-900':'#0E1530','navy-800':'#16204A','navy-700':'#202F60','navy-500':'#3A4C8C','navy-300':'#8E9BCB','navy-100':'#E3E7F4',
 'crimson-600':'#C52035','crimson-500':'#E0334A','crimson-300':'#F28C9A',
 'ember-500':'#F2692C','ember-600':'#C9501A','ember-300':'#F9A77E',
 'flame-500':'#EF3F2D',
 'leaf-600':'#48783F','leaf-500':'#5E9A52','leaf-300':'#9FCB94',
 'n-0':'#FFFFFF','n-50':'#F7F7F4','n-100':'#EEEEE9','n-200':'#DCDCD5','n-300':'#BDBDB5','n-400':'#9A9A93','n-500':'#76766F','n-600':'#5A5A55','n-700':'#3F3F3C','n-800':'#262624','n-900':'#141413',
 'old-yellow':'#FEFF00','old-blue':'#0074A5',
}
pairs=[('navy-700','n-0'),('navy-700','n-50'),('crimson-600','n-0'),('crimson-600','n-50'),('ember-500','n-0'),('ember-600','n-0'),('ember-500','navy-900'),('leaf-600','n-0'),('n-600','n-0'),('n-500','n-0'),('n-500','n-50'),('n-700','n-50'),
('n-0','navy-900'),('n-300','navy-900'),('navy-300','navy-900'),('crimson-300','navy-900'),('ember-300','navy-900'),('leaf-300','navy-900'),('crimson-500','navy-900'),('ember-500','n-900'),('n-400','n-900'),('n-0','crimson-600'),('n-0','ember-600'),('navy-900','ember-500'),('n-0','leaf-600'),
('old-yellow','n-0'),('n-0','old-blue'),('n-800','old-yellow')]
for a,b in pairs:
    c=cr(P[a],P[b]); print(f"{a:12} on {b:12} {c:5.2f}  {'AAA' if c>=7 else 'AA' if c>=4.5 else 'AA-large' if c>=3 else 'FAIL'}")
