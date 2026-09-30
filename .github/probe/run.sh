#!/usr/bin/env bash
mkdir -p out
npm ci --no-audit --no-fund > out/install.txt 2>&1; echo "exit $?" >> out/install.txt
npx svelte-kit sync > /dev/null 2>&1
npx svelte-check --tsconfig ./tsconfig.json --output human > out/check.txt 2>&1; echo "exit $?" >> out/check.txt
npx eslint . > out/eslint.txt 2>&1; echo "exit $?" >> out/eslint.txt
npx prettier --check . > out/prettier.txt 2>&1; echo "exit $?" >> out/prettier.txt
npx vitest run > out/test.txt 2>&1; echo "exit $?" >> out/test.txt
npx vite build > out/build.txt 2>&1; echo "exit $?" >> out/build.txt
cp -r src src.fmt && npx prettier --write src > /dev/null 2>&1
tar -czf out/formatted.tgz src
rm -rf src && mv src.fmt src
(cd build && tar --exclude='*.woff' --exclude='*.woff2' --exclude='*.png' -czf ../out/site.tgz .)
python3 - <<'PY'
import base64
n = 0
lines = []
for name in ['site.tgz', 'formatted.tgz']:
    blob = base64.b64encode(open(f'out/{name}', 'rb').read()).decode()
    chunks = [blob[i:i+3500] for i in range(0, len(blob), 3500)]
    lines += [f'::notice title={name}|{i}|{len(chunks)}::{c}' for i, c in enumerate(chunks)]
for s in range(0, len(lines), 10):
    open(f'out/part{s//10}.txt', 'w').write('\n'.join(lines[s:s+10]) + '\n')
PY
exit 0
