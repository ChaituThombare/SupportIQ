import { TestBed } from '@angular/core/testing';
import { AdminAgent } from './admin-agent';

describe('AdminAgent', () => {
  let service: AdminAgent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminAgent);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
