import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  projectId: 'rota-manager-5a47',
  appId: '1:1003220291376:web:4f48165230f20f4d7382f5',
  storageBucket: 'rota-manager-5a47.firebasestorage.app',
  apiKey: 'AIzaSyAGKcZJ8wJQTmKB7wKa0jpGHQPOSxcmGhM',
  authDomain: 'rota-manager-5a47.firebaseapp.com',
  messagingSenderId: '1003220291376',
  projectNumber: '1003220291376'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)
