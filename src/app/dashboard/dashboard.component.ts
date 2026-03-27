import { Component, inject, OnInit } from '@angular/core';
import {
  Firestore,
  getDoc,
  doc,
  onSnapshot,
  collection,
  where,
  getDocs,
  query,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, user, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { QuizUser } from '../modules';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  currentUser: any = null; // Wir nutzen any, um flexibel auf Firestore-Daten zuzugreifen
  userName: string = 'Lädt...';
  coins: number = 0;
  lvl: number = 0;
  userId: string = '';
  onlineFriends: any[] = [];
  avatar: string = '';
  showSearchDialog: boolean = false;
  searchName: string = '';
  searchResults: any[] = [];
  uid: string = '';
  incomingRequests: any[] = [];
  showRequestsDialog: boolean = false; // Schalter für das Pop-up
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.uid = user.uid; // <--- Das hier hat gefehlt!
        this.userId = user.uid;
        try {
          const requestsRef = collection(
            this.firestore,
            `users/${this.userId}/friendRequests`,
          );

          onSnapshot(requestsRef, (snapshot) => {
            this.incomingRequests = snapshot.docs.map((doc) => ({
              requestId: doc.id,
              ...doc.data(),
            }));
            console.log('Post ist da:', this.incomingRequests.length);
          });
          // 2. Jetzt ist 'uid' garantiert ein string und doc() funktioniert
          const userDocRef = doc(this.firestore, 'users', this.userId);
          const userData = await getDoc(userDocRef);

          if (userData.exists()) {
            this.userName = userData.data()['name'] || 'Quizzer';
            this.coins = userData.data()['coins'] || 0;
            this.lvl = userData.data()['level'] || 0;
            this.userId = userData.data()['uid'];
            this.avatar = userData.data()['avatar'] || '🦊';
            this.userId = userData.data()['uid'];
            this.loadFriends();
          } else {
            this.userName = 'Gast';
            console.warn('Kein Dokument für UID gefunden:', this.userId);
          }
        } catch (e) {
          console.error('Fehler beim Firestore-Abruf:', e);
          this.userName = 'Fehler';
        }
      } else {
        this.userName = 'Nicht eingeloggt';
      }
    });
  }

  async loadFriends() {
    this.onlineFriends = [];
    const friendsRef = collection(
      this.firestore,
      `users/${this.userId}/friends`,
    );
    const acceptedQuery = query(friendsRef, where('request', '==', 'accepted'));
    const friendsSnapshot = await getDocs(acceptedQuery);
    friendsSnapshot.forEach(async (friendDoc) => {
      const friendUid = friendDoc.id; // Die UID des Freundes
      const userDocRefer = doc(this.firestore, 'users', friendUid);
      const userData = await getDoc(userDocRefer);
      if (userData.exists() && userData.data()['isOnline'] === true) {
        console.log('es ist jemand Online');
        this.onlineFriends.push(userData.data());
      }
    });
  }

  startQuize() {
    this.router.navigate(['/quiz']);
  }
  openInput() {
    this.showSearchDialog = true;
  }

  closeInput() {
    this.showSearchDialog = false;
    this.searchName = ''; // Feld leeren beim Schließen
  }

  async searchFriend() {
    console.log('--- START SUCHE ---');
    console.log('Eingegebener Name:', this.searchName);

    if (this.searchName.length < 3) {
      console.warn('Suche abgebrochen: Name zu kurz');
      this.searchResults = [];
      return;
    }

    console.log('UID des aktuellen Users (ICH):', this.uid);
    const searchLower = this.searchName.toLowerCase();
    console.log('Suchbegriff (lowercase):', searchLower);

    const userQuery = query(
      collection(this.firestore, 'users'),
      where('name_lowerCase', '>=', searchLower),
      where('name_lowerCase', '<=', searchLower + '\uf8ff'),
    );

    console.log('Query erstellt, starte Firestore-Abruf...');

    const querySnapshot = await getDocs(userQuery);
    console.log('Abruf beendet. Anzahl Treffer:', querySnapshot.size); // <--- DAS IST DIE WICHTIGSTE ZEILE

    this.searchResults = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as QuizUser;
      const userWithId = { ...data, uid: docSnap.id };
      if (userWithId.uid !== this.uid) {
        this.searchResults.push(userWithId);
      }
    });

    console.log('Finales Suchergebnis (exkl. ICH):', this.searchResults);
    console.log('--- ENDE SUCHE ---');
  }

  async sendRequest(targetUid: string) {
    try {
      const requestDocRef = doc(
        this.firestore,
        `users/${targetUid}/friendRequests`,
        this.uid,
      );

      await setDoc(requestDocRef, {
        fromUid: this.uid,
        fromName: this.userName,
        fromAvatar: this.avatar,
        status: 'pending',
        timestamp: new Date(),
      });

      console.log('Anfrage gesendet an:', targetUid);
      alert('Anfrage gesendet!');
      this.closeInput();
    } catch (e) {
      console.error('Senden fehlgeschlagen:', e);
    }
  }
openRequests() {
  this.showRequestsDialog = true;
}

async acceptFriend(req: any) {
  // 1. Pfade definieren
  const myFriendRef = doc(this.firestore, `users/${this.uid}/friends`, req.fromUid);
  const theirFriendRef = doc(this.firestore, `users/${req.fromUid}/friends`, this.uid);
  const requestRef = doc(this.firestore, `users/${this.uid}/friendRequests`, req.requestId);

  try {
    // 2. Beidseitig eintragen
    await setDoc(myFriendRef, { request: 'accepted', name: req.fromName });
    await setDoc(theirFriendRef, { request: 'accepted', name: this.userName });

    // 3. Brief löschen
    await deleteDoc(requestRef);
    alert('Freundschaft bestätigt!');
  } catch (e) {
    console.error('Fehler:', e);
  }
}

async declineFriend(requestId: string) {
  const requestRef = doc(this.firestore, `users/${this.uid}/friendRequests`, requestId);
  await deleteDoc(requestRef);
}
}
