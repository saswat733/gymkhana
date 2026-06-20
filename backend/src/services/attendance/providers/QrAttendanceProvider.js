import { AttendanceProvider, ATTENDANCE_PROVIDER_TYPES } from './AttendanceProvider.js';
import { AttendanceZone, Gym } from '../../../models/index.js';
import { ApiError } from '../../../utils/ApiError.js';
import { resolveGymQrSecret, verifyGymQr } from '../../../utils/gymQr.js';

export class QrAttendanceProvider extends AttendanceProvider {
  get type() {
    return ATTENDANCE_PROVIDER_TYPES.QR;
  }

  async validate({ gymId, qrPayload }) {
    if (!qrPayload) throw ApiError.badRequest('Gym QR code is required');

    const gym = await Gym.findByPk(gymId);
    if (!gym || !gym.isActive) throw ApiError.notFound('Gym not found');

    const secret = resolveGymQrSecret(gym);
    const verified = verifyGymQr({ payload: qrPayload, secret });
    if (!verified) throw ApiError.badRequest('Invalid or tampered gym QR code');

    if (String(verified.gymId) !== String(gymId)) {
      throw ApiError.forbidden('This QR belongs to another gym');
    }

    const zone = await AttendanceZone.findOne({
      where: { id: verified.zoneId, gymId, isActive: true },
    });
    if (!zone) throw ApiError.badRequest('Attendance zone not found or inactive');

    return { source: ATTENDANCE_PROVIDER_TYPES.QR, zoneId: zone.id, zoneName: zone.name };
  }
}
