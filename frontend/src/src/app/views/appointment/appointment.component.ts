import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AvatarModule, ButtonGroupModule, ButtonModule, CardModule, FormModule, GridModule, ModalModule, NavModule, PopoverModule, ProgressModule, TableModule, TabsModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { WidgetsModule } from '../widgets/widgets.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NurseRegService } from '../pages/service/nurse-reg.service';
import { ModalComponent } from '@coreui/angular'; // 👈 Make sure this is the correct path
import { ToastrService } from 'ngx-toastr';





@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CardModule, NavModule, IconModule, TabsModule, CommonModule,
    GridModule, TableModule, AvatarModule, ButtonGroupModule, ButtonModule, FormModule, ProgressModule, ModalModule,
    PopoverModule, ReactiveFormsModule, FormsModule

  ],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss'
})
export class AppointmentComponent implements OnInit {


  constructor(private nurseService: NurseRegService, private router: Router,private toastr: ToastrService) {
  }

  selectedNurse: any = {
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
    charges_type: '',

  };

  selectedUser = {
    id: '',
    enquiryno: '',
    name: '',
    mobile: '',
    nurseType: '',
    location: '',
    services: '',
    preferences: '',
  };
  users: any;
  public liveDemoVisible = false;

  toggleLiveDemo() {
    this.liveDemoVisible = !this.liveDemoVisible;
  }

  handleLiveDemoChange(event: boolean) {
    this.liveDemoVisible = event;
  }

  ngOnInit(): void {
    this.getAllRegistered();
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }


  //   {
  //     enqname:'ENQ-1736320127151',
  //     name: 'Yiorgos Avraamu',
  //     nurseType: 'Male',
  //     registered: 'Jan 1, 2021',
  //     location: 'Kerala',
  //     mobile: 9854523654,
  //     preferences: '24hrs',
  //     payment: 'Mastercard',
  //     services: 'Physiotherapy at Home',
  //     avatar: './assets/img/avatars/1.jpg',
  //     status: 'success',
  //     color: 'success'
  //   },
  //   {
  //     enqname:'ENQ-1736320127151',
  //     name: 'Avram Tarasios',
  //     nurseType: 'Female ',
  //     registered: 'Jan 1, 2021',
  //     location: 'Chennai',
  //     mobile: 9854562584,
  //     preferences: '12hrs',
  //     payment: 'Visa',
  //     services: 'ICU Setup at Home',
  //     avatar: './assets/img/avatars/2.jpg',
  //     status: 'danger',
  //     color: 'info'
  //   },
  //   {
  //     enqname:'ENQ-1736320127151',
  //     name: 'Quintin Ed',
  //     nurseType: 'Female',
  //     registered: 'Jan 1, 2021',
  //     location: 'Indiana',
  //     mobile: 8545256365,
  //     preferences: '15hrs',
  //     payment: 'Stripe',
  //     services: 'Tracheostomy Patient Care',
  //     avatar: './assets/img/avatars/3.jpg',
  //     status: 'warning',
  //     color: 'warning'
  //   },
  //   {
  //     enqname:'ENQ-1736320127151',
  //     name: 'Enéas Kwadwo',
  //     nurseType: 'Female',
  //     registered: 'Jan 1, 2021',
  //     location: 'France',
  //     mobile: 9889541253,
  //     preferences: '12hrs',
  //     payment: 'Paypal',
  //     services: 'Tracheostomy Patient Care',
  //     avatar: './assets/img/avatars/4.jpg',
  //     status: 'secondary',
  //     color: 'danger'
  //   },
  //   {
  //     enqname:'ENQ-1736320127151',
  //     name: 'Agapetus Tadeáš',
  //     nurseType: 'Female',
  //     registered: 'Jan 1, 2021',
  //     location: 'New Zealand',
  //     mobile: 228541256325,
  //     preferences: '12hrs',
  //     payment: 'ApplePay',
  //     services: 'Tracheostomy Patient Care',
  //     avatar: './assets/img/avatars/5.jpg',
  //     status: 'success',
  //     color: 'primary'
  //   },
  //   {
  //     enqname:'ENQ-1736320127151',
  //     name: 'Friderik Dávid',
  //     nurseType: 'Female',
  //     registered: 'Jan 1, 2021',
  //     location: 'Pondicherry',
  //     mobile: 438412563254,
  //     preferences: '12hrs',
  //     payment: 'Amex',
  //     services: 'Tracheostomy Patient Care',
  //     avatar: './assets/img/avatars/6.jpg',
  //     status: 'info',
  //     color: 'dark'
  //   }
  // ];


  @ViewChild('nurseDetailsModal') nurseDetailsModal!: ModalComponent;


  showNurseDetailsModal = false;
  // selectedNurse: any;

  openNurseDetailsModal(user: any) {
    console.log('Opening modal for user ID:', user.id);
    this.showNurseDetailsModal = true;
    this.nurseService.getAllNurseDetails(user.id).subscribe((res: any) => {
      console.log('API Response:', res);
      if (res && res.nurse) {
        this.selectedNurse = res.nurse;
        console.log('Modal should now be visible');
      } else {
        console.warn('No nurse data found!');
      }
    });
  }

  getAllRegistered() {
    this.nurseService.getAllRegistered('Ongoing').subscribe((res: any) => {
      console.log(res)
      this.users = res.data;
    })
  }


  onEdit(user: any) {
    this.selectedUser = { ...user }; // Clone the user to avoid direct modification
    console.log(this.selectedUser)
  }
  onDelete(user: any) {
    this.selectedUser = { ...user }; // Clone the user to avoid direct modification
    console.log(this.selectedUser)
  }
  updateUser() {
    if (!this.selectedUser.id) {
      alert('User ID is required');
      return;
    }

    this.nurseService.updateBooking(this.selectedUser).subscribe(
      (response) => {
        alert('Booking updated successfully');
        console.log(response);
        this.getAllRegistered()
      },
      (error) => {
        console.error('Error updating booking:', error);
        alert('Failed to update booking');
      }
    );
  }

  onDeleteBooking(): void {


    this.nurseService.deleteBooking(this.selectedUser.id).subscribe({
      next: (response) => {
        // alert(response.message);
        // Optionally, refresh the booking list or update the UI
        console.log(response);
        this.getAllRegistered();
      },
      error: (err) => {
        console.log('Failed to delete booking: ' + err.message);
      },
    });

  }

  formatChargesType(value: string): string {
    if (!value) return '';
    // Split by underscore, capitalize each word, and join with space
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

    onStatus(id: any) {
    this.nurseService.updateNurseApprovalStatus(id, 'Complete').subscribe(
      (response) => {
        this.toastr.success('Status Updated.');
        console.info(response)
      },
      (error) => {
        this.toastr.error('Error in user Approval.');
        console.error('Error:', error);
      },
      () => {
        // ✅ Runs after `next` or `error` (always executes)
       setTimeout(() => {
         this.getAllRegistered(); 
       }, 1000);
      }
    );
  }
}
