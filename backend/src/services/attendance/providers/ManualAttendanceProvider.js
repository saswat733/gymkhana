import { AttendanceProvider, ATTENDANCE_PROVIDER_TYPES } from './AttendanceProvider.js';

export class ManualAttendanceProvider extends AttendanceProvider {
  get type() {
    return ATTENDANCE_PROVIDER_TYPES.MANUAL;
  }

  async validate() {
    return { source: ATTENDANCE_PROVIDER_TYPES.MANUAL };
  }
}
