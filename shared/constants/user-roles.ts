export const UserRole = {
  CUSTOMER: 'customer',
  RESTAURANT_OWNER: 'restaurant_owner',
  RESTAURANT_STAFF: 'restaurant_staff',
  DELIVERY_DRIVER: 'delivery_driver',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 0,
  [UserRole.DELIVERY_DRIVER]: 1,
  [UserRole.RESTAURANT_STAFF]: 2,
  [UserRole.RESTAURANT_OWNER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
};

export function hasPermission(role: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}
