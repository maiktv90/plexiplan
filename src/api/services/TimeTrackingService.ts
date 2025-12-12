// Clean Architecture - Time Tracking Service Layer
import { timeTrackingApiClient } from '@/api';

export interface TaskDto {
  name: string;
  id?: string;
}

export interface TimeTrackingDto {
  start: string;
  uuid: string;
  end?: string;
  isActive: boolean;
  task?: TaskDto;
  // Pause support fields
  isPaused?: boolean;
  pausedElapsedSeconds?: number;  // Accumulated paused time in seconds
  lastResumeTime?: string;        // ISO timestamp when timer was last resumed
}

export interface BookingDto {
  totalWorkTime: string;
  billableWorkTime: string;
  breakTime: string;
}

export interface TimeBookingDto {
  date: string; // LocalDate as string (YYYY-MM-DD)
  timeTrackings: TimeTrackingDto[];
  booking: BookingDto;
  org?: string;
}

export interface CreateTimeTrackingRequest {
  start: string;
  uuid?: string;
  end?: string;
  task: {
    name: string;
    id?: string;
  };
  // Pause support fields
  isPaused?: boolean;
  pausedElapsedSeconds?: number;
  lastResumeTime?: string | null;
}

export interface TimeBookingRequest {
  date: string;
  timeTrackings: TimeTrackingDto[];
  booking: BookingDto;
}

export class TimeTrackingService {
  static async getTimeTrackings() {
    return await timeTrackingApiClient.get<TimeTrackingDto[]>('/timetracking');
  }

  static async createOrUpdateTimeTracking(request: CreateTimeTrackingRequest) {
    return await timeTrackingApiClient.put<TimeTrackingDto>('/timetracking', request);
  }

  static async deleteTimeTracking(uuid: string) {
    return await timeTrackingApiClient.delete<void>('/timetracking', {
      data: { uuids: [uuid] },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  static async deleteMultipleTimeTrackings(uuids: string[]) {
    return await timeTrackingApiClient.delete<void>('/timetracking', {
      data: { uuids },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  static async bookTime(request: TimeBookingRequest) {
    return await timeTrackingApiClient.post<TimeBookingDto>('/timetracking/booking', request);
  }
}