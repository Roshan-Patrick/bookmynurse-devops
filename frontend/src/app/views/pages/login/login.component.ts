import { Component ,Inject} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { LoginService } from '../service/login.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  containerClass = 'sign-in';
  loginForm: any;
  submitted= false;
  loginFailed=false;
  username_msg: any;
  pwd_msg: any;

  error$: Observable<string> | undefined;
  primaryColor = '#28a745'; // Customize
  secondaryColor = '#343a40'; // Customize
  headingFontSize = 44;
  labelFontSize = 44;
  useLightTheme = true; // Set initial theme


  constructor(private loginService:LoginService,private router: Router,private fb: FormBuilder,private toastr: ToastrService,private titleService: Title,private metaService: Meta,private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
) { }
  ngOnInit() {

    // sessionStorage.clear(); 

    // if (!sessionStorage.getItem('msg')) {
    //   this.router.navigate(['/login']);
    // }
    

    setTimeout(() => {
      this.containerClass = 'sign-in';
    }, 200);


    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });


    // ✅ Set page title
  this.titleService.setTitle('Book My Nurse | Admin Dashboard | Nursing Career');

  // ✅ Set meta description
  this.metaService.updateTag({
    name: 'description',
    content: 'Book My Nurse lets you book certified nurses for home care, elderly support, and post-surgery recovery - reliable care when you need it most.'
  });

  // ✅ Set meta keywords
  this.metaService.updateTag({
    name: 'keywords',
    content: 'Book My Nurse, Nurse Booking, Healthcare Management, Nurse Scheduling, Patient Care, Manage Nurses, Medical Staff Management, Nurse Service Platform, Elder Care, Nursing Careers, Nurse Jobs'
  });

   // ✅ Add canonical tag
   const link: HTMLLinkElement = this.renderer.createElement('link');
   link.setAttribute('rel', 'canonical');
   link.setAttribute('href', 'https://www.bookmynurse.com/nurses-register'); // 🔁 Update with the exact page URL
   this.renderer.appendChild(this.document.head, link);


  }

  get f() {
    return this.loginForm.controls;
  }
  toggleForm(): void {
    // Toggle between 'sign-in' and 'sign-up'
    this.containerClass = this.containerClass === 'sign-in' ? 'sign-up' : 'sign-in';
  }

  // onLoggedIn() {   
  //   if(this.loginForm.valid){
  //      this.loginService
  //        .adminLogin(this.loginForm.value)
  //        .subscribe((result) => {
  //          if (result.msg === "Authorized") {
  //           sessionStorage.setItem('msg', 'Authorized');
  //            this.router.navigate(["home/dashboard"]);
  //          } else {
  //            this.loginFailed=true;
  //            this.username_msg = "Invalid User Name";
  //            this.submitted= true
  //          }
  //        });}
  //       else{
  //        this.submitted= true
  //       } 
  //    }


  onLoggedIn() {
    this.submitted = true;
  
    if (this.loginForm.invalid) {
      return;
    }
  
    this.loginService.adminLogin(this.loginForm.value).subscribe({
      next: (data: any) => {
        console.log("Success Response:", data);
  
        if (data.msg === 'Invalid Username') {
          this.loginFailed = true;
          this.username_msg = "Invalid Username";
          this.toastr.error("Invalid Username");
        }else if(data.msg === 'Invalid password') {
          this.loginFailed = true;
          this.username_msg = "Invalid Password";
          this.toastr.error("Invalid Password");
        }
         else if(data.msg === "Authorized") {
          
          sessionStorage.setItem('msg', 'Authorized');
          this.router.navigate(['home/dashboard']);
          this.toastr.success("Login successfully");
          
        }
      },
      error: (error) => {
        console.error("Login Error:", error);
          this.pwd_msg = "Network Error";
          this.toastr.error("Network Error");
        
      }
    });
  }

}
