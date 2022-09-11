import hid
import struct
import numpy as np
from time import sleep
import matplotlib.pyplot as plt

hidinfo = next(x for x in hid.enumerate() if x['vendor_id'] == 0x16c0 and x['product_id'] == 0x486)

h = hid.device()
h.open(hidinfo['vendor_id'], hidinfo['product_id'])
h.set_nonblocking(1)
while h.read(64):
    pass

h.set_nonblocking(0)

h.write(b'\x01')
sleep(5)
h.write(b'\x02')
sleep(5)
h.write(b'\x00\x00')
dat = h.read(64)
num_vals = struct.unpack('I', bytearray(dat[:4]))[0]
print(num_vals)
bad_count = 0

dats = []
#h.set_nonblocking(1)
while True:
    num_vals -= 8
    #print(num_vals)
    n_read = 8
    if num_vals < 8:
        # if we're down to < 8 samples, don't bother trying to grab those
        print(f'down to {num_vals}')
        break
    x = h.write(b'\x03')
    dat = h.read(64)    
    if len(dat) <= 0:
        bad_count+=1
        print(f'no data, broke at {num_vals}')
        if bad_count > 5:
            break
    else:
        data = struct.unpack('IHH'*n_read, bytearray(dat[:8*n_read]))
        dats.append(np.reshape(data, (n_read, 3)))

h.close()

dat2 = np.concatenate(dats, axis=0)

dts = np.diff(dat2[:, 0])
print(f'min: {np.min(dts)}, max: {np.max(dts)}')
plt.plot(dat2[:,0], dat2[:, 2])
plt.show()
