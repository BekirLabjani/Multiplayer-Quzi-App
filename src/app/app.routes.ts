import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { QuizeComponent } from './quize/quize.component';
import { ResultComponent } from './result/result.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: '', redirectTo: '/login', pathMatch: "full"},
    {path: 'quiz', component: QuizeComponent},
    {path: 'result', component: ResultComponent},
    {path: 'sign', component: SignupComponent},
    {path: 'dashboard', component: DashboardComponent},
];
