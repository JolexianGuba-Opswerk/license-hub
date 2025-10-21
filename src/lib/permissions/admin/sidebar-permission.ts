export enum Role {
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
  ACCOUNT_OWNER = "ACCOUNT_OWNER",
  TEAM_LEAD = "TEAM_LEAD",
  FINANCE = "FINANCE",
}

export enum Department {
  ITSG = "ITSG",
  SRE = "SRE",
  HR = "HR",
  SSED = "SSED",
  FINANCE = "FINANCE",
}

export const sidebarPermissions: {
  [title: string]: {
    roles?: Role[];
    departments?: Department[];
  };
} = {
  Dashboard: {
    roles: [
      Role.EMPLOYEE,
      Role.MANAGER,
      Role.ADMIN,
      Role.ACCOUNT_OWNER,
      Role.TEAM_LEAD,
      Role.FINANCE,
    ],
  },
  "License Management": {
    roles: [Role.MANAGER, Role.ADMIN, Role.TEAM_LEAD],
    departments: [Department.ITSG, Department.SRE],
  },
  "User Management": {
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    departments: [Department.ITSG, Department.HR],
  },
  Requests: {
    roles: [
      Role.EMPLOYEE,
      Role.MANAGER,
      Role.ADMIN,
      Role.ACCOUNT_OWNER,
      Role.TEAM_LEAD,
      Role.FINANCE,
    ],
  },
  Assignments: {
    roles: [Role.TEAM_LEAD, Role.ADMIN, Role.MANAGER],
    departments: [Department.ITSG, Department.SRE],
  },
  Procurement: {
    roles: [Role.FINANCE, Role.MANAGER, Role.TEAM_LEAD],
    departments: [Department.ITSG, Department.FINANCE],
  },
  Reports: {
    roles: [Role.TEAM_LEAD, Role.ADMIN],
    departments: [Department.ITSG],
  },
};

export function canAccessSidebarItem(
  title: string,
  userRole?: Role,
  userDepartment?: Department
) {
  const rule = sidebarPermissions[title];
  if (!rule) return true;
  if (!userRole || !userDepartment) return false;

  const roleAllowed = !rule.roles || rule.roles.includes(userRole);
  const deptAllowed =
    !rule.departments || rule.departments.includes(userDepartment);

  return roleAllowed && deptAllowed;
}
