import { Component, OnInit,ViewChild } from '@angular/core';
import { AvatarModule, ButtonGroupModule, ButtonModule, CardModule, FormModule, GridModule, ModalModule, NavModule, PopoverModule, ProgressModule, TableModule, TabsModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { WidgetsModule } from '../widgets/widgets.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NurseRegService } from '../pages/service/nurse-reg.service';
import { ModalComponent } from '@coreui/angular'; // 👈 Make sure this is the correct path
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ModalModule,CardModule,NavModule,IconModule,TabsModule,CommonModule,
    GridModule,TableModule,AvatarModule,ButtonGroupModule,ButtonModule,FormModule,ProgressModule,ModalModule,
        PopoverModule,ReactiveFormsModule,FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  historyData: any[] = [];
  selectedNurse: any = null;
  showNurseDetailsModal = false;
  users: any;
  

  constructor(private nurseService: NurseRegService,private router: Router,private toastr: ToastrService) {}

  ngOnInit(): void {
    this.getAllRegistered();
  }
  

    getAllRegistered() {
    this.nurseService.getAllRegistered('Complete').subscribe((res: any) => {
      console.log(res)
      this.users = res.data;
    })
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
  
  viewNurseDetails(user: any) {
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

    formatChargesType(value: string): string {
    if (!value) return '';
    // Split by underscore, capitalize each word, and join with space
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }


      onStatus(id: any) {
    this.nurseService.updateNurseApprovalStatus(id, 'Ongoing').subscribe(
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
