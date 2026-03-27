import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"anime-quiz-backend","appId":"1:917547473434:web:66f84eccd7cca63438cfa3","storageBucket":"anime-quiz-backend.firebasestorage.app","apiKey":"AIzaSyAeH14feFX9mm-wW-D64ZxFJRkjeCSsS70","authDomain":"anime-quiz-backend.firebaseapp.com","messagingSenderId":"917547473434","measurementId":"G-TG7E6FJC4Z"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideAnimationsAsync()]
};
