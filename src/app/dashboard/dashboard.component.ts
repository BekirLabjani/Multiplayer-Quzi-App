import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
  writeBatch,
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, Unsubscribe } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Friend, FriendRequest, QuizUser } from '../modules';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private friendsUnsubscribe?: Unsubscribe;

  private friendsMap: Map<string, Friend> = new Map(); // sauberer als Array
  public onlineFriends: Friend[] = [];

  currentUser: any = null; // Wir nutzen any, um flexibel auf Firestore-Daten zuzugreifen
  userName: string = 'Lädt...';
  isLoading: boolean = false;
  coins: number = 0;
  lvl: number = 0;
  userId: string = '';
  avatar: string = '';
  showSearchDialog: boolean = false;
  searchName: string = '';
  searchResults: any[] = [];
  incomingRequests: FriendRequest[] = [];
  showRequestsDialog: boolean = false; // Schalter für das Pop-up
  showfriendsList: boolean = false;
  errorMessage: string = "";

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
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
          });
          // 2. Jetzt ist 'uid' garantiert ein string und doc() funktioniert
          const userDocRef = doc(this.firestore, 'users', this.userId);
          const userData = await getDoc(userDocRef);

          if (userData.exists()) {
            this.userName = userData.data()['name'] || 'Quizzer';
            this.coins = userData.data()['coins'] || 0;
            this.lvl = userData.data()['level'] || 0;
            this.avatar = userData.data()['avatar'] || '🦊';
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
    if (this.friendsUnsubscribe) {
      this.friendsUnsubscribe();
    }
    const friendsRef = collection(
      this.firestore,
      `users/${this.userId}/friends`,
    );
    const q = query(friendsRef, where('request', '==', 'accepted'));

    this.friendsUnsubscribe = onSnapshot(q, (snapshot) => {
      const currentFriendUids = new Set<string>();
      snapshot.forEach((doc) => currentFriendUids.add(doc.id));

      for (const [uid, unsubscribe] of this.subscriptions) {
        if (!currentFriendUids.has(uid)) {
          unsubscribe();
          this.subscriptions.delete(uid);
          this.friendsMap.delete(uid);
        }
      }

      snapshot.forEach((friendDoc) => {
        const friendUid = friendDoc.id;

        if (this.subscriptions.has(friendUid)) return;

        const userRef = doc(this.firestore, 'users', friendUid);

        const unsubscribe = onSnapshot(userRef, (userSnap) => {
          const userData = userSnap.data();

          if (userData && userData['isOnline'] === true) {
            const friendObj: Friend = {
              uid: friendUid,
              request: 'accepted',
              ...userData,
            } as Friend;

            this.friendsMap.set(friendUid, friendObj);
          } else {
            this.friendsMap.delete(friendUid);
          }

          // 🔹 UI aktualisieren (einheitlich)
        });
        this.subscriptions.set(friendUid, unsubscribe);
      });
          this.onlineFriends = Array.from(this.friendsMap.values());

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
  const searchTerm = this.searchName.trim();

  // 1. Der Türsteher (Check vorab)
  if (searchTerm.length < 3) {
    this.searchResults = [];
    this.errorMessage = ''; // Fehler zurücksetzen
    return;
  }

  // 2. Der Sicherheitskäfig beginnt
  try {
    this.isLoading = true;
    this.errorMessage = ''; // Neuen Versuch starten

    const searchLower = searchTerm.toLowerCase();
    const userQuery = query(
      collection(this.firestore, 'users'),
      where('name_lowerCase', '>=', searchLower),
      where('name_lowerCase', '<=', searchLower + '\uf8ff'),
    );

    const querySnapshot = await getDocs(userQuery);
    
    // Lokale Variable zum Sammeln (verhindert Flackern in der UI)
    const tempResults: QuizUser[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as QuizUser;
      const userWithId = { ...data, uid: docSnap.id };

      // Sich selbst nicht in der Suche anzeigen
      if (userWithId.uid !== this.userId) {
        tempResults.push(userWithId);
      }
    });

    // Erst am Ende das globale Array austauschen
    this.searchResults = tempResults;

  } catch (error) {
    // 3. Die Notbremse (Falls Internet weg oder Firebase-Fehler)
    console.error('Suche fehlgeschlagen:', error);
    this.searchResults = [];
    this.errorMessage = 'Suche aktuell nicht möglich. Prüfe deine Verbindung.';
  } finally {
    // 4. Der Aufräumer (Passiert IMMER)
    this.isLoading = false;
  }
}
  async sendRequest(targetUid: string) {
    try {
      const requestDocRef = doc(
        this.firestore,
        `users/${targetUid}/friendRequests`,
        this.userId,
      );

      await setDoc(requestDocRef, {
        fromUid: this.userId,
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
    // 1. Batch initialisieren (Alles oder nichts-Transaktion)
    const batch = writeBatch(this.firestore);

    // 2. Pfade definieren
    const myFriendRef = doc(
      this.firestore,
      `users/${this.userId}/friends`,
      req.fromUid,
    );
    const theirFriendRef = doc(
      this.firestore,
      `users/${req.fromUid}/friends`,
      this.userId,
    );

    // Die erhaltene Anfrage
    const incomingRequestRef = doc(
      this.firestore,
      `users/${this.userId}/friendRequests`,
      req.requestId,
    );

    // NEU: Die potenziell von mir gesendete Gegenanfrage beim anderen
    const outgoingRequestRef = doc(
      this.firestore,
      `users/${req.fromUid}/friendRequests`,
      this.userId,
    );

    try {
      // 3. Operationen in den Batch laden
      batch.set(myFriendRef, { request: 'accepted', name: req.fromName });
      batch.set(theirFriendRef, { request: 'accepted', name: this.userName });
      batch.delete(incomingRequestRef);
      batch.delete(outgoingRequestRef); // Löscht die Gegenanfrage

      // 4. Batch verbindlich ausführen
      await batch.commit();
      alert('Freundschaft bestätigt!');

      // Optional: UI-Array manuell bereinigen, falls onSnapshot hier nicht greift
      this.incomingRequests = this.incomingRequests.filter(
        (r) => r.requestId !== req.requestId,
      );
    } catch (e) {
      console.error(
        'Kritischer Fehler bei der Datenbank-Transaktion. Dateninkonsistenz verhindert:',
        e,
      );
    }
  }

  async declineFriend(requestId: string) {
    const requestRef = doc(
      this.firestore,
      `users/${this.userId}/friendRequests`,
      requestId,
    );
    await deleteDoc(requestRef);
  }

  openListFriends() {
    if (this.onlineFriends.length > 0) {
      this.showfriendsList = true;
    }
  }

  closeFriendsList() {
    this.showfriendsList = false;
  }

  ngOnDestroy() {
this.friendsUnsubscribe?.();
this.subscriptions.forEach((unsub) => unsub());
this.subscriptions.clear();
  }
}
