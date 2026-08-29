export type UserRole = 'admin' | 'editor' | 'viewer';

export interface RolePermissions {
  canManageUsers: boolean;
  canViewLogs: boolean;
  canEditBusinesses: boolean;
  canEditCategories: boolean;
  canEditMenuItems: boolean;
  canEditPromotions: boolean;
  canEditEmergencyContacts: boolean;
  canBulkImport: boolean;
  isReadOnly: boolean;
}

export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'viewer';
  const clean = role.toLowerCase().trim();
  if (clean === 'admin' || clean === 'super_admin' || clean === 'administrador') {
    return 'admin';
  }
  if (
    clean === 'editor' ||
    clean === 'business_owner' ||
    clean === 'gestor' ||
    clean === 'dueño' ||
    clean === 'dueño de negocio'
  ) {
    return 'editor';
  }
  return 'viewer';
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canViewLogs: true,
        canEditBusinesses: true,
        canEditCategories: true,
        canEditMenuItems: true,
        canEditPromotions: true,
        canEditEmergencyContacts: true,
        canBulkImport: true,
        isReadOnly: false,
      };
    case 'editor':
      return {
        canManageUsers: false,
        canViewLogs: false,
        canEditBusinesses: true,
        canEditCategories: true,
        canEditMenuItems: true,
        canEditPromotions: true,
        canEditEmergencyContacts: true,
        canBulkImport: true,
        isReadOnly: false,
      };
    case 'viewer':
    default:
      return {
        canManageUsers: false,
        canViewLogs: false,
        canEditBusinesses: false,
        canEditCategories: false,
        canEditMenuItems: false,
        canEditPromotions: false,
        canEditEmergencyContacts: false,
        canBulkImport: false,
        isReadOnly: true,
      };
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador General';
    case 'editor':
      return 'Editor / Gestor';
    case 'viewer':
      return 'Solo Lectura';
  }
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: getRolePermissions('admin'),
  editor: getRolePermissions('editor'),
  viewer: getRolePermissions('viewer'),
};
