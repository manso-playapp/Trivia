import zipfile,struct,sys
import sys
src=sys.argv[1]; dst=sys.argv[2]; bundle=sys.argv[3]  # APK base, salida sin firmar, carpeta con los assets nuevos
repl={'assets/public/assets/index-CQe1EuY2.js':bundle+'/index-CQe1EuY2.js',
      'assets/public/assets/index-B_pW4tvJ.css':bundle+'/index-B_pW4tvJ.css'}
zin=zipfile.ZipFile(src); zout=zipfile.ZipFile(dst,'w')
def skip(n): return n=='META-INF/MANIFEST.MF' or (n.startswith('META-INF/') and n.rsplit('.',1)[-1] in('SF','RSA','DSA','EC'))
done=set()
for i in zin.infolist():
    n=i.filename
    if skip(n): continue
    data=open(repl[n],'rb').read() if n in repl else zin.read(n)
    if n in repl: done.add(n)
    zi=zipfile.ZipInfo(n,date_time=(2026,10,31,0,0,0)); zi.external_attr=i.external_attr; zi.create_system=3
    if i.compress_type==0 or n=='resources.arsc':
        zi.compress_type=0
        off=zout.fp.tell(); base=off+30+len(n.encode()); pad=(-base)%4
        if pad: 
            tot=pad if pad>=4 else pad+4
            zi.extra=struct.pack('<HH',0xd935,tot-4)+b'\0'*(tot-4)
    else: zi.compress_type=8
    zout.writestr(zi,data)
zout.close(); assert done==set(repl),done
# comprobar alineación
z=zipfile.ZipFile(dst)
bad=[x.filename for x in z.infolist() if x.compress_type==0 and (x.header_offset+30+len(x.filename.encode())+len(x.extra))%4]
print('entradas',len(z.infolist()),'mal alineadas',bad)
