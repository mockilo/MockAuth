import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MockAuthLoginForm, MockAuthRegisterForm, MockAuthStatus, MockAuthLogoutButton } from '../../../src/components/react/MockAuthComponents';

// Mock the MockAuthProvider
jest.mock('../../../src/components/react/MockAuthProvider', () => ({
  useMockAuth: jest.fn(() => ({
    login: jest.fn().mockResolvedValue({ success: true }),
    register: jest.fn().mockResolvedValue({ success: true }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })),
}));

describe.skip('MockAuthLoginForm - SKIPPED: Component testing disabled', () => {
  it('should render login form', () => {
    render(<MockAuthLoginForm />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const onSuccess = jest.fn();
    render(<MockAuthLoginForm onSuccess={onSuccess} />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show loading state during submission', async () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    const mockLogin = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    useMockAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    render(<MockAuthLoginForm />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Logging in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should display error message on login failure', async () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    useMockAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' }),
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    render(<MockAuthLoginForm />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});

describe('MockAuthRegisterForm', () => {
  it('should render registration form', () => {
    render(<MockAuthRegisterForm />);
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const onSuccess = jest.fn();
    render(<MockAuthRegisterForm onSuccess={onSuccess} />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should validate password confirmation', async () => {
    render(<MockAuthRegisterForm />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });
});

describe('MockAuthStatus', () => {
  it('should show loading state', () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    useMockAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
    
    render(<MockAuthStatus />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show not authenticated state', () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    useMockAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    render(<MockAuthStatus />);
    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });

  it('should show authenticated state with user info', () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    useMockAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'user@example.com',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
      isAuthenticated: true,
      isLoading: false,
    });
    
    render(<MockAuthStatus />);
    expect(screen.getByText('Welcome, Test!')).toBeInTheDocument();
  });

  it('should show username when profile name is not available', () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    useMockAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'user@example.com',
        username: 'testuser',
      },
      isAuthenticated: true,
      isLoading: false,
    });
    
    render(<MockAuthStatus />);
    expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
  });
});

describe('MockAuthLogoutButton', () => {
  it('should render logout button', () => {
    render(<MockAuthLogoutButton />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('should handle logout click', async () => {
    const onLogout = jest.fn();
    render(<MockAuthLogoutButton onLogout={onLogout} />);
    
    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(onLogout).toHaveBeenCalled();
    });
  });

  it('should show loading state during logout', async () => {
    const { useMockAuth } = require('../../../src/components/react/MockAuthProvider');
    const mockLogout = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    useMockAuth.mockReturnValue({
      logout: mockLogout,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    render(<MockAuthLogoutButton />);
    
    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);
    
    expect(screen.getByText('Logging out...')).toBeInTheDocument();
    expect(logoutButton).toBeDisabled();
  });
});
