import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '@/stores/useToastStore';
import { getToolName } from '@/config/tools.config';

interface UseOAuthCallbackOptions {
  onSuccess?: (toolId: string) => void;
  onError?: (toolId: string, error: string) => void;
}

/**
 * Hook to handle OAuth callback URL parameters
 * Detects ?oauth=success&tool=xxx or ?oauth=error&tool=xxx&error=message
 * Shows toast notification and cleans up URL params
 */
export function useOAuthCallback(options: UseOAuthCallbackOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent processing multiple times
    if (hasProcessed.current) return;

    const oauthStatus = searchParams.get('oauth');
    const toolId = searchParams.get('tool');
    const errorMessage = searchParams.get('error');

    if (!oauthStatus || !toolId) return;

    hasProcessed.current = true;

    // Get tool name for display
    const toolName = getToolName(toolId);

    if (oauthStatus === 'success') {
      toast.success(
        `${toolName} Connected`,
        `Successfully connected to ${toolName}. Your account is now linked.`
      );
      options.onSuccess?.(toolId);
    } else if (oauthStatus === 'error') {
      const message = errorMessage || 'Authentication failed. Please try again.';
      toast.error(
        `${toolName} Connection Failed`,
        message
      );
      options.onError?.(toolId, message);
    }

    // Clean up URL parameters without triggering navigation
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('oauth');
    newParams.delete('tool');
    newParams.delete('error');

    // Update URL without the oauth params
    if (newParams.toString()) {
      setSearchParams(newParams, { replace: true });
    } else {
      // Navigate to clean URL
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate, options]);
}
