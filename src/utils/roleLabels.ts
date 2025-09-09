export type AppRole = 'employer' | 'jobseeker' | 'admin' | string;

export function roleToLabel(role: AppRole): string {
  if (role === 'employer') return '리조트';
  if (role === 'jobseeker') return '크루';
  if (role === 'admin') return '관리자';
  return role;
}

export const roleLabels = {
  employer: '리조트',
  jobseeker: '크루',
  admin: '관리자',
} as const;




