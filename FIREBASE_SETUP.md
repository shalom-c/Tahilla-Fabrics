# Firebase setup and deployment

## Install

From the project directory:

```sh
npm install
npm install react-router-dom firebase
npm run dev
```

React Router and Firebase are already listed in `package.json`.

## Create and configure Firebase

1. In the [Firebase Console](https://console.firebase.google.com/), create a project for Tehilla Fabrics.
2. Open **Build → Authentication → Get started → Sign-in method**, enable **Email/Password**, and save.
3. Open **Build → Firestore Database**, create a database, and choose a region close to your customers.
4. Open **Build → Storage → Get started** and create the default bucket. Storage may require the Firebase project's billing plan to be upgraded.
5. In **Project settings → General → Your apps**, register a Web app. Copy its Firebase configuration values.
6. Put those values into the root `.env` file using the variable names already in that file. Keep the `VITE_` prefixes. These Firebase web-app values are client configuration, not service-account credentials; never put a service-account private key in a Vite app.
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
7. Contact settings are also read from `.env`: `VITE_WHATSAPP_NUMBER`, `VITE_SHOP_EMAIL`, and optionally `VITE_FORM_ENDPOINT`. Their current shop values are in `.env`; keep the endpoint empty to use the email fallback.
8. Publish the contents of `firestore.rules` in **Firestore Database → Rules** and the contents of `storage.rules` in **Storage → Rules**. Do not leave permissive test-mode rules deployed.
9. Restart the Vite server after editing `.env`.
10. Sign up once through `/signup`. In **Firestore → users → [that user's UID]**, manually change `role` from `customer` to `admin`. The user document ID is the Firebase Authentication UID. Sign out and sign in again to activate the admin dashboard.
11. Visit `/admin` and choose **Import sample products** once to create the 12 example fabrics in the `products` collection. The import action appears only while that collection is empty.

Role selection is intentionally not present in the signup form. A newly registered user is always saved with `role: "customer"`. Passwords are handled only by Firebase Authentication and are never saved in Firestore or app code.

## Security rule behavior

- Products are readable by anyone and writable only by an authenticated user whose Firestore user document has `role: "admin"`.
- Product images can be publicly read by the shop and can only be uploaded or replaced by an admin. Upload rules enforce a 2 MB limit and JPEG, PNG, or WebP content type. The UI also validates these constraints.
- A customer can create their own profile only with the `customer` role and can read/update only their own profile fields. They cannot modify the role or delete the document.
- Admins can read the users collection for the Customers tab. This admin-only read exception is necessary for that dashboard; customers still cannot read other users' documents.

If a shop owner loses all administrator accounts, use the Firebase Console to set the role on their own user document. Never grant roles through client-side signup or an untrusted client write.

## Deploy

Build locally with `npm run build`. The `public/_redirects` file and `vercel.json` make client-side routes such as `/shop`, `/login`, and `/admin` resolve to the Vite entry point.

### Netlify

1. Import the repository in Netlify.
2. Set the build command to `npm run build` and publish directory to `dist`.
3. Add each `VITE_FIREBASE_*` variable from `.env` under **Site configuration → Environment variables**.
4. Deploy, then trigger a new deploy any time environment variables change.

### Vercel

1. Import the repository in Vercel and select the Vite framework preset.
2. Use `npm run build` as the build command and `dist` as the output directory.
3. Add all `VITE_FIREBASE_*` values under **Project Settings → Environment Variables** for the relevant environments.
4. Deploy or redeploy after adding/changing environment variables.

Do not commit `.env`; `.gitignore` already excludes it. Use `.env.example` as the variable-name reference. Firebase client values are available in the browser by design, so enforce authorization with Firebase rules and never embed service-account keys in the frontend.
