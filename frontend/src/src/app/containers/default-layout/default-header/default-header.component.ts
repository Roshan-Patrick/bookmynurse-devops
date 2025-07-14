import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

import { ClassToggleService, HeaderComponent } from '@coreui/angular';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
})
export class DefaultHeaderComponent extends HeaderComponent {

  @Input() sidebarId: string = "sidebar";

  public newMessages = new Array(4)
  public newTasks = new Array(5)
  public newNotifications = new Array(5)

  constructor(private classToggler: ClassToggleService,private titleService: Title,private metaService: Meta) {
    super();
  }
  ngOnInit(): void {
    this.titleService.setTitle('Book My Nurse | Admin Dashboard | Nursing Career');

    this.metaService.addTags([
      { name: 'description', content: 'Book My Nurse lets you book certified nurses for home care, elderly support, and post-surgery recovery - reliable care when you need it most.' },
      { name: 'keywords', content: 'Book My Nurse, Nurse Booking, Healthcare Management, Nurse Scheduling, Patient Care, Manage Nurses, Medical Staff Management, Nurse Service Platform, Elder Care, Nursing Careers, Nurse Jobs' }
    ]);
  }
}
