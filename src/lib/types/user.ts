export type GetUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  department?: string;
};
export type User = {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN" | "ACCOUNT_OWNER" | "FINANCE";
  department: "ITSG" | "SRE" | "HR" | "SSED";
  position?: string;
  managerId?: string | null;
  manager?: { id: string; name: string } | null;
  addedBy?: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Manager = {
  id: string;
  name: string;
  role:
    | "EMPLOYEE"
    | "MANAGER"
    | "ADMIN"
    | "ACCOUNT_OWNER"
    | "FINANCE"
    | "TEAM_LEAD";
  department: "ITSG" | "SRE" | "HR" | "SSED";
};

export type UserRoles = {
  [key in Manager["role"]]: string;
};

export const userRoles: UserRoles = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin",
  ACCOUNT_OWNER: "Account Owner",
  FINANCE: "Finance",
  TEAM_LEAD: "Team Lead",
};

export type GetUserResponse = {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
