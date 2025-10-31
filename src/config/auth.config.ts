import { backendBaseUrl } from './global.config';

export const authUrl = `${backendBaseUrl}/auth`;
export const csrfTokenUrl = `${authUrl}/token`;
export const registerPATUrl = `${authUrl}/pat`;
export const deletePATUrl = `${authUrl}/pat`;
export const integrationsConfigUrl = `${authUrl}/integrations`;
export const userSettingsUrl = `${backendBaseUrl}/user/settings`;
export const logoutUrl = `${backendBaseUrl}/logout`;
export const keycloakClientRegistrationId = 'baseuser';
export const loginUrl = `${backendBaseUrl}/oauth2/authorization/${keycloakClientRegistrationId}`;
export const baseuserUrl = `${authUrl}/${keycloakClientRegistrationId}/user`;