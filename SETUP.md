# Vorstands-App – Setup-Anleitung

## 1. Firebase-Projekt erstellen

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Neues Projekt anlegen (z.B. `htv-vorstands-app`)
3. **Authentication** aktivieren → Sign-in method → E-Mail/Passwort aktivieren
4. **Firestore Database** erstellen → Produktionsmodus
5. **Storage** aktivieren

## 2. Firebase-Config eintragen

Datei öffnen: `src/firebase/config.ts`

In der Firebase Console → Projekteinstellungen → Deine Apps → Web-App hinzufügen → Config kopieren und eintragen.

```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
}
```

## 3. Ersten Admin-Nutzer anlegen

**Schritt 1:** In Firebase Console → Authentication → Nutzer hinzufügen:
- E-Mail: deine-email@example.com
- Passwort: sicheres Passwort
- Notiere die generierte **UID**

**Schritt 2:** In Firestore → Datenbank → Collection `users` anlegen:
- Document ID = die UID aus Schritt 1
- Felder:
  ```
  displayName: "Peter Schinnerling"
  email: "deine-email@example.com"
  role: "admin"
  createdAt: (Timestamp, jetzt)
  ```

## 4. Firestore Security Rules deployen

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # Projekt auswählen, firestore.rules verwenden
firebase deploy --only firestore:rules
```

## 5. App lokal starten

```bash
npm install
npm run dev
```

Öffne http://localhost:5173

## 6. Weitere Nutzer anlegen

Als Admin in der App unter **Mitglieder** – oder direkt in Firebase Console:
1. Authentication → Nutzer hinzufügen
2. Firestore → users → Document mit der neuen UID anlegen
   - `role`: `"vorstand"` oder `"gast"`

## 7. Deployment auf Firebase Hosting (optional)

```bash
firebase init hosting   # dist-Ordner, SPA: ja
npm run build
firebase deploy
```

## Projektstruktur

```
src/
├── firebase/config.ts      ← Firebase-Konfiguration
├── context/AuthContext.tsx ← Login-State global
├── types/index.ts          ← TypeScript-Typen
├── pages/
│   ├── LoginPage.tsx       ← Anmeldeseite
│   ├── ChatPage.tsx        ← Chat mit Channels
│   ├── TodosPage.tsx       ← Aufgabenverwaltung
│   ├── KalenderPage.tsx    ← Terminkalender
│   └── AdminPage.tsx       ← Nutzerverwaltung (nur Admin)
└── components/
    ├── Layout/AppShell.tsx ← Sidebar + Navigation
    └── Chat/               ← Chat-Komponenten
```

## Nächste Schritte (Phase 2)

- [ ] Push-Notifications via Firebase Cloud Messaging
- [ ] Google Kalender Sync (Google Calendar API)
- [ ] iCal Export
- [ ] Nachrichtensuche
- [ ] HTV-Logo als PWA-Icon einbinden
