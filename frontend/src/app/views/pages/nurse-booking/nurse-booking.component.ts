import { Component, ElementRef, QueryList, Renderer2, ViewChild, ViewChildren,Inject } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FootersComponent } from "../footer/footer.component";
import { Router } from '@angular/router';
import { NurseRegService } from '../service/nurse-reg.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

declare var $: any;

@Component({
  selector: 'app-nurse-booking',
  standalone: true,
  imports: [HeaderComponent, FootersComponent,FormsModule,CommonModule],
  templateUrl: './nurse-booking.component.html',
  styleUrl: './nurse-booking.component.scss'
})
export class NurseBookingComponent {
  @ViewChildren('bookbtn') bookButton!: QueryList<ElementRef> ; 

  users: any[] = [];
  filteredNurses: any[] = [];
  searchText: string = '';

  isModalOpen: boolean = false;
  selectedUser: any = null;
  showTooltip: boolean = false;
  activeTooltipIndex: number | null = null;



  constructor(private renderer:Renderer2,private router: Router,private nurseService:NurseRegService,private titleService: Title,private metaService: Meta,
    private http: HttpClient,@Inject(DOCUMENT) private document: Document
){}

clientId: number = 0;

  ngOnInit() {
    this.clientId = parseInt(localStorage.getItem('clientId') || '0');
    this.getAllApproved();

         // ✅ Set page title
  this.titleService.setTitle('Book a Nurse Online | Certified Home Care & Medical Support');

  // ✅ Set meta description
  this.metaService.updateTag({
    name: 'description',
    content: 'Easily book certified nurses for home care, elderly assistance, or medical support. Trusted, professional nursing services at your doorstep.'
  });

  // ✅ Set meta keywords
  this.metaService.updateTag({
    name: 'keywords',
    content: 'Nurse Booking, Home Care Nurse, Hire a Nurse, Book Nurse Online, Certified Nurse Services, Elderly Care, Medical Nurse at Home, Nursing Support, In-home Nurse, Post-Surgery Care'
  });


      // ✅ Add canonical tag
      const link: HTMLLinkElement = this.renderer.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', 'https://www.bookmynurse.com/nurse-booking'); // 🔁 Update with the exact page URL
      this.renderer.appendChild(this.document.head, link);
   
  }

  handleBookClick(user: any) {
    this.bookNurse(user);
  }
  
  bookNurse(user: any) {
    const bookingDetails = {
      bookingId: sessionStorage.getItem("clientID"),
      nurseId: user.id,
    };

    console.log(bookingDetails);

    this.nurseService.addNurseDetails(bookingDetails).subscribe(res =>{
      this.router.navigate(['/user-login']);
    })
  
    // this.http.post('https://app.bookmynurse.com/api/book-nurse', bookingDetails)
    //   .subscribe(
    //     () => {
    //       alert('Booking Successful');
    //       this.loginRoute();  // Redirect only after successful booking
    //     },
    //     (error) => {
    //       alert('Booking failed. Please try again.');
    //       console.error(error);
    //     }
    //   );
  }
  
  loginRoute() {
    this.router.navigate(['/user-login']);
  }
  
  

  // ngAfterViewInit(): void {
  //   console.log(this.bookButton)
  //   if (this.bookButton) {
  //     this.bookButton.forEach((buttons,index)=>{
  //       this.renderer.listen(buttons.nativeElement, "click", () => {
  //         alert("Your request has been forwarded to BookMyNurse team. Our team will get back to you.");
  //         this.router.navigate(['/index']); 
  //       });
  //     })
      
     
  //   }

  //   setTimeout(() => {
  //     $('.doctor-slider').slick({
  //       slidesToShow: 3,
  //       slidesToScroll: 1,
  //       arrows: true,
  //       dots: false,
  //       autoplay: true,
  //       autoplaySpeed: 2000,
  //       prevArrow: '<button type="button" class="slick-prev">Previous</button>',
  //       nextArrow: '<button type="button" class="slick-next">Next</button>',
  //     });
  //   }, 500);
  // }

  // ngOnDestroy() {
  //   $('.doctor-slider').slick('unslick'); // Destroy slider when component is removed
  // }
  


getAllApproved() {
  this.nurseService.nurseRegistered('Approved').subscribe((res: any) => {
    console.log(res);
    this.users = res.data
      .filter((user: any) => user.availability !== 'Pending') 
      .map((user: any) => ({
        ...user,
        photoUrl: `${environment.APIEndpoint}/uploads/${user.file_path.replace(/\\/g, '/').replace(/^uploads\//, '')}`,
        charges: user.charges || null,
        languages: Array.isArray(user.languages) ? user.languages : [],
        serviceopt: Array.isArray(user.serviceopt) ? user.serviceopt : [],
        from_time: user.from_time || 'N/A',
        to_time: user.to_time || 'N/A',
      }));

    this.filteredNurses = [...this.users]; // Set initial filtered data
  });
}


  // Age Calculation from DOB
  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  formatChargesType(value: string): string {
  if (!value) return '';
  // Split by underscore, capitalize each word, and join with space
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


  // Search Function
  onSearchInput() {
    this.filteredNurses = this.users.filter(nurse => {
      return (
      
        nurse.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        nurse.specialization.toLowerCase().includes(this.searchText.toLowerCase()) ||
        nurse.address.toLowerCase().includes(this.searchText.toLowerCase()) ||
        nurse.education.toLowerCase().includes(this.searchText.toLowerCase()) 

      );
    });
  }



  openModal(user: any) {
    this.selectedUser = user;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedUser = null;
  }

  // loginRoute(){
  //   this.router.navigate(['/user-login']);
  // }

  }