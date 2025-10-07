/**
 * ProfileForm Component Tests
 * Task 25: User Profile & Settings - TDD Implementation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileForm } from './ProfileForm';
import { UserProfile, TradingExperience, PortfolioSize } from '../../types/profile';

// Mock data
const mockProfile: UserProfile = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'johndoe',
  bio: 'Crypto enthusiast from Lagos',
  location: 'Lagos, Nigeria',
  website: 'https://johndoe.com',
  twitter: '@johndoe',
  linkedin: 'https://linkedin.com/in/johndoe',
  tradingExperience: TradingExperience.INTERMEDIATE,
  investmentPortfolioSize: PortfolioSize.MEDIUM,
  preferredExchanges: ['binance-africa', 'luno'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

describe('ProfileForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders profile form with all fields', () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Check for form fields
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trading experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/investment portfolio size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred exchanges/i)).toBeInTheDocument();

    // Check for form actions
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset changes/i })).toBeInTheDocument();
  });

  test('populates form fields with profile data', () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Check that fields are populated with profile data
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Crypto enthusiast from Lagos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lagos, Nigeria')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://johndoe.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('@johndoe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://linkedin.com/in/johndoe')).toBeInTheDocument();
  });

  test('validates required fields and shows errors', async () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Clear required field
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.blur(firstNameInput);

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  test('enables save button when form is dirty and valid', async () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    
    // Initially, save button should be disabled (form not dirty)
    expect(saveButton).toBeDisabled();

    // Make a change to the form
    const bioInput = screen.getByLabelText(/bio/i);
    fireEvent.change(bioInput, { target: { value: 'Updated bio content' } });

    // Save button should now be enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('resets form when reset button is clicked', async () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Make changes to form
    const bioInput = screen.getByLabelText(/bio/i);
    fireEvent.change(bioInput, { target: { value: 'Changed bio' } });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset changes/i });
    fireEvent.click(resetButton);

    // Form should be reset to original values
    await waitFor(() => {
      expect(bioInput).toHaveValue('Crypto enthusiast from Lagos');
    });
  });

  test('submits form with updated data', async () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Make changes
    const bioInput = screen.getByLabelText(/bio/i);
    fireEvent.change(bioInput, { target: { value: 'Updated bio content' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Check that onSubmit was called with updated data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'johndoe',
        bio: 'Updated bio content',
        location: 'Lagos, Nigeria',
        website: 'https://johndoe.com',
        twitter: '@johndoe',
        linkedin: 'https://linkedin.com/in/johndoe',
        tradingExperience: TradingExperience.INTERMEDIATE,
        investmentPortfolioSize: PortfolioSize.MEDIUM,
        preferredExchanges: ['binance-africa', 'luno']
      });
    });
  });

  test('validates URL fields correctly', async () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Test invalid website URL
    const websiteInput = screen.getByLabelText(/website/i);
    fireEvent.change(websiteInput, { target: { value: 'not-a-valid-url' } });
    fireEvent.blur(websiteInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });

    // Test invalid LinkedIn URL
    const linkedinInput = screen.getByLabelText(/linkedin/i);
    fireEvent.change(linkedinInput, { target: { value: 'https://notlinkedin.com/profile' } });
    fireEvent.blur(linkedinInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid linkedin profile url/i)).toBeInTheDocument();
    });
  });

  test('validates character limits', async () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Test bio character limit
    const bioInput = screen.getByLabelText(/bio/i);
    const longBio = 'a'.repeat(501); // Exceed 500 character limit
    fireEvent.change(bioInput, { target: { value: longBio } });
    fireEvent.blur(bioInput);

    await waitFor(() => {
      expect(screen.getByText(/bio must be less than 500 characters/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during form submission', () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const saveButton = screen.getByRole('button', { name: /saving changes/i });
    expect(saveButton).toBeDisabled();
  });

  test('displays error message when submission fails', () => {
    const errorMessage = 'Failed to update profile';
    
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('handles avatar upload', () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Avatar upload component should be present
    expect(screen.getByText(/upload avatar/i)).toBeInTheDocument();
  });

  test('validates trading experience selection', () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const tradingExperienceSelect = screen.getByLabelText(/trading experience/i);
    expect(tradingExperienceSelect).toHaveValue(TradingExperience.INTERMEDIATE);
  });

  test('validates preferred exchanges multiselect', () => {
    render(
      <ProfileForm 
        profile={mockProfile}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Check that multiselect is present and has expected functionality
    const exchangesField = screen.getByLabelText(/preferred exchanges/i);
    expect(exchangesField).toBeInTheDocument();
  });
});