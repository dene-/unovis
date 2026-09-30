import base64, gzip, os, sys
names = sys.argv[1:]
for name in names:
    path = os.path.join('out', name)
    data = open(path, 'rb').read() if os.path.exists(path) else b'(missing)'
    blob = base64.b64encode(gzip.compress(data)).decode()
    chunks = [blob[i:i + 3500] for i in range(0, len(blob), 3500)] or ['']
    for n, chunk in enumerate(chunks):
        print(f'::notice title={name}|{n}|{len(chunks)}::{chunk}')
