import { AttendanceProvider, ATTENDANCE_PROVIDER_TYPES } from './AttendanceProvider.js';
import { ApiError } from '../../../utils/ApiError.js';

/** Stub — wire to fingerprint/face hardware later. */
export class BiometricAttendanceProvider extends AttendanceProvider {
  get type() {
    return ATTENDANCE_PROVIDER_TYPES.BIOMETRIC;
  }

  async validate({ deviceId, biometricToken }) {
    if (!deviceId || !biometricToken) {
      throw ApiError.badRequest('Biometric device integration not configured');
    }
    throw ApiError.badRequest('Biometric attendance provider not yet implemented');
  }
}
