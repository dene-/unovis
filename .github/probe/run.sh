#!/usr/bin/env bash
mkdir -p out
npm ci --no-audit --no-fund > /dev/null 2>&1 || npm install --no-audit --no-fund > /dev/null 2>&1
npx prettier --write . --log-level warn > /dev/null 2>&1
tar --exclude=node_modules --exclude=.git --exclude=out --exclude=.svelte-kit --exclude=build --exclude=static --exclude=package-lock.json --exclude=.github -czf out/formatted.tgz .
python3 - <<'PY'
import base64
blob = base64.b64encode(open('out/formatted.tgz','rb').read()).decode()
chunks = [blob[i:i+3500] for i in range(0, len(blob), 3500)]
for s in range(0, len(chunks), 10):
    with open(f'out/part{s//10}.txt','w') as f:
        for n in range(s, min(s+10, len(chunks))):
            f.write(f'::notice title=formatted.tgz|{n}|{len(chunks)}::{chunks[n]}\n')
print(len(chunks))
PY
exit 0
