"use client";

import React from "react";
import ForbiddenAccessPage from "../ForbiddenAccessPage";

interface PermissionGateProps {
  allowedRoles?: string[];
  allowedDepartments?: string[];
  userRole: string;
  userDepartment?: string;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  allowedRoles = [],
  allowedDepartments = [],
  userRole,
  userDepartment,
  children,
}) => {
  const hasRoleAccess =
    allowedRoles.length === 0 || allowedRoles.includes(userRole);

  const hasDeptAccess =
    allowedDepartments.length === 0 ||
    (userDepartment && allowedDepartments.includes(userDepartment));

  if (!hasRoleAccess || !hasDeptAccess) {
    return <ForbiddenAccessPage />;
  }

  return <>{children}</>;
};
