import { ApiError } from './ApiError.js';

const clampInt = (value, { min, max, fallback }) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * Parse pagination from req.query and return Sequelize-compatible values.
 *
 * Convention:
 * - page: 1-based
 * - pageSize: number of records per page
 * - sort: "createdAt:desc" or "name:asc" (single field for now)
 */
export const getPagination = (query, { maxPageSize = 100, defaultPageSize = 20 } = {}) => {
  const page = clampInt(query?.page, { min: 1, max: 1_000_000, fallback: 1 });
  const pageSize = clampInt(query?.pageSize, { min: 1, max: maxPageSize, fallback: defaultPageSize });
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return { page, pageSize, offset, limit };
};

export const getSort = (query, { allowed = [], defaultSort = ['createdAt', 'desc'] } = {}) => {
  const sortRaw = String(query?.sort ?? '').trim();
  if (!sortRaw) return [defaultSort];

  const [field, directionRaw] = sortRaw.split(':');
  const direction = (directionRaw || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  if (!field) return [defaultSort];
  if (allowed.length && !allowed.includes(field)) {
    throw ApiError.badRequest(`Invalid sort field: ${field}`, { details: [{ field: 'sort', message: 'Not allowed' }] });
  }
  return [[field, direction]];
};

export const buildMeta = ({ page, pageSize, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { page, pageSize, total, totalPages };
};

