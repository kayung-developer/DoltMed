import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase'; // Your firebase.js file
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // The base api instance
import toast from 'react-hot-toast';

const useFCM = () => {
    const { isAuthenticated } = useAuth();
    const [fcmToken, setFcmToken] = useState(null);

    useEffect(() => {
        if (isAuthenticated && 'Notification' in window && 'serviceWorker' in navigator) {

            const messaging = getMessaging(app);

            const requestPermissionAndGetToken = async () => {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                        // Get token. You need to generate this VAPID key in your Firebase console.
                        // Project Settings > Cloud Messaging > Web configuration
                        const currentToken = await getToken(messaging, {
                            vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
                        });

                        if (currentToken) {
                            console.log('FCM Token:', currentToken);
                            setFcmToken(currentToken);
                            // Send token to backend
                            await api.post('/notifications/register-device', { fcm_token: currentToken });
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    } else {
                        console.log('Unable to get permission to notify.');
                    }
                } catch (error) {
                    console.error('An error occurred while retrieving token. ', error);
                }
            };

            requestPermissionAndGetToken();

            // Handle foreground messages
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received in foreground. ', payload);

                const { notification, data } = payload;

                // Show a custom toast notification
                toast.custom(
                  (t) => (
                    <div
                      className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                      } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                      onClick={() => {
                          if(data.link) window.location.href = data.link; // Or use react-router navigate
                          toast.dismiss(t.id);
                      }}
                    >
                      <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {notification.body}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-l border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-dortmed-600 hover:text-dortmed-500 focus:outline-none focus:ring-2 focus:ring-dortmed-500"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ),
                  { duration: 6000 }
                );
            });

            return () => unsubscribe();
        }
    }, [isAuthenticated]);

    return fcmToken;
};

export default useFCM;