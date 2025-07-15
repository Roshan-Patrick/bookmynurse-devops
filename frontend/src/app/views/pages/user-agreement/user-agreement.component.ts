import { Component,Inject } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FootersComponent } from "../footer/footer.component";
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT,CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-agreement',
  standalone: true,
  imports:[HeaderComponent,FootersComponent,CommonModule],
  templateUrl: './user-agreement.component.html',
  styleUrl: './user-agreement.component.scss'
})
export class UserAgreementComponent {
  constructor(private titleService: Title, private metaService: Meta,private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
) {}
  ngOnInit(): void {
   this.titleService.setTitle('User Agreement | Terms of Service - Book My Nurse');

   this.metaService.updateTag({
     name: 'description',
     content: 'Learn about the rules and guidelines that govern your use of Book My Nurse’s services. Read our full User Agreement and terms of use.'
   });

   this.metaService.updateTag({
     name: 'keywords',
     content: 'book my nurse user agreement, terms of service, nurse booking terms, user responsibilities, healthcare platform terms, patient agreement, privacy policy, service terms'
   });
     // ✅ Add canonical tag
     const link: HTMLLinkElement = this.renderer.createElement('link');
     link.setAttribute('rel', 'canonical');
     link.setAttribute('href', 'https://www.bookmynurse.com/user-agreement'); // 🔁 Update with the exact page URL
     this.renderer.appendChild(this.document.head, link);
  
 }
isTamil: boolean = false;

  toggleLanguage(event: any) {
    const selectedLanguage = event.target.value;
    this.isTamil = !this.isTamil;
  }
}
