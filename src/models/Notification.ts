export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'missed_call' | 'system' | 'message';
  read: boolean;
  createdAt: number;
  actionData?: {
    callerUid?: string;
    callerName?: string;
    [key: string]: any;
  };
}
