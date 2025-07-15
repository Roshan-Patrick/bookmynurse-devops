import { Component, ElementRef, HostListener, ViewChild,Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NurseRegService } from '../service/nurse-reg.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {

  nurseRegistrationForm: FormGroup | any;
  photoFileValid = false;
  uploadedFile: File | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
  imageValidationError = '';


  languageOptions = [
    { name: 'English', value: 'English' },
    { name: 'Tamil', value: 'Tamil' },
    { name: 'Hindi', value: 'Hindi' },
    { name: 'Malayalam', value: 'Malayalam' },
    { name: 'Telugu', value: 'Telugu' },
    { name: 'Kannada', value: 'Kannada' },
    { name: 'Urdu', value: 'Urdu' }
  ];
  serviceOptions = [
    { name: "24 Hours", value: "24 Hours" },
    { name: "12 Hours", value: "12 Hours" },
    { name: "8 Hours", value: "8 Hours" },
    { name: "4 Hours", value: "4 Hours" },
    { name: "Care", value: "Care" }
  ];
  selectedLanguages: string[] = [];
  selectedUser : string[] = [];
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  dropdownOpen = false;
  @ViewChild('serviceDropdownContainer') serviceDropdownContainer!: ElementRef;
  serviceDropdownOpen = false;
  constructor(private fb: FormBuilder,private nurseService:NurseRegService,private toastr: ToastrService,private router: Router,private titleService: Title,private metaService: Meta,  private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.nurseRegistrationForm = this.fb.group({
      name: ['', Validators.required],
      // aadhaar: [ '',[Validators.required,Validators.minLength(10),Validators.maxLength(12),Validators.pattern('^[0-9]*$'),],],
      mobile: ['', [Validators.required, blockSpamNumber]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      education: ['', Validators.required],
      experience: ['',[Validators.required,Validators.pattern('^[0-9]*$'),Validators.maxLength(2),],],
      languages: [[], Validators.required],
      serviceopt:['', Validators.required],
      specialization: ['', Validators.required],
      address: ['', Validators.required],
      'base_location': [ '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]
      ],
      // fromTime: ['', Validators.required],  // ✅ Added field for From Time
      // toTime: ['', Validators.required],    // ✅ Added field for To Time
      photo: ['', Validators.required],
      declaration: [false, Validators.requiredTrue], // Checkbox validation
    });

    
    // ✅ Set page title
  this.titleService.setTitle('Nurses Registration | Book My Nurse | Register Here');

  // ✅ Set meta description
  this.metaService.updateTag({
    name: 'description',
    content: 'Join thousands of registered nurses finding jobs online. Create your nursing job profile, upload your resume, and apply to top healthcare employers.'
  });

  // ✅ Set meta keywords
  this.metaService.updateTag({
    name: 'keywords',
    content: 'Book My Nurse, Nurse Registration, Nursing Jobs, Nursing Careers, Nurse Care, Book a Nurse, Nurse Booking Online, Homecare Treatment, Elder Care at Home, Nursing Care'
  });

   // ✅ Add canonical tag
   const link: HTMLLinkElement = this.renderer.createElement('link');
   link.setAttribute('rel', 'canonical');
   link.setAttribute('href', 'https://www.bookmynurse.com/nurses-registration'); // 🔁 Update with the exact page URL
   this.renderer.appendChild(this.document.head, link);


    // const modal = document.getElementById('successModals');
    // if (modal) modal.classList.add('active');
  }

  // onLanguageChange(event: Event) {
  //   console.log(event.target)
  //   const selectElement = event.target as HTMLSelectElement;
  //   console.log(this.nurseRegistrationForm.value)

    
    // console.log(selectElement)
    // const selectedOptions = Array.from(selectElement.selectedOptions).map(
    //   (option) => option.value
    // );
    // this.nurseRegistrationForm.get('languages')?.setValue(selectedOptions);
    // console.log(this.nurseRegistrationForm.value)
  // }

  toggleSelection(language: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedLanguages.push(language);
    } else {
      this.selectedLanguages = this.selectedLanguages.filter(
        (lang) => lang !== language
      );
    }
     this.nurseRegistrationForm.get('languages')?.setValue(this.selectedLanguages);
      console.log('Selected Languages:', this.selectedLanguages);
  }

  toggleServiceSelection(value: string, event: any) {
    if (event.target.checked) {
      this.selectedUser.push(value);
    } else {
      this.selectedUser = this.selectedUser.filter(
        (opt) => opt !== value);
    }
    this.nurseRegistrationForm.get('serviceopt')?.setValue(this.selectedUser);
    console.log('Selected Languages:', this.selectedUser);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    const control = this.nurseRegistrationForm.get('languages');
    console.log(control);
    if(control && !this.dropdownOpen){
      control.markAsTouched();
      console.log(control);
    }
  }
  toggleServiceDropdown() {
    this.serviceDropdownOpen = !this.serviceDropdownOpen;
    const control = this.nurseRegistrationForm.get('serviceopt');
    console.log(control);
    if(control && !this.serviceDropdownOpen){
      control.markAsTouched();
      console.log(control);
    }
  }

  @HostListener('document:click', ['$event'])
onClickOutside(event: Event) {
  // Close language dropdown if the click is outside
  if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
    console.log("Closing Language Dropdown", this.dropdownOpen);
    this.dropdownOpen = false;
  }

  // Close service options dropdown if the click is outside
  if (this.serviceDropdownContainer && !this.serviceDropdownContainer.nativeElement.contains(event.target)) {
    console.log("Closing Service Options Dropdown", this.serviceDropdownOpen);
    this.serviceDropdownOpen = false;
  }
}

    

    // @HostListener('document:click', ['$event'])
    // onClickOutsideService(event: Event) {
    //   if (this.serviceDropdownContainer && !this.serviceDropdownContainer.nativeElement.contains(event.target)) {
    //     console.log("Selection Contaimner",this.serviceDropdownOpen)
    //     this.serviceDropdownOpen = false;
    //   }
    // }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files[0]) {
      const file = input.files[0];
      const validExtensions = ['jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (!validExtensions.includes(fileExtension ?? '')) {
        this.imageValidationError = 'Only JPG, JPEG, and PNG files are allowed.';
        this.photoFileValid = false;
      } else if (file.size > this.maxFileSize) {
        this.imageValidationError = 'File size must not exceed 2MB.';
        this.photoFileValid = false;
      } else {
        this.uploadedFile = file;
        this.photoFileValid = true;
        this.imageValidationError = '';
      }
    } else {
      this.photoFileValid = false;
      this.imageValidationError = 'Please upload an image.';
    }
  }

  // onSubmit() {
  //   if (this.nurseRegistrationForm.valid && this.photoFileValid) {

  //     const formData = new FormData();

  //     // Append form values except 'agreement'
  //     Object.entries(this.nurseRegistrationForm.value).forEach(([key, value]) => {
  //       if (key !== 'declaration' && key!=='photo') {
  //         // Ensure all values are strings before appending
  //         if (typeof value === 'object' && value !== null) {
  //           formData.append(key, JSON.stringify(value)); // Convert objects to string
  //         } else if (value !== null && value !== undefined) {
  //           formData.append(key, value.toString()); // Convert numbers and booleans to strings
  //         }
  //       }
  //     });
      
  //     // Append file separately
  //     if (this.uploadedFile) {
  //       formData.append('photo', this.uploadedFile);
  //     }
      
  //     // ✅ Check FormData contents
  //     formData.forEach((value, key) => {
  //       console.log(`${key}:`, value);
  //     });
      

  //     this.nurseService.nurseRegistrationDetails(formData).subscribe(
  //       (response) => {
  //         console.log('Registration Successful:', response);
  //       },
  //       (error) => {
  //         console.error('Registration Error:', error);
  //       }
  //     );
      


  //   }
  // }

  onSubmit() {
    if (this.nurseRegistrationForm.valid && this.photoFileValid) {
      const formData = new FormData();
  
      Object.entries(this.nurseRegistrationForm.value).forEach(([key, value]) => {
        if (key !== 'declaration' && key !== 'photo') {
          if ((key === 'languages' || key === 'serviceopt') && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value)); // Convert array to JSON string
          } else {
            formData.append(key, value as string); // Append other values normally
          }
        }
      });
      
  
      // Append image separately
      if (this.uploadedFile) {
        formData.append('photo', this.uploadedFile);
      }
  
      // Debugging: Check formData before sending
      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });
  
      // Send formData to API
      this.nurseService.nurseRegistrationDetails(formData).subscribe(
        (response) => {
          console.log('Registration Successful:', response);
          const modal = document.getElementById('successModals');
          if (modal) modal.classList.add('active');
          this.nurseRegistrationForm.reset();
        },
        (error) => {
          console.error('Registration Error:', error);
          this.toastr.error('Registration Failed! Please try again.');
        }
      );
    }
  }

  redirectToNurse() {
    this.router.navigate(['/index']); 
  
    }

    get f(){
      return this.nurseRegistrationForm.controls;
    }
  
}

function blockSpamNumber(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  // Must be 10 digits only
  if (!/^\d{10}$/.test(value)) return { spamNumber: true };

  // Reject all same digits like 1111111111 or 9999999999
  if (/^(\d)\1{9}$/.test(value)) return { spamNumber: true };

  // Block known fake/test numbers
  const blockedNumbers = ['1234567890', '9876543210', '0123456789', '9999999999'];
  if (blockedNumbers.includes(value)) return { spamNumber: true };

  // India mobile numbers typically start with 6-9
  if (!/^[6-9]/.test(value)) return { spamNumber: true };

  return null;
}