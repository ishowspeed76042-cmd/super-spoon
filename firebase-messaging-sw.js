// =========================================
// ACANZA PRO - BACKGROUND SERVICE WORKER
// =========================================

// 1. Import Firebase Scripts (Compat Version)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 2. Initialize Firebase in the Service Worker
// Dhyan rakhein: Ye wahi config hai jo aapki index.html mein hai
firebase.initializeApp({
    apiKey: "AIzaSyAYX1lrxHre2bYKzZfOMM3WWwIKHPySI9I",
    authDomain: "chat-81c0c.firebaseapp.com",
    databaseURL: "https://chat-81c0c-default-rtdb.firebaseio.com",
    projectId: "chat-81c0c",
    storageBucket: "chat-81c0c.appspot.com",
    messagingSenderId: "852591586864", // Aapki App ID ka center part
    appId: "1:852591586864:web:db877a72adbb742d5287f5"
});

// 3. Initialize Messaging
const messaging = firebase.messaging();

// 4. Handle Background Messages
// Jab user site par nahi hota, tab ye notification dikhayega
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title || "New Message on ACANZA";
    const notificationOptions = {
        body: payload.notification.body || "Open the app to check your message.",
        icon: '/pwa-icon.png', // Aapka logo path
        badge: '/badge-icon.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. Nayi VAPID Key ka registration check (Optional but safe)
// Browser ko force karta hai ki wo nayi key recognize kare
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});