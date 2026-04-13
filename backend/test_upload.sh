#!/usr/bin/env bash
cd /home/lightnguyen/smart-booking-3d
python3 - <<'PY'
from pathlib import Path
Path('/tmp/test-png.png').write_bytes(bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c630000000200010005fe02fea7d5f90000000049454e44ae426082'))
PY
TOKEN=$(python3 - <<'PY'
import json, urllib.request
url = 'http://localhost:3000/api/auth/login'
data = json.dumps({'email':'admin@smartbooking.vn','password':'admin123'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
res = urllib.request.urlopen(req).read().decode('utf-8')
print(json.loads(res).get('data', {}).get('token', ''))
PY
)
echo "TOKEN:$TOKEN"
curl -i -X POST -H "Authorization: Bearer $TOKEN" -F "images=@/tmp/test-png.png" http://localhost:3000/api/images/rooms/d5d1ed1f-58e9-4ff3-adca-cea85ae567ca | head -n 50
