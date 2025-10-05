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
  role: "EMPLOYEE" | "MANAGER" | "ADMIN" | "ACCOUNT_OWNER" | "FINANCE";
  department: "ITSG" | "SRE" | "HR" | "SSED";
};
