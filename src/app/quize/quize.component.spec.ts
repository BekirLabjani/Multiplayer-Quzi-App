import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizeComponent } from './quize.component';

describe('QuizeComponent', () => {
  let component: QuizeComponent;
  let fixture: ComponentFixture<QuizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
