#!/usr/bin/env bash
mkdir -p out
{ node --version; npm --version; } > out/install.txt
npm install --no-audit --no-fund >> out/install.txt 2>&1; echo "exit $?" >> out/install.txt
npx svelte-kit sync > out/sync.txt 2>&1
npx prettier --write . --log-level warn > out/prettier.txt 2>&1; echo "exit $?" >> out/prettier.txt
tar --exclude=node_modules --exclude=.git --exclude=out --exclude=.svelte-kit --exclude=build -czf out/formatted.tgz .
npx svelte-check --tsconfig ./tsconfig.json --output human > out/check.txt 2>&1; echo "exit $?" >> out/check.txt
npx eslint . > out/eslint.txt 2>&1; echo "exit $?" >> out/eslint.txt
npx prettier --check . > out/prettiercheck.txt 2>&1; echo "exit $?" >> out/prettiercheck.txt
npx vitest run > out/test.txt 2>&1; echo "exit $?" >> out/test.txt
BASE_PATH=/unovis npx vite build > out/build.txt 2>&1; echo "exit $?" >> out/build.txt
cp package-lock.json out/package-lock.json 2>/dev/null
exit 0
