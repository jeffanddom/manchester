export const crc32 = (() => {
  let c
  const crcTable: number[] = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    crcTable[n] = c
  }

  return function (data: Uint8Array, crc = 0) {
    crc = crc ^ -1
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
    }
    return (crc ^ -1) >>> 0
  }
})()
