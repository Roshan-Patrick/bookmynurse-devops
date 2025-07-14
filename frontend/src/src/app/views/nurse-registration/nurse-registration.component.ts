import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NurseRegService } from '../pages/service/nurse-reg.service';
import { CardModule, GridModule, NavModule, TabsModule,ModalModule, PopoverModule, ProgressModule, TableModule, AvatarModule, ButtonGroupModule, ButtonModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-nurse-registration',
  standalone: true,
  imports: [CardModule,NavModule,IconModule,TabsModule,CommonModule,GridModule,ModalModule,PopoverModule, ProgressModule, TableModule,ReactiveFormsModule,FormsModule,AvatarModule,ButtonGroupModule,ButtonModule],
  templateUrl: './nurse-registration.component.html',
  styleUrl: './nurse-registration.component.scss'
})
export class NurseRegistrationComponent implements OnInit {


  users:any;
  selectedUser:any = {
    id: '',
    name: '',
    aadhaar: '',
    mobile: '',
    email:'',
    gender: '',
    dob: '',
    education: '',
    experience: '',
    languages: [],
    specialization: '',
    serviceopt:'',
    address: '',
    base_location: '',
    availability:''

  };
  isModalVisible: boolean = false;  // ✅ Property for modal visibility


constructor(private nurseService:NurseRegService, private router: Router,private toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.getAllRegistered();
  }


  getAllRegistered(){
    this.nurseService.nurseRegistered().subscribe((res:any)=>{
      this.users = res.data.map((user: any) => ({
        ...user,
        photoUrl: `https://app.bookmynurse.com/api/${user.file_path}`, 
        // photoUrl: `http://localhost:3000/${user.file_path}`,
      }));
    })
  }

  onEdit(id: any) {
    this.nurseService.updateApprovalStatus(id, 'Approved').subscribe(
      (response) => {
        // ✅ Runs when the API call is successful
        this.toastr.success('User Approved.');
        console.info(response)
      },
      (error) => {
        // ❌ Runs if an error occurs
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
  
  onDelete(id: any) {
    this.nurseService.updateApprovalStatus(id, 'Rejected').subscribe(
      (response) => {
        this.toastr.warning('User Rejected.');
      },
      (error) => {
        this.toastr.error('Error in user Rejection.');
        console.error('Error:', error);
      },
      () => {
        setTimeout(() => {
          this.getAllRegistered(); 
        }, 1000);
      }
    );
  }

  openModal(user: any) {
    if (user) {
      this.selectedUser = { ...user };
      this.isModalVisible = true;
    }
  }

  // ✅ Close Modal
  closeModal() {
    this.isModalVisible = false;
    this.selectedUser = null;
  }
  
}
