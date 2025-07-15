import { Component,Inject } from '@angular/core';
import { FootersComponent } from "../footer/footer.component";
import { HeaderComponent } from "../header/header.component";
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT,CommonModule } from '@angular/common';



@Component({
  selector: 'app-termsandcondition',
  standalone: true,
  templateUrl: './termsandcondition.component.html',
  styleUrl: './termsandcondition.component.scss',
  imports: [FootersComponent, HeaderComponent,CommonModule]
})
export class TermsandconditionComponent {
  constructor(private titleService: Title, private metaService: Meta,private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
) {}
   ngOnInit(): void {
    this.titleService.setTitle('Terms and Conditions | Book My Nurse');

    this.metaService.updateTag({
      name: 'description',
      content: 'Read the Terms and Conditions for using Book My Nurse. Learn about user rights, service policies, and responsibilities when booking nursing care.'
    });

    this.metaService.updateTag({
      name: 'keywords',
      content: 'Book My Nurse Terms, Terms and Conditions, Service Policy, Nurse Booking Terms, Healthcare Service Terms, User Responsibilities, Platform Rules, Usage Agreement'
    });
        // ✅ Add canonical tag
   const link: HTMLLinkElement = this.renderer.createElement('link');
   link.setAttribute('rel', 'canonical');
   link.setAttribute('href', 'https://www.bookmynurse.com/terms-and-conditions'); // 🔁 Update with the exact page URL
   this.renderer.appendChild(this.document.head, link);
  }

  isTamil: boolean = false;

  toggleLanguage(event: any) {
    const selectedLanguage = event.target.value;
    this.isTamil = !this.isTamil;
  }
}
