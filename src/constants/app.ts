/** Default pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** File upload constraints */
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,
  CLOUDINARY_FOLDER: 'dental-pms',
} as const;

/** Patient / hospital ID configuration */
export const PATIENT_ID = {
  DEFAULT_PREFIX: 'SMDH',
  SEQUENCE_PAD_LENGTH: 6,
} as const;

/** Auto-increment sequence configuration */
export const SEQUENCES = {
  PATIENT_PREFIX: 'SMDH',
  VISIT_PREFIX: 'VIS',
  INVOICE_PREFIX: 'INV',
  RECEIPT_PREFIX: 'RCPT',
  PAD_LENGTH: 6,
} as const;

/** Auth token configuration (for future auth module) */
export const AUTH = {
  ACCESS_TOKEN_COOKIE: 'accessToken',
  REFRESH_TOKEN_COOKIE: 'refreshToken',
  ACCESS_TOKEN_HEADER: 'authorization',
  TOKEN_PREFIX: 'Bearer ',
} as const;

/** API rate limiting defaults */
export const RATE_LIMIT = {
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000,
  API_MAX_REQUESTS: 300,
  API_WINDOW_MS: 60 * 1000,
  EXPORT_MAX_REQUESTS: 10,
  EXPORT_WINDOW_MS: 60 * 60 * 1000,
} as const;

/** Custom HTTP headers for request context propagation */
export const CUSTOM_HEADERS = {
  USER_ID: 'x-user-id',
  USER_ROLE: 'x-user-role',
  USER_EMAIL: 'x-user-email',
  USER_NAME: 'x-user-name',
  USER_PERMISSIONS: 'x-user-permissions',
  REQUEST_ID: 'x-request-id',
} as const;

/** Sidebar layout dimensions */
export const LAYOUT = {
  SIDEBAR_WIDTH: '16rem',
  SIDEBAR_COLLAPSED_WIDTH: '4.5rem',
  HEADER_HEIGHT: '3.5rem',
} as const;

/** Local storage keys */
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'pms:sidebar-collapsed',
  THEME: 'pms:theme',
} as const;
