#!/usr/bin/env bash
mkdir -p out
{ node --version; npm --version; } > out/install.txt
npm install --no-audit --no-fund >> out/install.txt 2>&1; echo "exit $?" >> out/install.txt
tail -120 $(ls -t ~/.npm/_logs/*debug*.log | head -1) > out/npmlog.txt 2>&1
npx svelte-kit sync > out/sync.txt 2>&1; echo "exit $?" >> out/sync.txt
cp -r src src.orig
npx prettier --write . > out/prettier.txt 2>&1; echo "exit $?" >> out/prettier.txt
git add -A -N . 2>/dev/null; git diff > out/format.diff
npx svelte-check --tsconfig ./tsconfig.json --output human > out/check.txt 2>&1; echo "exit $?" >> out/check.txt
npx eslint . > out/eslint.txt 2>&1; echo "exit $?" >> out/eslint.txt
npx vitest run > out/test.txt 2>&1; echo "exit $?" >> out/test.txt
BASE_PATH=/unovis npx vite build > out/build.txt 2>&1; echo "exit $?" >> out/build.txt
cp package-lock.json out/package-lock.json 2>/dev/null || true
ls -la build > out/buildls.txt 2>&1
exit 0
