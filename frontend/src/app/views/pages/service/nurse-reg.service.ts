import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NurseRegService {

  private baseUrl = environment.APIEndpoint;
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient, private router: Router) { }

  nurseRegistration(register: any): Observable<any> {
    return this.http.post(this.baseUrl + '/nursing/bookings', register, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );
  }
  getAllRegistered(approvalStatus?: string): Observable<any> {

    let url = `${this.baseUrl}/nursing/getBookings`;
    if (approvalStatus) {
      url += `?approval_status=${approvalStatus}`;
    }
    return this.http.get(url, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );
  }

  updateBooking(data: any): Observable<any> {
    return this.http.put(this.baseUrl + '/nursing/updateBooking', data, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );
  }

  deleteBooking(id: any): Observable<any> {
    return this.http.delete(this.baseUrl + `/nursing/deleteBookings/${id}`, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );
  }

  updateNurseApprovalStatus(id: number, status: 'Ongoing' | 'Complete'): Observable<any> {
    return this.http.put(this.baseUrl + '/nursing/updateNurseApproval', { id, status })
      .pipe(
        catchError(this.errorHandler)
      );

  }

  nurseRegistrationDetails(formData: FormData): Observable<any> {
    return this.http.post(this.baseUrl + '/register/registerNurse', formData)
      .pipe(
        catchError(this.errorHandler)
      );
  }

  nurseRegistered(approvalStatus?: string): Observable<any> {

    let url = `${this.baseUrl}/register/registrations`;
    if (approvalStatus) {
      url += `?approval_status=${approvalStatus}`;
    }
    // console.log(url)
    return this.http.get(url, { headers: this.headers })
      .pipe(
        catchError(this.errorHandler)
      );
  }


  updateApprovalStatus(id: number, status: 'Approved' | 'Rejected'): Observable<any> {
    return this.http.put(this.baseUrl + '/register/updateApproval', { id, status })
      .pipe(
        catchError(this.errorHandler)
      );

  }



  updateAvailableStatus(id: number, status: 'Available' | 'Busy'): Observable<any> {
    return this.http.put(this.baseUrl + '/register/updateAvailable', { id, status })
      .pipe(
        catchError(this.errorHandler)
      );

  }

  setChargesType(id: string, chargesType: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/register/set-charges-type/${id}`, { chargesType }, { headers: this.headers })
      .pipe(catchError(this.errorHandler));
  }


  // ✅ Revert approval status to "Pending"
  revertApprovalStatus(id: number): Observable<any> {
    return this.http.put(this.baseUrl + '/register/revertApproval', { id })
      .pipe(
        catchError(this.errorHandler)
      );
  }

  editNurse(id: any, formData: any): Observable<any> {
    return this.http.put(this.baseUrl + `/register/editNurse/${id}`, formData).pipe(
      catchError(this.errorHandler)
    );
  }

  setNurseCharges(id: string, charges: number, charges_type: string) {
    return this.http.patch(this.baseUrl + `/register/${id}/charges`, { charges, charges_type });
  }

  addNurseDetails(nurse: any) {
    return this.http.patch(this.baseUrl + `/register/update-nurse`, nurse);
  }

  getAllNurseDetails(id: number) {
    return this.http.get(this.baseUrl + `/register/nurse-details/${id}`);
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
