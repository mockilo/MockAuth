import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockAuthStatusComponent } from '../../../src/components/angular/components/mock-auth-status.component';

describe.skip('MockAuthStatusComponent', () => {
  let component: MockAuthStatusComponent;
  let fixture: ComponentFixture<MockAuthStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MockAuthStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MockAuthStatusComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.isLoading).toBe(true);
    expect(component.isAuthenticated).toBe(false);
    expect(component.user).toBeNull();
  });

  it('should have correct status class for loading state', () => {
    component.isLoading = true;
    component.isAuthenticated = false;
    
    expect(component.statusClass).toBe('loading');
  });

  it('should have correct status class for not authenticated state', () => {
    component.isLoading = false;
    component.isAuthenticated = false;
    
    expect(component.statusClass).toBe('not-authenticated');
  });

  it('should have correct status class for authenticated state', () => {
    component.isLoading = false;
    component.isAuthenticated = true;
    
    expect(component.statusClass).toBe('authenticated');
  });

  it('should set user data after initialization', (done) => {
    component.ngOnInit();
    
    setTimeout(() => {
      expect(component.user).toEqual({
        id: '1',
        email: 'user@example.com',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      });
      expect(component.isAuthenticated).toBe(true);
      expect(component.isLoading).toBe(false);
      done();
    }, 1100);
  });

  it('should render loading message initially', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Loading...');
  });

  it('should render not authenticated message when not loading and not authenticated', () => {
    component.isLoading = false;
    component.isAuthenticated = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Not logged in');
  });

  it('should render welcome message when authenticated', () => {
    component.isLoading = false;
    component.isAuthenticated = true;
    component.user = {
      id: '1',
      email: 'user@example.com',
      username: 'testuser',
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Welcome, Test!');
  });

  it('should render username when profile name is not available', () => {
    component.isLoading = false;
    component.isAuthenticated = true;
    component.user = {
      id: '1',
      email: 'user@example.com',
      username: 'testuser',
    };
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Welcome, testuser!');
  });

  it('should apply correct CSS classes', () => {
    component.isLoading = false;
    component.isAuthenticated = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const statusElement = compiled.querySelector('.mockauth-status');
    expect(statusElement).toHaveClass('authenticated');
  });

  it('should apply loading CSS class', () => {
    component.isLoading = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const statusElement = compiled.querySelector('.mockauth-status');
    expect(statusElement).toHaveClass('loading');
  });

  it('should apply not-authenticated CSS class', () => {
    component.isLoading = false;
    component.isAuthenticated = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const statusElement = compiled.querySelector('.mockauth-status');
    expect(statusElement).toHaveClass('not-authenticated');
  });
});
