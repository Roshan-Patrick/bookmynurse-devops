import { Component, HostListener ,Inject,AfterViewChecked} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NurseRegService } from '../service/nurse-reg.service';
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-page404',
  templateUrl: './page404.component.html',
  styleUrls: ['./page404.component.scss']
})
export class Page404Component {

  bookingForm: any;
  users: any;

  constructor(private fb: FormBuilder,private nurseService:NurseRegService, private router: Router,private titleService: Title,private metaService: Meta,  private renderer: Renderer2,
      @Inject(DOCUMENT) private document: Document) {}
  // @HostListener('window:scroll', ['$event'])

  hasInitialized = false;

  ngAfterViewChecked() {
    if (this.users?.length && !this.hasInitialized) {
      this.hasInitialized = true;
      this.initSliderAnimation();
    }
  }

  initSliderAnimation() {
    const slider = document.querySelector('.doctor-slider') as HTMLElement;
    if (slider) {
      slider.style.animation = 'scrollLoop 100s linear infinite';
    }
  }
  

  ngOnInit(): void {

    this.getAllApproved();
    if(!this.bookingForm){
    this.bookingForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, blockSpamNumber]],
      nurseType: ['', Validators.required],
      location: ['', Validators.required],
      services: ['', Validators.required],
      preferences: ['', Validators.required],
      agreement: [false, Validators.requiredTrue]
    });}
    var st = window.pageYOffset;
    // console.log(st);
    var navbar = document.getElementsByTagName('nav')[0];

  //  console.log(navbar);
  //  if(st > 95){
  //   navbar.classList.add('header-pinned')
  //  }else{
  //   navbar.classList.remove('header-pinned');
  //  }

  // const modal = document.getElementById('successModalss');
  // if (modal) modal.classList.add('active');
  this.titleService.setTitle('Book My Nurse | Home Nursing Services | Book a Nurse Online | Nursing Care');

    this.metaService.addTags([
      { name: 'description', content: 'Book My Nurse provides Professional Home Nursing services. Easily book a skilled nurse online for personalized, quality care in the comfort of your home.' },
      { name: 'keywords', content: 'Book My Nurse, Home Nursing Services, Book a Nurse Online, Nursing Care at Home, Post-Operative Care, Home Care Treatments, Professional Home Nurses, Elderly Care, Tracheostomy, Stroke, Cancer, and Bedridden Patient Care' },
      { name: 'robots', content: 'index,follow' }
    ]);

    // ✅ Add canonical tag
   const link: HTMLLinkElement = this.renderer.createElement('link');
   link.setAttribute('rel', 'canonical');
   link.setAttribute('href', 'https://www.bookmynurse.com'); // 🔁 Update with the exact page URL
   this.renderer.appendChild(this.document.head, link);

  }
  
  onSubmit(): void {
    if (this.bookingForm.valid) {
      // Create a copy of the form value, excluding the `agreement` field
      const formData = { ...this.bookingForm.value };
      delete formData.agreement;

      const enqData = this.getServiceAbbreviation(formData.services)
      const enquiryNumber = `${enqData}-${Date.now()}`;
      formData.enquiryno = enquiryNumber;
  
      console.log(formData);
      this.nurseService
        .nurseRegistration(formData) 
        .subscribe({
          next: (res) => {
            console.log('Success:', res.data.insertId);
            sessionStorage.setItem("clientID",res.data.insertId)
            const modal = document.getElementById('successModalss');
            if (modal) modal.classList.add('active');
            this.bookingForm.reset();
          },
          error: (err) => console.error('Error:', err),
        });
    }
  }

  redirectToNurse() {
    this.router.navigate(['/nurse-booking']); 
  
    }

    get f(){
      return this.bookingForm.controls;
    }

    getServiceAbbreviation(service: string) {
      const abbreviations: Record<string, string> = {
          "Elder Care": "ED",
          "Bedridden Patient Care": "BP",
          "Stroke Patient Care": "SP",
          "Tracheostomy Patient Care": "TP",
          "Post Operative Care": "PO",
          "ICU Setup at Home": "ICU",
          "Physiotherapy at Home": "PH",
          "Travel Nurse": "TN",
          "Doctor's Visit at Home": "DV"
      };
  
      return abbreviations[service] || "UN"; 
    }

    getAllApproved() {
      this.nurseService.nurseRegistered('Approved').subscribe((res:any)=>{
        // console.log(res)
        this.users = res.data.map((user: any) => ({
          ...user,
          photoUrl: `https://app.bookmynurse.com/api/${user.file_path}`, 
          // photoUrl: `http://localhost:3000/${user.file_path}`,
        }));
      })
    }

    ngAfterViewInit() {
  const chatNowBtn = document.getElementById("chatNowBtn");
  const floatingBtns = document.getElementById("floatingBtns");
  const referralBtn = document.getElementById("referralBtn");
  const modalRel = document.getElementById("modal-rel");
  const closeBtnRel = document.getElementById("closeBtn-rel");
  const referralForm = document.getElementById("referralForm") as HTMLFormElement;

  const thankYouPopup = document.getElementById("thankYouPopup");
  const closePopupBtn = document.getElementById("closePopupBtn");

  // Toggle floating chat buttons
  chatNowBtn?.addEventListener("click", () => {
    floatingBtns!.style.display = (floatingBtns!.style.display === "flex") ? "none" : "flex";
  });

  // Show referral modal
  referralBtn?.addEventListener("click", () => {
    modalRel!.style.display = "flex";
  });

  // Close modal on (×)
  closeBtnRel?.addEventListener("click", () => {
    modalRel!.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === modalRel) {
      modalRel!.style.display = "none";
    }
  });

  // Handle form submission with validation
  referralForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    // If form is not valid, show browser's validation UI
    if (!referralForm.checkValidity()) {
      referralForm.reportValidity(); // This will highlight invalid fields
      return;
    }

    // Proceed with submission
    fetch(referralForm.action, {
      method: referralForm.method,
      body: new FormData(referralForm),
    })
      .then(response => response.text())
      .then(() => {
        referralForm.reset();
        modalRel!.style.display = "none";
        thankYouPopup!.style.display = "flex";
      })
      .catch(error => console.error("Error:", error));
  });

  // Close Thank You popup
  closePopupBtn?.addEventListener("click", () => {
    thankYouPopup!.style.display = "none";
  });
}
}


  function blockSpamNumber(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  if (!/^\d{10}$/.test(value)) return { spamNumber: true };
  if (/^(\d)\1{9}$/.test(value)) return { spamNumber: true };

  const blocked = ['1234567890', '9876543210', '0123456789', '9999999999'];
  if (blocked.includes(value)) return { spamNumber: true };

  if (!/^[6-9]/.test(value)) return { spamNumber: true };

  return null;
}
