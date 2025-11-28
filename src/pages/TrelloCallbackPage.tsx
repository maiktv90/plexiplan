import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ToolService } from '@/api/services/ToolService';
import { toast } from '@/stores/useToastStore';

/**
 * Trello OAuth callback page
 * Trello redirects here with the token in the URL hash: #token=xxx
 * This page extracts the token, saves it to the backend, and redirects to settings
 *
 * Note: This component is rendered outside of React Router context (in App.tsx)
 * because it handles the Trello fragment callback which uses the URL hash for the token.
 * We use window.location for navigation instead of useNavigate.
 */
export const TrelloCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Prevent double execution from React StrictMode
  const isProcessingRef = useRef(false);

  // Navigate to settings using hash router format
  const navigateToSettings = () => {
    // App uses hash router, so navigate to /#/settings
    window.location.href = window.location.origin + '/#/settings';
  };

  useEffect(() => {
    const processCallback = async () => {
      // Prevent double execution from React StrictMode
      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;
      try {
        // Extract token from URL hash
        // Trello sends it as #token=xxx
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1)); // Remove the # and parse
        const token = params.get('token');

        if (!token) {
          throw new Error('No token received from Trello');
        }

        // Save the token to backend
        await ToolService.registerPAT({
          client: 'trello',
          token: token,
        });

        setStatus('success');
        toast.success('Trello Connected', 'Your Trello account has been connected successfully.');

        // Redirect to settings after a short delay
        setTimeout(navigateToSettings, 1500);
      } catch (error) {
        console.error('Trello callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to connect Trello');
        toast.error('Connection Failed', 'Failed to connect your Trello account.');

        // Redirect to settings after showing error
        setTimeout(navigateToSettings, 3000);
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting Trello...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we complete the connection.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Trello Connected!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to settings...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {errorMessage || 'Something went wrong while connecting to Trello.'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to settings...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
