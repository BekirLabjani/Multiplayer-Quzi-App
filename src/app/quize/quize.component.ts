import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore';
import { QuizQuestion } from '../modules';
import { Route, Router } from '@angular/router';
@Component({
  selector: 'app-quize',
  standalone: true,
  imports: [],
  templateUrl: './quize.component.html',
  styleUrl: './quize.component.scss',
})
export class QuizeComponent implements OnInit {
  avatar: string = '';
  myLvl: number = 0;
  question: string = '';
  answors = [];
  questions: any = [];
  combo: number = 0;
  myPoints: number = 0;
  gameRoom: string = '';
  friends = [];
  currentQuestionIndex: number = 0;
  timeLeft: number = 20;
  timerInterval: any;
  uid: string = '';

  constructor(
    private firestore: Firestore,
    public auth: Auth,
    private router: Router,
  ) {}

  async ngOnInit() {
    const querySnapshot = await getDocs(
      collection(this.firestore, 'questions'),
    );
    querySnapshot.forEach((doc) => {
      this.questions.push(doc.data());
    });
    if (this.auth.currentUser) {
      this.uid = this.auth.currentUser.uid;
    } else {
      console.error('Kein Zugriff: User ist nicht eingeloggt!');
      this.router.navigate(['/login']);
    }
    this.schuffel();

    console.log(this.questions);
    // this.startTimer();
  }

  schuffel() {
    this.questions = this.questions.slice(0, 15);
    this.questions = this.shuffleArray(this.questions);
    this.questions.forEach((question: QuizQuestion) => {
      question.options = this.shuffleArray(question.options);
    });
  }

  shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Zufallsposition 'j' auswürfeln
      const temp = array[i]; // Aktuelles Element 'i' kurz zwischenspeichern
      array[i] = array[j]; // Element 'j' auf den Platz von 'i' schieben
      array[j] = temp; // Zwischengespeichertes Element auf Platz 'j' setzen
    }
    return array;
  }

  answers(selectedAnswer: string) {
    clearInterval(this.timerInterval);
    if (selectedAnswer === this.questions[this.currentQuestionIndex].answer) {
      console.log('Richtig!');
      this.myPoints += 20;
    } else {
      this.myPoints -= 10;
    }

    const playerDocRef = doc(
      this.firestore,
      `games/Room123/players/${this.uid}`,
    );

    updateDoc(playerDocRef, {
      currenScorre: this.myPoints,
      status: 'ready',
    });
    // this.startTimer();
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex === 15) {
      console.log('Quiz beendet! Wechsle zu Result...');
    }
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timeLeft = 20;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.timerInterval); // Motor aus!
        console.log('Zeit abgelaufen!');
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex === 15) {
          console.log('Quiz beendet! Wechsel zur Result-Seite...');
        } else {
          this.startTimer();
        }
      }
    }, 1000);
  }

  get strokeOffset() {
    return 87.96 - (87.96 * this.timeLeft) / 20;
  }
}
