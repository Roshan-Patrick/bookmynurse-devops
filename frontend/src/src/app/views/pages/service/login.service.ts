import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private baseUrl = environment.APIEndpoint;
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient, private router: Router) { }

  adminLogin(register: any): Observable<any> {
    return this.http.post(this.baseUrl + 'auth/login', register, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );

  }

  

  clientLogin(register: any): Observable<any> {
    return this.http.post(this.baseUrl + 'clientauth/login', register, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );   

  }

  clientRegistration(register: any): Observable<any> {
    return this.http.post(this.baseUrl + 'clientauth/register', register, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );   

  }

  



  errorHandler(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.msg;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }



}
