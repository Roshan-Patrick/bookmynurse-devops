import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DefaultLayoutComponent } from './containers';
import { Page404Component } from './views/pages/page404/page404.component';
import { Page500Component } from './views/pages/page500/page500.component';
import { LoginComponent } from './views/pages/login/login.component';
import { RegisterComponent } from './views/pages/register/register.component';
import { AppointmentComponent } from './views/appointment/appointment.component';
import { NurseRegistrationComponent } from './views/nurse-registration/nurse-registration.component';
import { NurseBookingComponent } from './views/pages/nurse-booking/nurse-booking.component';
import { ApprovedComponent } from './views/approved/approved.component';
import { RejectedComponent } from './views/rejected/rejected.component';

const routes: Routes = [
  
   {
        path: '',
        loadChildren: () =>
          import('./views/pages/pages.module').then((m) => m.PagesModule)
      },
      {
        path: '**',
        redirectTo: ''
      },
  // {
  //   path: 'home',
  //   component: DefaultLayoutComponent,
  //   data: {
  //     title: 'Home'
  //   },
  //   children: [
  //     {
  //       path: '',
  //       loadChildren: () =>
  //         import('./views/dashboard/dashboard.module').then((m) => m.DashboardModule)
  //     },
  //     {
  //       path: 'theme',
  //       loadChildren: () =>
  //         import('./views/theme/theme.module').then((m) => m.ThemeModule)
  //     },
  //     {
  //       path: 'base',
  //       loadChildren: () =>
  //         import('./views/base/base.module').then((m) => m.BaseModule)
  //     },
  //     {
  //       path: 'buttons',
  //       loadChildren: () =>
  //         import('./views/buttons/buttons.module').then((m) => m.ButtonsModule)
  //     },
  //     {
  //       path: 'forms',
  //       loadChildren: () =>
  //         import('./views/forms/forms.module').then((m) => m.CoreUIFormsModule)
  //     },
  //     {
  //       path: 'charts',
  //       loadChildren: () =>
  //         import('./views/charts/charts.module').then((m) => m.ChartsModule)
  //     },
  //     {
  //       path: 'icons',
  //       loadChildren: () =>
  //         import('./views/icons/icons.module').then((m) => m.IconsModule)
  //     },
  //     {
  //       path: 'notifications',
  //       loadChildren: () =>
  //         import('./views/notifications/notifications.module').then((m) => m.NotificationsModule)
  //     },
  //     {
  //       path: 'widgets',
  //       loadChildren: () =>
  //         import('./views/widgets/widgets.module').then((m) => m.WidgetsModule)
  //     },
  //     // {
  //     //   path: 'pages',
  //     //   loadChildren: () =>
  //     //     import('./views/pages/pages.module').then((m) => m.PagesModule)
  //     // },
  //     {
  //       path: 'appointment',
  //       component: AppointmentComponent
  //     },
  //     {
  //       path: 'nurseReg',
  //       component: NurseRegistrationComponent
  //     },
  //     {
  //       path: 'approved',
  //       component: ApprovedComponent,
  //       data: {
  //         title: 'Register Page'
  //       }
  //     },
  //     {
  //       path: 'rejected',
  //       component: RejectedComponent,
  //     }
  //   ]
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash:false,
      anchorScrolling: 'enabled',
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled'
      // relativeLinkResolution: 'legacy'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
