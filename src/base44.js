import { createClient } from '@base44/sdk';

// This would typically come from environment variables
const BASE44_URL = 'https://api.base44.com';
const BASE44_TOKEN = 'your-token-here';

export const base44 = createClient({
  url: BASE44_URL,
  token: BASE44_TOKEN,
});
