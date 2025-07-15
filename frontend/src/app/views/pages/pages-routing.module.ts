import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Page404Component } from "./page404/page404.component";
import { Page500Component } from "./page500/page500.component";
import { LoginComponent } from "./login/login.component";
import { RegisterComponent } from "./register/register.component";
import { UserloginComponent } from "./userlogin/userlogin.component";
import { NurseBookingComponent } from "./nurse-booking/nurse-booking.component";
import { PagesComponent } from "./pages.component";
import { TestComponent } from "./test/test.component";
import { DefaultLayoutComponent } from "../../containers";
import { AuthGuard } from "../guards/auth.guard";
import { UserAgreementComponent } from "../pages/user-agreement/user-agreement.component"
import { PrivacypolicyComponent } from "../pages/privacypolicy/privacypolicy.component"
import { TermsandconditionComponent } from "../pages/termsandcondition/termsandcondition.component"

const routes: Routes = [
  {
    path: "",
    component: Page404Component,
    data: {
      title: "Page 404",
    },
  },
  {
    path: "home",
    component: DefaultLayoutComponent,
    data: {
      title: "Home",
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: "full"
      },
      {
        path: "dashboard",
        loadChildren: () =>
          import("../../views/dashboard/dashboard.module").then(
            (m) => m.DashboardModule
          ), 
          // canActivate: [AuthGuard]
      },
      {
        path: "appointment",
        loadComponent: () => import("../../views/appointment/appointment.component").then(
          (c) => c.AppointmentComponent
        ), canActivate: [AuthGuard]
      },
      {
        path: "nursereg",
        loadComponent: () => import("../../views/nurse-registration/nurse-registration.component").then(
          (c) => c.NurseRegistrationComponent
        ), canActivate: [AuthGuard]
      },
      {
        path: "approve",
        loadComponent: () => import("../../views/approved/approved.component").then(
          (c) => c.ApprovedComponent
        ), 
        // canActivate: [AuthGuard]
      },
      {
        path: "reject",
        loadComponent: () => import("../../views/rejected/rejected.component").then(
          (c) => c.RejectedComponent
        ), canActivate: [AuthGuard]
      },
      {
        path: "history",
        loadComponent: () => import("../../views/history/history.component").then(
          (c) => c.HistoryComponent
        ),
        canActivate: [AuthGuard]
      },
    ],
  },
  {
    path: "500",
    component: Page500Component,
    data: {
      title: "Page 500",
    },
  },
  {
    path: "bmn-admin",
    component: LoginComponent,
    data: {
      title: "BMN Admin",
    },
  },
  {
    path: "nurses-registration",
    component: RegisterComponent,
    data: {
      title: "Nurses Registration",
    },
  },
  {
    path: "nurse-booking",
    component: NurseBookingComponent,
    data: {
      title: "Nurse Booking",
    },
  },
  {
    path: "user-login",
    component: UserloginComponent,
    data: {
      title: "User Login",
    },
  },
  {
    path: "user-agreement",
    component: UserAgreementComponent,
    data: {
      title: "User Agreement",
    },
  },

  {
    path: "privacy-policy",
    component: PrivacypolicyComponent,
    data: {
      title: "Privacy Policy",
    },
  },

  {
    path: "terms-and-condition",
    component: TermsandconditionComponent,
    data: {
      title: "TermsandCondition",
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule { }
