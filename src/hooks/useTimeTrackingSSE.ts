import { useEffect, useRef, useCallback } from 'react';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { useQueryClient } from '@tanstack/react-query';

// Check if we're in extension context
const isExtensionContext = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// SSE endpoint URL
const SSE_BASE_URL = 'http://localhost:8081';
const SSE_ENDPOINT = '/planner/api/v1/timetracking/events';

// Get auth token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    if (isExtensionContext()) {
      // Try new token storage first
      const result = await chrome.storage.local.get(['auth_tokens']);
      if (result.auth_tokens?.accessToken) {
        return result.auth_tokens.accessToken;
      }
      // Fall back to legacy storage
      const legacyResult = await chrome.storage.local.get(['auth_token']);
      return legacyResult.auth_token || null;
    } else {
      // Try new token storage first
      const tokens = localStorage.getItem('auth_tokens');
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          if (parsed.accessToken) return parsed.accessToken;
        } catch (e) {
          // Suppress JSON parsing errors
        }
      }
      // Fall back to legacy storage
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
  } catch (error) {
    console.error('SSE: Error getting auth token:', error);
    return null;
  }
};

interface TimeTrackingEvent {
  type: 'START' | 'STOP' | 'PAUSE' | 'RESUME' | 'UPDATE' | 'DELETE';
  data: {
    uuid: string;
    start: string;
    end?: string;
    isActive: boolean;
    isPaused?: boolean;
    pausedElapsedSeconds?: number;
    lastResumeTime?: string;
    task?: {
      name: string;
    };
  } | null;
  timestamp: string;
}

interface UseTimeTrackingSSEOptions {
  enabled?: boolean;
}

export const useTimeTrackingSSE = (options: UseTimeTrackingSSEOptions = {}) => {
  const { enabled = true } = options;
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const { setActiveTracking } = useBackendTimeTrackingStore();

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const eventData: TimeTrackingEvent = JSON.parse(event.data);

      switch (eventData.type) {
        case 'START':
          // New tracking started - update store with full tracking data
          if (eventData.data) {
            setActiveTracking(eventData.data);
          }
          break;

        case 'STOP':
          // Tracking stopped - clear active tracking
          setActiveTracking(null);
          // Refetch to update the list with completed tracking
          queryClient.invalidateQueries({ queryKey: ['timetracking', 'list'] });
          break;

        case 'PAUSE':
          // Update active tracking with pause state
          if (eventData.data) {
            setActiveTracking(eventData.data);
          }
          break;

        case 'RESUME':
          // Update active tracking with resume state
          if (eventData.data) {
            setActiveTracking(eventData.data);
          }
          break;

        case 'UPDATE':
          // General update - update tracking and refetch list
          if (eventData.data) {
            setActiveTracking(eventData.data);
          }
          queryClient.invalidateQueries({ queryKey: ['timetracking', 'list'] });
          break;

        case 'DELETE':
          // Refetch list to reflect deletion
          queryClient.invalidateQueries({ queryKey: ['timetracking', 'list'] });
          break;
      }
    } catch (error) {
      console.error('Failed to parse SSE event:', error);
    }
  }, [setActiveTracking, queryClient]);

  const connect = useCallback(async () => {
    // Don't connect if already connected
    if (abortControllerRef.current) {
      return;
    }

    try {
      // Get auth token
      const token = await getAuthToken();
      if (!token) {
        console.log('SSE: No auth token available, skipping connection');
        return;
      }

      const url = isExtensionContext()
        ? `${SSE_BASE_URL}${SSE_ENDPOINT}`
        : SSE_ENDPOINT;

      // Use fetch with Authorization header instead of EventSource
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        console.error('SSE connection failed:', response.status, response.statusText);
        abortControllerRef.current = null;

        // Retry on auth errors after delay
        if (!reconnectTimeoutRef.current && enabled) {
          console.log('SSE: Will attempt reconnect in 10 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 10000);
        }
        return;
      }

      console.log('SSE connection established');

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('SSE: No reader available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('SSE stream ended');
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Process complete events (separated by double newlines)
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep incomplete event in buffer

            for (const eventText of events) {
              if (!eventText.trim()) continue;

              // Parse SSE format
              const lines = eventText.split('\n');
              let eventType = 'message';
              let data = '';

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventType = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                  data = line.slice(5).trim();
                } else if (line.startsWith(':')) {
                  // Comment/heartbeat, ignore
                  continue;
                }
              }

              if (data && eventType === 'timetracking') {
                handleEvent({ data } as MessageEvent);
              }
            }
          }
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            console.log('SSE connection aborted');
          } else {
            console.error('SSE stream error:', error);
          }
        } finally {
          abortControllerRef.current = null;

          // Reconnect if enabled and not manually disconnected
          if (enabled && !reconnectTimeoutRef.current) {
            console.log('SSE: Will attempt reconnect in 10 seconds...');
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              connect();
            }, 10000);
          }
        }
      };

      processStream();
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      abortControllerRef.current = null;
    }
  }, [enabled, handleEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log('SSE connection closed');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected: abortControllerRef.current !== null,
  };
};