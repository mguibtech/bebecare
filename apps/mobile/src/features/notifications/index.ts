/**
 * API publica da feature notifications (push / FCM).
 *
 * Consumido por:
 *  - AppNavigator: useFcmTokenSync() + <NotificationPermissionGate />
 *  - index.js:     registerBackgroundHandler() + isFirebaseConfigured()
 */

export { useFcmTokenSync } from './hooks/useFcmTokenSync';
export { NotificationPermissionGate } from './components/NotificationPermissionGate';
export { isFirebaseConfigured } from './lib/firebase';
export { registerBackgroundHandler } from './setup';
