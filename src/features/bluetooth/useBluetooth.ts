import { useState, useCallback, useRef } from 'react';
import { decodePacket } from './decoder';
import { db } from '@/shared/db';

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  interface Bluetooth {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
  }
  interface BluetoothRequestDeviceOptions {
    acceptAllDevices?: boolean;
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: string[];
  }
  interface BluetoothRequestDeviceFilter {
    name?: string;
    namePrefix?: string;
    services?: string[];
  }
  interface BluetoothDevice {
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }
  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
    disconnect(): void;
  }
  interface BluetoothRemoteGATTService {
    getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  }
}

// Confirmed via anshuman852/occult reverse-engineering
const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const NOTIFY_CHAR  = '0000fff4-0000-1000-8000-00805f9b34fb';

export type BLEState = 'idle' | 'scanning' | 'connecting' | 'measuring' | 'complete' | 'error';

export interface ScaleData {
  weightKg:      number | null;
  impedanceOhms: number | null;
  heartRateBpm:  number | null;
}

export interface BLEMeasurementState {
  state:      BLEState;
  error:      string | null;
  liveWeight: number | null;
  scaleData:  ScaleData;
  deviceName: string | null;
}

const INITIAL: BLEMeasurementState = {
  state:      'idle',
  error:      null,
  liveWeight: null,
  scaleData:  { weightKg: null, impedanceOhms: null, heartRateBpm: null },
  deviceName: null,
};

export function useBluetooth() {
  const [bleState, setBLEState] = useState<BLEMeasurementState>(INITIAL);
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef   = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const connect = useCallback(async (savedName?: string) => {
    if (!navigator.bluetooth) {
      setBLEState(s => ({ ...s, state: 'error', error: 'Web Bluetooth not available. Use Bluefy.' }));
      return;
    }

    setBLEState({ ...INITIAL, state: 'scanning' });

    try {
      // Use acceptAllDevices so the scale shows up regardless of what it
      // advertises. The scale's service UUID is listed as optional so we can
      // access it after connecting.
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      });
      deviceRef.current = device;
      setBLEState(s => ({ ...s, state: 'connecting', deviceName: device.name ?? null }));

      const server  = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const char    = await service.getCharacteristic(NOTIFY_CHAR);
      charRef.current = char;

      await char.startNotifications();
      setBLEState(s => ({ ...s, state: 'measuring' }));

      char.addEventListener('characteristicvaluechanged', (event: Event) => {
        const value  = (event.target as BluetoothRemoteGATTCharacteristic).value!;
        const packet = decodePacket(value);

        if (packet.type === 'weighing' && packet.weightKg !== undefined) {
          setBLEState(s => ({
            ...s,
            liveWeight: packet.weightKg!,
            scaleData:  { ...s.scaleData, weightKg: packet.weightKg! },
          }));
        }

        if (packet.type === 'body') {
          // Body packet arrives after impedance measurement (~5s after stepping on)
          setBLEState(s => ({
            ...s,
            state: 'complete',
            liveWeight: packet.weightKg ?? s.liveWeight,
            scaleData: {
              weightKg:      packet.weightKg ?? s.scaleData.weightKg,
              impedanceOhms: packet.impedanceOhms ?? null,
              heartRateBpm:  packet.heartRateBpm ?? null,
            },
          }));

          // Persist device
          const mac = device.name ?? '';
          db.devices.where('macAddress').equals(mac).count().then(n => {
            if (n === 0) {
              db.devices.add({
                macAddress:      mac,
                name:            device.name ?? 'Cult Scale',
                lastConnectedAt: new Date().toISOString(),
                batteryPct:      null,
              });
            } else {
              db.devices.where('macAddress').equals(mac).modify({ lastConnectedAt: new Date().toISOString() });
            }
          });
        }
      });
    } catch (err) {
      setBLEState(s => ({
        ...s,
        state: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    charRef.current?.stopNotifications().catch(() => {});
    deviceRef.current?.gatt?.disconnect();
    setBLEState(INITIAL);
  }, []);

  return { bleState, connect, disconnect };
}
