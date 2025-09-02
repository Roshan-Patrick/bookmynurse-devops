import { Component, OnInit, HostListener, ViewChild, ElementRef } from "@angular/core";
import { NurseRegService } from "../pages/service/nurse-reg.service";
import { Router } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule, GridModule, NavModule, TabsModule, ModalModule, PopoverModule, ProgressModule, TableModule, AvatarModule, ButtonGroupModule, ButtonModule, DropdownModule, FormModule } from '@coreui/angular';
import { IconModule } from "@coreui/icons-angular";
import { CommonModule, DatePipe } from "@angular/common";
import { ToastrService } from "ngx-toastr";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-approved",
  standalone: true,
  imports: [CardModule, DropdownModule, NavModule, IconModule, TabsModule, CommonModule, GridModule, ModalModule, PopoverModule, ProgressModule, TableModule, ReactiveFormsModule,
    FormsModule, AvatarModule, ButtonGroupModule, ButtonModule, FormModule],
  templateUrl: "./approved.component.html",
  styleUrl: "./approved.component.scss",
  providers: [DatePipe]
})
export class ApprovedComponent implements OnInit {


  constructor(private nurseService: NurseRegService, private router: Router, private datePipe: DatePipe, private toastr: ToastrService) { }

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  dropdownOpen = false;
  isModalVisible: boolean = false;

  languageOptions = [
    { value: "English", name: "English" },
    { value: "Tamil", name: "Tamil" },
    { value: "Hindi", name: "Hindi" },
    { value: "Malayalam", name: "Malayalam" },
    { value: "Telugu", name: "Telugu" },
    { value: "Kannada", name: "Kannada" },
    { value: "Urdu", name: "Urdu" }
  ];


  // Toggle dropdown visibility
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    // const inputElement = document.getElementById('languages');

    // If the clicked element is NOT the input field, close the dropdown
    if (this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }

  // Handle checkbox selection
  toggleSelection(language: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedUser.languages.push(language);
    } else {
      this.selectedUser.languages = this.selectedUser.languages.filter(
        (lang: string) => lang !== language
      );
    }
  }

  users: any;
  selectedUser: any = {
    id: '',
    name: '',
    mobile: '',
    email: '',
    gender: '',
    dob: '',
    education: '',
    experience: '',
    languages: [],
    specialization: '',
    serviceopt: '',
    address: '',
    base_location: '',
    availability: '',
    charges: '',
    charges_type : '',
  };


  // selectedUser: any = null;
  isSetChargesModalOpen = false;
  chargesInput: string = '';
  charges_type : string = '';
  

  openSetChargesModal(user: any): void {
    this.selectedUser = user;
    this.isSetChargesModalOpen = true;
  }

  closeSetChargesModal(): void {
    this.isSetChargesModalOpen = false;
  }

saveCharges() {
  const chargesStr = this.chargesInput?.toString();
  const isValid = /^\d+(\.\d{1,2})?$/.test(chargesStr);

  if (!isValid) {
    alert("Please enter a valid amount (e.g., 500 or 1200.50)");
    return;
  }

  if (!this.selectedUser) return;

  this.nurseService.setNurseCharges(this.selectedUser.id, +this.chargesInput, this.charges_type ).subscribe(
    (res: any) => {
      this.selectedUser.charges = this.chargesInput;
      this.selectedUser.charges_type = this.charges_type ;

      setTimeout(() => {
        this.isSetChargesModalOpen = false;
        this.toastr.success('Charges updated successfully!');
        this.chargesInput = '';
      }, 500);

      this.getAllApproved(); // Refresh data
    },
    (error) => {
      console.error("Error saving charges", error);
    }
  );
}


  validateDecimalInput(event: KeyboardEvent) {
    const inputChar = String.fromCharCode(event.charCode);
    const currentValue: string = this.chargesInput?.toString() || '';

    // Allow only digits and dot
    if (!/[\d.]/.test(inputChar)) {
      event.preventDefault();
      return;
    }

    // Prevent more than one dot
    if (inputChar === '.' && currentValue.includes('.')) {
      event.preventDefault();
      return;
    }

    // Simulate the new value
    const newValue = currentValue + inputChar;

    // Allow only valid decimal values up to 2 places
    if (!/^\d+(\.\d{0,2})?$/.test(newValue)) {
      event.preventDefault();
    }
  }


  ngOnInit(): void {
    this.getAllApproved();
  }
  getAllApproved() {
    this.nurseService.nurseRegistered('Approved').subscribe((res: any) => {
      console.log(res)
      this.users = res.data.map((user: any) => ({
        ...user,
        photoUrl: `${environment.APIEndpoint}/uploads/${user.file_path.replace(/\\/g, '/').replace(/^uploads\//, '')}`, // photoUrl: `http://localhost:3000/${user.file_path}`, 
      }));
    })
  }

  formatDate() {
    if (this.selectedUser.dob) {
      this.selectedUser.dob = this.datePipe.transform(this.selectedUser.dob, 'dd/MM/yyyy') || '';
    }
  }

  convertToDateInputFormat(dateString: string): string {
    if (!dateString) return '';

    // Convert known formats using DatePipe
    let formattedDate = this.datePipe.transform(dateString, 'yyyy-MM-dd');

    return formattedDate || ''; // Return empty string if transformation fails
  }


  onDelete(id: any) {
    this.nurseService.revertApprovalStatus(id).subscribe(
      (response) => {
        this.toastr.warning('User removed from Approval.');
      },
      (error) => {
        this.toastr.error('Error removing from Approval.');
        console.error('Error:', error);
      },
      () => {
        setTimeout(() => {
          this.getAllApproved();
        }, 1000);
      }
    );
  }


  showChargesTypeModal: boolean = false;
  // selectedUser: any;
  selectedChargesType: string = '';
  
  openChargesTypeModal(user: any) {
    this.selectedUser = user;
    this.selectedChargesType = user.chargesType || '';
    this.showChargesTypeModal = true;
  }
  
  saveChargesType() {
    if (!this.selectedChargesType.trim()) {
      alert('Please enter a valid charges type.');
      return;
    }
  
    this.nurseService.setChargesType(this.selectedUser.id, this.selectedChargesType).subscribe({
      next: () => {
        (this.selectedUser as any).chargesType = this.selectedChargesType;
        this.showChargesTypeModal = false;
        alert('Charges type saved.');
      },
      error: () => {
        alert('Error saving charges type.');
      }
    });   
  }
  



  onEdit(user: any) {
    this.selectedUser = { ...user }; // Clone the user to avoid direct modification
    console.log("Languages:", this.selectedUser.languages);

    if (this.selectedUser.dob) {
      this.selectedUser.dob = this.convertToDateInputFormat(this.selectedUser.dob);
      console.log(this.selectedUser.dob)
    }
  }

  isAvailable(user: any) {
    this.selectedUser = { ...user }; // Clone the user to avoid direct modification
  }

  updateUser() {
    if (!this.selectedUser.id) {
      alert('User ID is required');
      return;
    }

    // ✅ Convert languages to a valid JSON string
    if (!Array.isArray(this.selectedUser.languages)) {
      this.selectedUser.languages = this.selectedUser.languages.split(',').map((lang: any) => lang.trim());
    }

    // Remove unwanted fields before sending the request
    const keysToRemove = ['file_path', 'image_id', 'photoUrl'];
    keysToRemove.forEach(key => delete this.selectedUser[key]);

    // ✅ Convert languages to a JSON string before sending to API
    // const updatedUser = {
    //   ...this.selectedUser,
    //   languages: JSON.stringify(this.selectedUser.languages)
    // };



    this.nurseService.editNurse(this.selectedUser.id, this.selectedUser).subscribe(
      (response) => {
        alert('Booking updated successfully');
        console.log(response);
        this.getAllApproved();
      },
      (error) => {
        console.error('Error updating booking:', error);
        alert('Failed to update booking');
      }
    );
  }


  onApproveBooking(): void {


    console.log(this.selectedUser.availability, this.selectedUser.id);
    this.nurseService.updateAvailableStatus(this.selectedUser.id, this.selectedUser.availability).subscribe(
      (response) => {
        this.toastr.success('Availability Confirmed.');
      },
      (error) => {
        this.toastr.error('Error in Nurse Availability.');
        console.error('Error:', error);
      },
      () => {
        setTimeout(() => {
          this.getAllApproved();
        }, 1000);
      }
    );
  }



  // ✅ Open Modal with null check
  openModal(user: any) {
    if (user) {
      this.selectedUser = { ...user };
      this.isModalVisible = true;
    }
  }

  // ✅ Close Modal - reset to default values instead of null
  closeModal() {
    this.isModalVisible = false;
    this.selectedUser = {
      id: '',
      name: '',
      // aadhaar: '',
      mobile: '',
      email: '',
      gender: '',
      dob: '',
      education: '',
      experience: '',
      languages: [],
      specialization: '',
      serviceopt: '',
      address: '',
      base_location: '',
      availability: ''
    };
  }
}


