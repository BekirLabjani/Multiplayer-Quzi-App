import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, user } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { doc, setDoc } from '@firebase/firestore';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  email: string = '';
  password: string = '';
  name: string = '';
  repeatPassword: string = '';

  constructor(
    private firestore: Firestore,
    public auth: Auth,
    private router: Router,
  ) {}

  avatarList: string[] = [
    'assets/img/hund.png',
    'assets/img/duck.png',
    'assets/img/lion.png',
    'assets/img/giraffe.png',
    'assets/img/animal.png',
    'assets/img/katze.png',
  ];
  
  selectedAvatar: string = 'assets/img/hund.png'; // Dein Standardbild
  async signUp() {
    // Füge 'async' hinzu
    if (this.password !== this.repeatPassword) {
      alert('Passwörter stimmen nicht überein');
      return; // Sofort abbrechen
    }

    try {
      // 1. Warte auf Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password,
      );
      const user = userCredential.user;
      this.saveUserToDatabase(user.uid);
      console.log('User erstellt mit UID:', user.uid);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      alert('Fehler: ' + error);
    }
  }

  async saveUserToDatabase(uid: string) {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      await setDoc(userDocRef, {
        uid: uid,
        name: this.name, // Dein Username aus dem [(ngModel)]
        email: this.email,
        avatar: this.selectedAvatar, // HIER wird das Icon gespeichert!
        level: 1, // Start-Level
        coins: 20, // Start-Kapital
        isOnline: true,
        name_lowerCase: this.name.toLowerCase(), // <--- DAS ist der Turbo für deine Suche!
      });
    } catch {}
  }

selectAvatar(url: string){
this.selectedAvatar = url;
}
}
