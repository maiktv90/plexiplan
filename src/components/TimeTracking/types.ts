export interface ITracking {
  id: string;
  start?: string;
  stop?: string;
  active: number;
  task?: ITrackingTask;
  duration?: string;
}

export interface IBooking {
  _id: string;
  _rev?: string;
  bookingId: string;
  createdAt: string;
  closed: number;
  bookableHours: string;
  activeTracking?: string;
  trackings?: ITracking[];
}

export interface ITrackingTask {
  label: string;
  sourceLabel?: string;
  taskId?: string;
  clientRegistrationId?: string;
}

export interface CouchDb {
  token: string;
  expiresAt: string;
  dbName: string;
  serviceId: string;
}

export interface PouchError {
  error: string;
  message: string;
  name: string;
  reason: string;
  result: unknown;
  stack: string;
  status: number;
}
