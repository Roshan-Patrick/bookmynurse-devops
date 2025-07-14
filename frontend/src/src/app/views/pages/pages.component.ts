import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pages',
  template: `
   <h2>welcome</h2>
  <router-outlet></router-outlet>`,
  styleUrls: []
})
export class PagesComponent {

    constructor(private route: ActivatedRoute) {}
    ngAfterViewInit() {
        this.route.fragment.subscribe((fragment) => {
          if (fragment) {
            document.getElementById(fragment)?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
}
