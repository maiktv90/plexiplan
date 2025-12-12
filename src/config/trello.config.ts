export const trelloClientRegistrationId = 'trello';
const trelloPublicApiKey = 'd04a3e9f730c32bb2b4b090b06f4c045';
// Note: return_url must match the frontend origin for the callback to work
const returnUrl = `${window.location.origin}/auth/trello/callback`;
export const trelloKeygenUrl = `https://trello.com/1/authorize?expiration=never&name=PlexifyPlanner&scope=read&response_type=fragment&callback_method=fragment&return_url=${encodeURIComponent(returnUrl)}&key=${trelloPublicApiKey}`;
