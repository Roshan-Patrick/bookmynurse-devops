import { Component,Inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { LoginService } from '../service/login.service';
import { CommonModule } from '@angular/common';
import { FootersComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { CardModule, ButtonModule, GridModule, FormModule, ButtonGroupModule, UtilitiesModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { ToastrService } from 'ngx-toastr';
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-userlogin',
  standalone: true,
  imports: [RouterModule,ReactiveFormsModule,CommonModule,FootersComponent,HeaderComponent,CardModule,ButtonModule,GridModule,IconModule,
      FormModule,
      ButtonGroupModule,
      UtilitiesModule,],
  templateUrl: './userlogin.component.html',
  styleUrl: './userlogin.component.scss'
})
export class UserloginComponent {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLogin = true;
  submitted = false;
  loginFailed = false;
  username_msg = '';
  pwd_msg = '';
  isPasswordStrong: boolean = false;


  constructor(private loginService: LoginService, private router: Router, private fb: FormBuilder, private toastr: ToastrService,private titleService: Title,private metaService: Meta,private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Fix: Added email validator
      password: ['', [Validators.required, Validators.minLength(6)]] // Fix: Validators should be inside an array
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', [Validators.required, blockSpamNumber]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

      // ✅ Set page title
  this.titleService.setTitle('User Login | Book My Nurse | Nurse Booking Online');

  // ✅ Set meta description
  this.metaService.updateTag({
    name: 'description',
    content: 'Login to Book My Nurse to book professional home care nurses, manage your appointments, and access personalized healthcare services anytime.'
  });

  // ✅ Set meta keywords
  this.metaService.updateTag({
    name: 'keywords',
    content: 'Book My Nurse, User Login, Book a Nurse, Online Nurse Booking, Nursing Care, Home Care Treatments, Patient Care, Elder Care, Nursing Jobs, Hire a Nurse, Register, Nursing Careers'
  });

      // ✅ Add canonical tag
      const link: HTMLLinkElement = this.renderer.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', 'https://www.bookmynurse.com/user-login'); // 🔁 Update with the exact page URL
      this.renderer.appendChild(this.document.head, link);
   

  }

  get f() { return this.loginForm.controls; } // Correct form controls for login
  get r() { return this.registerForm.controls; } // Correct form controls for register

  onLoggedIn() {
    this.submitted = true;
  
    if (this.loginForm.invalid) {
      return;
    }
  
    this.loginService.clientLogin(this.loginForm.value).subscribe({
      next: (data: any) => {
        console.log("Success Response:", data);
  
        if (data.message === 'Invalid email') {
          this.loginFailed = true;
          this.username_msg = "Invalid Email";
          this.toastr.error("Invalid Email");
        } else if (data.message === 'Invalid password') {
          this.loginFailed = true;
          this.pwd_msg = "Invalid Password";
          this.toastr.error("Invalid Password");
        } else if (data.message === "Login successful") {
          sessionStorage.setItem("LoggedInUser", JSON.stringify(data));
          this.showThankYouPopup(); // Show the popup instead of redirecting
        }
      },
      error: (error) => {
        console.error("Login Error:", error);
        this.pwd_msg = "Network Error";
        this.toastr.error("Network Error");
      }
    });
  }

  showThankYouPopup() {
    const popup = document.getElementById('thankYouPopup');
    if (popup) {
      popup.style.display = 'flex'; // show popup
    }
  
    const closeBtn = document.getElementById('closePopupBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        popup!.style.display = 'none';
        this.router.navigate(['/index']); // navigate after closing
      });
    }
  }
  

  onRegister() {
    this.submitted = true;
    
    if (this.registerForm.invalid) {
      return;
    }

    this.loginService.clientRegistration(this.registerForm.value).subscribe({
      next: (data: any) => {
        console.log("Registration Success:", data);

        if (data.message === "Email already exists") {
          this.loginFailed = true;
          this.username_msg = "Email already exists";
          this.toastr.warning("Email already exists");
        } else if (data.message === "User registered successfully") {
          this.toastr.success("Registered successfully");
          this.loginForm.reset(
            {email:'',
            password:'' }
          );
          this.submitted=false
          this.isLogin = true; // Fix: Switch back to login on successful registration
          // this.toggleForm();

        }
      },
      error: (error) => {
        console.error("Registration Error:", error);
        this.pwd_msg = "Network Error";
        this.toastr.error("Network Error");
      }
    });
  }

  passwordStrength: string = '';

blockAlphabets(event: KeyboardEvent) {
  const pattern = /[0-9]/;
  if (!pattern.test(event.key)) {
    event.preventDefault();
  }
}

checkPasswordStrength() {
  const password = this.registerForm.get('password')?.value || '';
  if (password.length < 6) {
    this.passwordStrength = 'Password too short';
  } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    this.passwordStrength = 'Use mix of letters and numbers';
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    this.passwordStrength = 'Add special characters for a strong password';
  } else {
    this.passwordStrength = 'Strong password';
  }
}

onLogin() {
  this.submitted = true;
  this.checkPasswordStrength();

  if (this.loginForm.invalid || !this.isPasswordStrong) {
    return; // block login
  }

  // proceed with login logic
}


  toggleForm() {
    this.isLogin = !this.isLogin;
    this.submitted = false;
    this.username_msg = '';
    this.pwd_msg = '';
    console.log(this.isLogin)

    // Reset form values and validation errors
    if (this.isLogin) {
      this.loginForm.reset(
        {email:'',
          password:'' }
      );
    } else {
      this.registerForm.reset();
    }
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
