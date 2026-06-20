/**
 * Attendance provider interface — future-proof for QR, biometric, RFID, turnstile.
 *
 * Implementations:
 * - QrAttendanceProvider (gym QR scan)
 * - ManualAttendanceProvider (staff / quick check-in)
 * - BiometricAttendanceProvider (stub)
 * - RfidAttendanceProvider (stub)
 */
export class AttendanceProvider {
  /** @returns {string} */
  get type() {
    throw new Error('Not implemented');
  }

  /**
   * @param {{ gymId: string, memberId: string, payload?: unknown, zoneId?: string }} ctx
   * @returns {Promise<{ source: string, zoneId?: string }>}
   */
  async validate(_ctx) {
    throw new Error('Not implemented');
  }
}

export const ATTENDANCE_PROVIDER_TYPES = Object.freeze({
  QR: 'qr',
  MANUAL: 'manual',
  BIOMETRIC: 'biometric',
  RFID: 'rfid',
});
