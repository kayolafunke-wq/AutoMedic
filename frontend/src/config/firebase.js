import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'

// Firebase configuration - Uses environment variables if available, falls back to defaults
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAFB87_bIjcVKSOr6EVD93vPIMG3LAwXbk',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'automedic-90499.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'automedic-90499',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'automedic-90499.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '460337438083',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:460337438083:web:ae8a3eb1541cc023f42ab6',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4VETQEKR6Q',
}

const app          = initializeApp(firebaseConfig)
export const auth  = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
}

export default app
