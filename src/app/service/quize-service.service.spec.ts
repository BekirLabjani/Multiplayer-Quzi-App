import { TestBed } from '@angular/core/testing';

import { QuizeServiceService } from './quize-service.service';

describe('QuizeServiceService', () => {
  let service: QuizeServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizeServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
