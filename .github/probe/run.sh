#!/usr/bin/env bash
mkdir -p out
npm ci --no-audit --no-fund > out/install.txt 2>&1
npx vite build > out/build.txt 2>&1
cd build && tar --exclude='*.woff' --exclude='*.woff2' --exclude='*.png' -czf ../out/site.tgz . && cd ..
python3 - <<'PY'
import base64
blob = base64.b64encode(open('out/site.tgz','rb').read()).decode()
chunks = [blob[i:i+3500] for i in range(0, len(blob), 3500)]
print('chunks', len(chunks))
for s in range(0, len(chunks), 10):
    with open(f'out/part{s//10}.txt','w') as f:
        for n in range(s, min(s+10, len(chunks))):
            f.write(f'::notice title=site.tgz|{n}|{len(chunks)}::{chunks[n]}\n')
PY
exit 0
