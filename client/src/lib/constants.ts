export const SITES = {
  BLUE_AREA: 'blue_area',
  I_10: 'i_10',
} as const;

export const USER_ROLES = {
  MEMBER_INDIVIDUAL: 'member_individual',
  MEMBER_ORGANIZATION_ADMIN: 'member_organization_admin',
  CAFE_MANAGER: 'cafe_manager',
  CALMKAAJ_ADMIN: 'calmkaaj_admin',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_STATUSES = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const BILLING_TYPES = {
  PERSONAL: 'personal',
  ORGANIZATION: 'organization',
} as const;

export const WEBSOCKET_MESSAGE_TYPES = {
  AUTHENTICATE: 'authenticate',
  ORDER_STATUS_UPDATE: 'order_status_update',
  BOOKING_REMINDER: 'booking_reminder',
  ANNOUNCEMENT: 'announcement',
} as const;

export const ROUTES = {
  HOME: '/',
  CAFE: '/cafe',
  ROOMS: '/rooms',
  ORGANIZATION: '/organization',
  ADMIN: '/admin',
  PROFILE: '/profile',
} as const;

export const AMENITY_ICONS = {
  'TV': 'tv',
  'Display': 'tv',
  'Projector': 'tv',
  'WiFi': 'wifi',
  'Whiteboard': 'calendar',
  'Sound System': 'tv',
  'AC': 'wind',
  'Video Conference': 'video',
} as const;

export const COLORS = {
  PRIMARY: 'hsl(207, 90%, 54%)',
  SECONDARY: 'hsl(0, 0%, 100%)',
  ACCENT: 'hsl(161, 56%, 51%)',
  WARNING: 'hsl(43, 96%, 56%)',
  ERROR: 'hsl(0, 84%, 60%)',
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;
