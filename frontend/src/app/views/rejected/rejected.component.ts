import { Component, OnInit } from "@angular/core";
import { NurseRegService } from '../../views/pages/service/nurse-reg.service';
import { Router } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule, GridModule, NavModule, TabsModule,ModalModule, PopoverModule, ProgressModule, TableModule, AvatarModule, ButtonGroupModule, ButtonModule } from '@coreui/angular';
import { IconModule } from "@coreui/icons-angular";
import { CommonModule } from "@angular/common";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-rejected',
  standalone: true,
  imports: [CardModule,NavModule,IconModule,TabsModule,CommonModule,GridModule,ModalModule,PopoverModule, ProgressModule, TableModule,ReactiveFormsModule,FormsModule,AvatarModule,ButtonGroupModule,ButtonModule],
  templateUrl: './rejected.component.html',
  styleUrl: './rejected.component.scss'
})
export class RejectedComponent {

  constructor(private nurseService: NurseRegService, private router: Router,private toastr: ToastrService) {}

  users: any;
  selectedUser: any = null;  // ✅ Declare the missing property
  isModalVisible: boolean = false;  // ✅ Declare the missing property
  ngOnInit(): void {
    this.getAllApproved();
  }

  getAllApproved() {
    this.nurseService.nurseRegistered('Rejected').subscribe((res:any)=>{
      console.log(res)
      this.users = res.data.map((user: any) => ({
        ...user,
        photoUrl: `https://app.bookmynurse.com/api/${user.file_path}`, 
        // photoUrl: `http://localhost:3000/${user.file_path}`,
      }));
    })
  }

  onDelete(id: any) {
    this.nurseService.revertApprovalStatus(id).subscribe(
      (response) => {
        this.toastr.warning('User removed from Rejected.');
      },
      (error) => {
        this.toastr.error('Error removing from Rejected.');
        console.error('Error:', error);
      },
      () => {
        setTimeout(() => {
          this.getAllApproved(); 
        }, 1000);
      }
    );
  }

  openModal(user: any) {
    this.selectedUser = user;  // Assign the selected user
    this.isModalVisible = true;  // Open the modal
  }

  // ✅ Close Modal
  closeModal() {
    this.isModalVisible = false;
    this.selectedUser = null;
  }

}
