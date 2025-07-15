import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const isAuthorized = sessionStorage.getItem('msg') === 'Authorized';

    if (isAuthorized) {
      return true; // Allow access to the dashboard
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authorized
      return false;
    }
  }
}