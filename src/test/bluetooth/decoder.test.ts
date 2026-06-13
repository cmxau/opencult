import { describe, it, expect } from 'vitest';
import { decodePacket } from '@/features/bluetooth/decoder';

function buildPacket(phase: number, weightRaw: number, impedance = 0, hr = 0): DataView {
  const bytes = new Array(11).fill(0);
  bytes[0] = 0xcf;
  bytes[1] = hr;
  bytes[2] = 0;
  bytes[3] = weightRaw & 0xff;
  bytes[4] = (weightRaw >> 8) & 0xff;
  bytes[5] = impedance & 0xff;
  bytes[6] = (impedance >> 8) & 0xff;
  bytes[7] = 0;
  bytes[8] = 0;
  bytes[9] = phase;
  bytes[10] = bytes.slice(0, 10).reduce((a: number, b: number) => a ^ b, 0);
  const buf = new ArrayBuffer(11);
  const view = new DataView(buf);
  bytes.forEach((b: number, i: number) => view.setUint8(i, b));
  return view;
}

describe('decodePacket', () => {
  it('returns unknown for empty packet', () => {
    expect(decodePacket(new DataView(new ArrayBuffer(0))).type).toBe('unknown');
  });

  it('returns unknown for packet shorter than 11 bytes', () => {
    const buf = new ArrayBuffer(5);
    expect(decodePacket(new DataView(buf)).type).toBe('unknown');
  });

  it('returns unknown for wrong marker byte', () => {
    const view = buildPacket(0x01, 7500);
    view.setUint8(0, 0x02); // corrupt marker
    expect(decodePacket(view).type).toBe('unknown');
  });

  it('returns unknown for bad checksum', () => {
    const view = buildPacket(0x01, 7500);
    view.setUint8(10, 0xff); // corrupt checksum
    expect(decodePacket(view).type).toBe('unknown');
  });

  it('decodes weighing phase (0x01): correct weight, no impedance', () => {
    const pkt = decodePacket(buildPacket(0x01, 7850));
    expect(pkt.type).toBe('weighing');
    expect(pkt.weightKg).toBeCloseTo(78.5, 1);
    expect(pkt.impedanceOhms).toBeUndefined();
  });

  it('decodes body phase (0x00) with impedance and HR', () => {
    const pkt = decodePacket(buildPacket(0x00, 7850, 450, 72));
    expect(pkt.type).toBe('body');
    expect(pkt.weightKg).toBeCloseTo(78.5, 1);
    expect(pkt.impedanceOhms).toBe(450);
    expect(pkt.heartRateBpm).toBe(72);
  });

  it('body phase with zero impedance leaves impedanceOhms undefined', () => {
    const pkt = decodePacket(buildPacket(0x00, 7000, 0, 65));
    expect(pkt.type).toBe('body');
    expect(pkt.impedanceOhms).toBeUndefined();
    expect(pkt.heartRateBpm).toBe(65);
  });
});
