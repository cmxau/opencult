/**
 * Cult Smart Scale BLE packet decoder.
 * Protocol: anshuman852/occult (reverse-engineered CS-BF01).
 *
 *  Offset  Length  Field
 *  0       1       Marker — must be 0xCF
 *  1       1       Heart rate BPM (body phase only)
 *  2       1       Signal quality / counter (undecoded)
 *  3–4     2       Weight LE uint16 ÷ 100 → kg
 *  5–6     2       Impedance LE uint16 ohms (0 during weighing)
 *  7–8     2       Reserved
 *  9       1       Phase: 0x01 = weighing, 0x00 = body/HR locked
 *  10      1       XOR checksum of bytes 0–9
 */

export interface ScalePacket {
  type: 'weighing' | 'body' | 'unknown';
  weightKg?: number;
  impedanceOhms?: number;
  heartRateBpm?: number;
}

export function decodePacket(data: DataView): ScalePacket {
  if (data.byteLength < 11) return { type: 'unknown' };

  if (data.getUint8(0) !== 0xcf) return { type: 'unknown' };

  // XOR checksum validation
  let xor = 0;
  for (let i = 0; i < 10; i++) xor ^= data.getUint8(i);
  if (xor !== data.getUint8(10)) return { type: 'unknown' };

  const weightRaw = data.getUint8(3) | (data.getUint8(4) << 8);
  const weightKg  = Math.round(weightRaw) / 100;
  const phase     = data.getUint8(9);

  if (phase === 0x01) {
    return { type: 'weighing', weightKg };
  }

  const impedanceRaw = data.getUint8(5) | (data.getUint8(6) << 8);
  const hr           = data.getUint8(1);

  return {
    type:          'body',
    weightKg,
    impedanceOhms: impedanceRaw > 0 ? impedanceRaw : undefined,
    heartRateBpm:  hr > 0 ? hr : undefined,
  };
}
