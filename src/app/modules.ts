export interface QuizUser {
  uid: string;
  email: string;
  name: string;
  level: number;
  coins: number;
  winRate?: string; // Das Fragezeichen bedeutet: Optional
  rank?: string;
  name_lowerCase: string
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

