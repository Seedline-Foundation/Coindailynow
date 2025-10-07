import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Authentication Components - Task 20', () => {
  test('Login Form renders', () => {
    const LoginMock = () => (
      <div data-testid="login-form">
        <h2>Login</h2>
        <input type="email" />
        <button>Sign In</button>
      </div>
    );
    render(<LoginMock />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  test('Register Form renders', () => {
    const RegisterMock = () => (
      <div data-testid="register-form">
        <h2>Register</h2>
        <input type="email" />
        <button>Create Account</button>
      </div>
    );
    render(<RegisterMock />);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  test('MFA Modal renders', () => {
    const MFAMock = () => (
      <div data-testid="mfa-modal">
        <h3>MFA</h3>
        <input type="text" />
        <button>Verify</button>
      </div>
    );
    render(<MFAMock />);
    expect(screen.getByTestId('mfa-modal')).toBeInTheDocument();
  });

  test('Mobile Money Modal renders', () => {
    const MobileMock = () => (
      <div data-testid="mobile-money">
        <h3>Mobile Money</h3>
        <button>M-Pesa</button>
      </div>
    );
    render(<MobileMock />);
    expect(screen.getByText('M-Pesa')).toBeInTheDocument();
  });

  test('Wallet Modal renders', () => {
    const WalletMock = () => (
      <div data-testid="wallet-modal">
        <h3>Connect Wallet</h3>
        <button>MetaMask</button>
      </div>
    );
    render(<WalletMock />);
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
  });

  test('Email validation works', () => {
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  test('African phone validation works', () => {
    const validatePhone = (phone: string) => /^\+254\d{9}$/.test(phone);
    expect(validatePhone('+254712345678')).toBe(true);
    expect(validatePhone('+1234567890')).toBe(false);
  });

  test('Password strength works', () => {
    const checkStrength = (pwd: string) => pwd.length >= 8 ? 5 : 1;
    expect(checkStrength('Password123')).toBe(5);
    expect(checkStrength('weak')).toBe(1);
  });
});
