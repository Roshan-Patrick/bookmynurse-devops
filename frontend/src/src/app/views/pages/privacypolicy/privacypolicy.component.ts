import { Component,Inject } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FootersComponent } from "../footer/footer.component";
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT,CommonModule } from '@angular/common';



@Component({
  selector: 'app-privacypolicy',
  standalone: true,
  imports:[HeaderComponent,FootersComponent,CommonModule],
  templateUrl: './privacypolicy.component.html',
  styleUrl: './privacypolicy.component.scss'
})
export class PrivacypolicyComponent {

  constructor(private titleService: Title, private metaService: Meta,private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
) {}
  ngOnInit(): void {
   this.titleService.setTitle('Privacy Policy | Data Protection & Security - Book My Nurse');

   this.metaService.updateTag({
     name: 'description',
     content: 'Learn how Book My Nurse collects, uses, and protects your personal data. Read our Privacy Policy for full details on security and data handling practices.'
   });

   this.metaService.updateTag({
     name: 'keywords',
     content: 'book my nurse privacy policy, data protection, user data privacy, healthcare data security, personal information policy, patient data safety, privacy terms'
   });
       // ✅ Add canonical tag
       const link: HTMLLinkElement = this.renderer.createElement('link');
       link.setAttribute('rel', 'canonical');
       link.setAttribute('href', 'https://www.bookmynurse.com/privacy-policy'); // 🔁 Update with the exact page URL
       this.renderer.appendChild(this.document.head, link);
    
 }

 isTamil: boolean = false;

 toggleLanguage(event: any) {
    const selectedLanguage = event.target.value;
    this.isTamil = !this.isTamil;
  }
}
