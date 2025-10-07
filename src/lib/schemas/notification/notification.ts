export type NotificationType =
  | "LICENSE_CREATED"
  | "LICENSE_ASSIGNED"
  | "LICENSE_EXPIRED"
  | "LICENSE_REQUESTED"
  | "PROCUREMENT_REQUEST"
  | "USER_ADDED"
  | "GENERAL";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  url?: string;
  read: boolean;
  createdAt: Date;
}
