import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDbXzuiyhLSvbchvbE95jIVX0XGxWk3hhE",
  authDomain: "htv-vorstands-app.firebaseapp.com",
  projectId: "htv-vorstands-app",
  messagingSenderId: "291659147396",
  appId: "1:291659147396:web:3b9607bb2dc6b6bdbb7ad1",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
