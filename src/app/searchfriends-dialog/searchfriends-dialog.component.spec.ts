import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchfriendsDialogComponent } from './searchfriends-dialog.component';

describe('SearchfriendsDialogComponent', () => {
  let component: SearchfriendsDialogComponent;
  let fixture: ComponentFixture<SearchfriendsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchfriendsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchfriendsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
