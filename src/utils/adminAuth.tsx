// 관리자 권한 관리 시스템
import React from 'react';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum AdminPermission {
  // 사용자 관리
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  SUSPEND_USERS = 'suspend_users',
  VERIFY_USERS = 'verify_users',
  
  // 공고 관리
  VIEW_JOBS = 'view_jobs',
  APPROVE_JOBS = 'approve_jobs',
  EDIT_JOBS = 'edit_jobs',
  DELETE_JOBS = 'delete_jobs',
  
  // 시스템 관리
  VIEW_SYSTEM = 'view_system',
  MANAGE_SYSTEM = 'manage_system',
  VIEW_LOGS = 'view_logs',
  
  // 관리자 관리
  MANAGE_ADMINS = 'manage_admins',
  INVITE_ADMINS = 'invite_admins',
  
  // 분석 및 통계
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // 설정 관리
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_BACKUP = 'manage_backup'
}

interface AdminUser {
  uid: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  createdBy?: string;
}

// 권한 매핑
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.EDIT_USERS,
    AdminPermission.DELETE_USERS,
    AdminPermission.SUSPEND_USERS,
    AdminPermission.VERIFY_USERS,
    AdminPermission.VIEW_JOBS,
    AdminPermission.APPROVE_JOBS,
    AdminPermission.EDIT_JOBS,
    AdminPermission.DELETE_JOBS,
    AdminPermission.VIEW_SYSTEM,
    AdminPermission.MANAGE_SYSTEM,
    AdminPermission.VIEW_LOGS,
    AdminPermission.MANAGE_ADMINS,
    AdminPermission.INVITE_ADMINS,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.EXPORT_DATA,
    AdminPermission.MANAGE_SETTINGS,
    AdminPermission.MANAGE_BACKUP
  ],
  [AdminRole.ADMIN]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.EDIT_USERS,
    AdminPermission.SUSPEND_USERS,
    AdminPermission.VERIFY_USERS,
    AdminPermission.VIEW_JOBS,
    AdminPermission.APPROVE_JOBS,
    AdminPermission.EDIT_JOBS,
    AdminPermission.VIEW_SYSTEM,
    AdminPermission.VIEW_LOGS,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.EXPORT_DATA
  ],
  [AdminRole.MODERATOR]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.SUSPEND_USERS,
    AdminPermission.VERIFY_USERS,
    AdminPermission.VIEW_JOBS,
    AdminPermission.APPROVE_JOBS,
    AdminPermission.VIEW_ANALYTICS
  ]
};

class AdminAuthManager {
  private currentAdmin: AdminUser | null = null;

  /**
   * 관리자 권한 확인
   */
  hasPermission(permission: AdminPermission): boolean {
    if (!this.currentAdmin || !this.currentAdmin.isActive) {
      return false;
    }

    return this.currentAdmin.permissions.includes(permission);
  }

  /**
   * 관리자 역할 확인
   */
  hasRole(role: AdminRole): boolean {
    if (!this.currentAdmin || !this.currentAdmin.isActive) {
      return false;
    }

    return this.currentAdmin.role === role;
  }

  /**
   * 슈퍼 관리자 여부 확인
   */
  isSuperAdmin(): boolean {
    return this.hasRole(AdminRole.SUPER_ADMIN);
  }

  /**
   * 관리자 여부 확인
   */
  isAdmin(): boolean {
    return this.hasRole(AdminRole.ADMIN) || this.hasRole(AdminRole.SUPER_ADMIN);
  }

  /**
   * 모더레이터 여부 확인
   */
  isModerator(): boolean {
    return this.hasRole(AdminRole.MODERATOR) || this.isAdmin();
  }

  /**
   * 현재 관리자 정보 설정
   */
  setCurrentAdmin(admin: AdminUser): void {
    this.currentAdmin = admin;
  }

  /**
   * 현재 관리자 정보 가져오기
   */
  getCurrentAdmin(): AdminUser | null {
    return this.currentAdmin;
  }

  /**
   * 관리자 로그아웃
   */
  logout(): void {
    this.currentAdmin = null;
  }

  /**
   * 권한에 따른 메뉴 접근 가능 여부
   */
  canAccessMenu(menuKey: string): boolean {
    const menuPermissions: Record<string, AdminPermission[]> = {
      'overview': [AdminPermission.VIEW_ANALYTICS],
      'users': [AdminPermission.VIEW_USERS],
      'jobs': [AdminPermission.VIEW_JOBS],
      'analytics': [AdminPermission.VIEW_ANALYTICS],
      'system': [AdminPermission.VIEW_SYSTEM],
      'admin-invites': [AdminPermission.MANAGE_ADMINS],
      'settings': [AdminPermission.MANAGE_SETTINGS]
    };

    const requiredPermissions = menuPermissions[menuKey] || [];
    return requiredPermissions.some(permission => this.hasPermission(permission));
  }

  /**
   * 사용자 관리 권한 확인
   */
  canManageUsers(): boolean {
    return this.hasPermission(AdminPermission.EDIT_USERS);
  }

  /**
   * 사용자 삭제 권한 확인
   */
  canDeleteUsers(): boolean {
    return this.hasPermission(AdminPermission.DELETE_USERS);
  }

  /**
   * 사용자 정지 권한 확인
   */
  canSuspendUsers(): boolean {
    return this.hasPermission(AdminPermission.SUSPEND_USERS);
  }

  /**
   * 회원 인증 권한 확인
   */
  canVerifyUsers(): boolean {
    return this.hasPermission(AdminPermission.VERIFY_USERS);
  }

  /**
   * 공고 승인 권한 확인
   */
  canApproveJobs(): boolean {
    return this.hasPermission(AdminPermission.APPROVE_JOBS);
  }

  /**
   * 공고 삭제 권한 확인
   */
  canDeleteJobs(): boolean {
    return this.hasPermission(AdminPermission.DELETE_JOBS);
  }

  /**
   * 시스템 관리 권한 확인
   */
  canManageSystem(): boolean {
    return this.hasPermission(AdminPermission.MANAGE_SYSTEM);
  }

  /**
   * 관리자 관리 권한 확인
   */
  canManageAdmins(): boolean {
    return this.hasPermission(AdminPermission.MANAGE_ADMINS);
  }

  /**
   * 데이터 내보내기 권한 확인
   */
  canExportData(): boolean {
    return this.hasPermission(AdminPermission.EXPORT_DATA);
  }

  /**
   * 백업 관리 권한 확인
   */
  canManageBackup(): boolean {
    return this.hasPermission(AdminPermission.MANAGE_BACKUP);
  }
}

// 전역 관리자 인증 매니저 인스턴스
export const adminAuth = new AdminAuthManager();

// 권한 체크 훅
export const useAdminPermission = (permission: AdminPermission): boolean => {
  return adminAuth.hasPermission(permission);
};

// 역할 체크 훅
export const useAdminRole = (role: AdminRole): boolean => {
  return adminAuth.hasRole(role);
};

// 관리자 권한 가드 컴포넌트
export const AdminPermissionGuard: React.FC<{
  permission: AdminPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback }) => {
  if (adminAuth.hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
};

// 관리자 역할 가드 컴포넌트
export const AdminRoleGuard: React.FC<{
  role: AdminRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ role, children, fallback }) => {
  if (adminAuth.hasRole(role)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
};

// 관리자 로그인 상태 확인
export const isAdminLoggedIn = (): boolean => {
  return adminAuth.getCurrentAdmin() !== null;
};

// 관리자 권한 초기화
export const initializeAdminAuth = async (uid: string): Promise<void> => {
  try {
    // Firebase에서 관리자 정보 가져오기
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      const admin: AdminUser = {
        uid: adminDoc.id,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions || ROLE_PERMISSIONS[adminData.role as AdminRole] || [],
        createdAt: adminData.createdAt?.toDate() || new Date(),
        lastLoginAt: adminData.lastLoginAt?.toDate(),
        isActive: adminData.isActive !== false,
        createdBy: adminData.createdBy
      };
      
      adminAuth.setCurrentAdmin(admin);
    }
  } catch (error) {
    console.error('관리자 권한 초기화 실패:', error);
  }
};

export type { AdminUser };
