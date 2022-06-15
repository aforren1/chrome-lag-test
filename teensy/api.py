import serial
from serial.tools import list_ports

# get a teensy serial device
port = next(x.device for x in list_ports.comports() if x.vid == 0x16c0 and x.pid == 0x483)

dev = serial.Serial(port, 256000, timeout = 0.01)

# 