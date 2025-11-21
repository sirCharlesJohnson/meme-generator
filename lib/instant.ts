import { init } from '@instantdb/react';

// Initialize InstantDB with your app ID
const APP_ID = 'adbe79f3-ad7d-4af9-aeae-00f2e5dae65b';

const db = init({ appId: APP_ID });

export { db };

