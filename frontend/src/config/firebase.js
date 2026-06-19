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

const firebaseConfig = {
  apiKey:            'AIzaSyAFB87_bIjcVKSOr6EVD93vPIMG3LAwXbk',
  authDomain:        'automedic-90499.firebaseapp.com',
  projectId:         'automedic-90499',
  storageBucket:     'automedic-90499.firebasestorage.app',
  messagingSenderId: '460337438083',
  appId:             '1:460337438083:web:ae8a3eb1541cc023f42ab6',
  measurementId:     'G-4VETQEKR6Q',
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
