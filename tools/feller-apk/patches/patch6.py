s=open('/tmp/new/app.js',encoding='utf8').read()
panel=open('/tmp/new/panel.js',encoding='utf8').read().strip().replace('\n','')
a=s.index('function HC({config:e,plays:t,onSaveConfig:n,onSavePlays:r,onResetConfig:i,onClose:s}){')
b=s.index('function hc({label:e,accept:t,onFile:n,primary:r}){')
s=s[:a]+panel+s[b:]
open('/tmp/new/app.js','w',encoding='utf8').write(s); print('ok')
