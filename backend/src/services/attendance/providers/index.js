import { ATTENDANCE_PROVIDER_TYPES, AttendanceProvider } from './AttendanceProvider.js';
import { QrAttendanceProvider } from './QrAttendanceProvider.js';
import { ManualAttendanceProvider } from './ManualAttendanceProvider.js';
import { BiometricAttendanceProvider } from './BiometricAttendanceProvider.js';
import { RfidAttendanceProvider } from './RfidAttendanceProvider.js';

const providers = {
  [ATTENDANCE_PROVIDER_TYPES.QR]: new QrAttendanceProvider(),
  [ATTENDANCE_PROVIDER_TYPES.MANUAL]: new ManualAttendanceProvider(),
  [ATTENDANCE_PROVIDER_TYPES.BIOMETRIC]: new BiometricAttendanceProvider(),
  [ATTENDANCE_PROVIDER_TYPES.RFID]: new RfidAttendanceProvider(),
};

export const getAttendanceProvider = (type) => {
  const p = providers[type];
  if (!p) throw new Error(`Unknown attendance provider: ${type}`);
  return p;
};

export { ATTENDANCE_PROVIDER_TYPES, AttendanceProvider };
