# Birthday Surprise

A cinematic, responsive birthday experience built with React, Vite, Framer Motion, and Lucide React.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Production output can be checked with:

```bash
npm run build
npm run preview
```

## Personalize the experience

Update [`src/birthdayData.js`](./src/birthdayData.js) to change the birthday person, age, messages, wishes, sender signature, and photographs. Images should be kept in `src/assets` or `public` and referenced from that configuration file; the React components do not need to be edited.

The current starter asset is used as a safe local placeholder for the portrait and memory cards. Replace it with your own local photographs when personalizing the site.

## Global opening schedule

The admin schedule and profile are stored globally in Firebase Firestore. Configure the Firebase web values in `.env` using the `VITE_FIREBASE_*` variables, enable Firestore and Storage in the Firebase console, and deploy the rules from [`firestore.rules`](./firestore.rules) and [`storage.rules`](./storage.rules).

Open the admin page at `/#admin`, save a date and time, and every device loading the site will receive the same schedule in realtime. The date-time value uses the browser's local timezone when it is entered.

The same admin page can update the birthday person's name, main image, and up to three memory images. Images upload to Firebase Storage and their shared URLs are saved in the profile document.

The included rules allow public reads and writes for this private surprise site. For a public production deployment, restrict writes with Firebase Authentication and an admin-only rule.

## Included interactions

- Cinematic intro reveal and replay flow
- CSS 3D gift and birthday cake with candle extinguish animation
- Confetti, fireworks, floating stars, and parallax portrait movement
- Click-to-expand memory gallery
- Animated personal letter and expandable wishes
- Sound/animation controls and reduced-motion support
# HappyBirthday
