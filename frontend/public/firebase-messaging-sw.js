importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBleMyxqY_csHiSFTjhKohzCK9hCp1SoGE",
    authDomain: "nischte-c32df.firebaseapp.com",
    projectId: "nischte-c32df",
    storageBucket: "nischte-c32df.firebasestorage.app",
    messagingSenderId: "712014896579",
    appId: "1:712014896579:web:4fa28989de463baacbb176",
    measurementId: "G-231NX9MZTW"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log("ahahahah")
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});