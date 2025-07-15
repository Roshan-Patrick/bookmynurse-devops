import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from './icons/icon-subset';
declare var $: any;

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'BookMyNurse';

  constructor(private router: Router, private titleService: Title,  private iconSetService: IconSetService) {
    titleService.setTitle(this.title);
    // iconSet singleton
    iconSetService.icons = { ...iconSubset };
  }

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        setTimeout(() => this.initSlider(), 1000); // Reinitialize slider on route change
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initSlider(), 2000); // Ensure slider initializes after view is loaded
  }

  initSlider() {
    const slider = $('.doctor-slider');
    if (!slider.hasClass('slick-initialized')) {
      slider.slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        autoplay: true,
        autoplaySpeed: 5000,
        prevArrow: '<button type="button" class="slick-prev"><i class="fas fa-chevron-left"></i></button>',
        nextArrow: '<button type="button" class="slick-next"><i class="fas fa-chevron-right"></i></button>',
      });
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    let navbar = document.getElementsByTagName('nav')[0];
    if (navbar) {
      if (window.scrollY > 95) {
        navbar.classList.add('header-pinned');
      } else {
        navbar.classList.remove('header-pinned');
      }
    }
  }
}
