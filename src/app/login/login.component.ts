import { CommonModule } from '@angular/common';
import { Component, TestabilityRegistry } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private firestore: Firestore,
    public auth: Auth,
    private router: Router,
  ) {}

  async userLogin() {
    // 1. Eingaben prüfen (Basic Validierung)
    if (!this.email || !this.password) {
      console.error('Email oder Passwort fehlen!');
      return;
    }

    try {
      // 2. Der gesamte Async-Aufruf MUSS ins try
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        this.email,
        this.password,
      );

      // 3. Den User aus dem Credential ziehen
      const user = userCredential.user;

      console.log('Login erfolgreich:', user.uid);
      this.router.navigate(['/dashboard']);
      // Hier kannst du den User weiterleiten, z.B.:
      // this.router.navigate(['/dashboard']);
    } catch (error) {
      // 4. Fehlerbehandlung

      this.errorMessage = 'Login fehlgeschlagen. Bitte prüfe deine Daten.';
      console.error('Fehler:');
    }
  }
}
