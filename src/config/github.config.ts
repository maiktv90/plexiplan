import { backendBaseUrl } from './global.config';

export const ghClientRegistrationId = 'github';
export const githubLoginUrl = `${backendBaseUrl}/oauth2/authorization/${ghClientRegistrationId}`;
export const githubApiUrl = `${backendBaseUrl}/api/v1/${ghClientRegistrationId}`;
