import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NurseBookingComponent } from './nurse-booking.component';

describe('NurseBookingComponent', () => {
  let component: NurseBookingComponent;
  let fixture: ComponentFixture<NurseBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NurseBookingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NurseBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
