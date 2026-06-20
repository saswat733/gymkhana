import { AttendanceProvider, ATTENDANCE_PROVIDER_TYPES } from './AttendanceProvider.js';
import { ApiError } from '../../../utils/ApiError.js';

/** Stub — wire to RFID readers / turnstiles later. */
export class RfidAttendanceProvider extends AttendanceProvider {
  get type() {
    return ATTENDANCE_PROVIDER_TYPES.RFID;
  }

  async validate({ rfidTag }) {
    if (!rfidTag) throw ApiError.badRequest('RFID tag is required');
    throw ApiError.badRequest('RFID attendance provider not yet implemented');
  }
}
