import base64, gzip, os, sys
for name in sys.argv[1:]:
    path = os.path.join('out', name)
    data = open(path, 'rb').read() if os.path.exists(path) else b'(missing)'
    if not name.endswith('.tgz'):
        data = gzip.compress(data)
    blob = base64.b64encode(data).decode()
    chunks = [blob[i:i + 3500] for i in range(0, len(blob), 3500)] or ['']
    for n, chunk in enumerate(chunks):
        print(f'::notice title={name}|{n}|{len(chunks)}::{chunk}')
