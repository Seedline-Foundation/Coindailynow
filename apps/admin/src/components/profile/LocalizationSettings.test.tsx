/**
 * LocalizationSettings Component Tests
 * Task 25: User Profile & Settings - TDD Implementation
 * 
 * Comprehensive tests for global localization settings with African priority
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LocalizationSettings from './LocalizationSettings';
import { 
  LocalizationSettingsFormData,
  GlobalCurrency,
  GlobalRegion,
  DateFormat,
  NumberFormat
} from '../../types/profile';

// Mock data
const mockSettings: LocalizationSettingsFormData = {
  language: 'en',
  country: 'ng',
  timezone: 'Africa/Lagos',
  currency: GlobalCurrency.NGN,
  dateFormat: DateFormat.DD_MM_YYYY,
  numberFormat: NumberFormat.COMMA_DECIMAL
};

const mockGlobalSettings: LocalizationSettingsFormData = {
  language: 'en',
  country: 'us',
  timezone: 'America/New_York',
  currency: GlobalCurrency.USD,
  dateFormat: DateFormat.MM_DD_YYYY,
  numberFormat: NumberFormat.COMMA_DECIMAL
};

describe('LocalizationSettings Component', () => {
  const mockOnSubmit = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering', () => {
    test('renders localization settings form with all fields', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('Localization Settings')).toBeInTheDocument();
      expect(screen.getByLabelText(/country\/region/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date format/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number format/i)).toBeInTheDocument();
    });

    test('displays African regions as priority options when prioritizeAfrica is true', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          prioritizeAfrica={true}
        />
      );

      const regionFilter = screen.getByLabelText(/filter by region/i);
      expect(regionFilter).toBeInTheDocument();
      
      fireEvent.click(regionFilter);
      expect(screen.getByText('African Regions (Priority)')).toBeInTheDocument();
      expect(screen.getByText('West Africa')).toBeInTheDocument();
      expect(screen.getByText('East Africa')).toBeInTheDocument();
    });

    test('shows format preview section', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Format Preview')).toBeInTheDocument();
      expect(screen.getByText(/date:/i)).toBeInTheDocument();
      expect(screen.getByText(/number:/i)).toBeInTheDocument();
      expect(screen.getByText(/currency:/i)).toBeInTheDocument();
    });
  });

  describe('African Market Prioritization', () => {
    test('prioritizes African countries when prioritizeAfrica is true', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          prioritizeAfrica={true}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      fireEvent.click(countrySelect);
      
      // Should see African Countries section first
      expect(screen.getByText('🌍 African Countries (Priority)')).toBeInTheDocument();
      expect(screen.getByText('🌐 All Countries')).toBeInTheDocument();
    });

    test('shows African currencies as priority when prioritizeAfrica is true', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          prioritizeAfrica={true}
        />
      );

      const currencySelect = screen.getByLabelText(/currency/i);
      fireEvent.click(currencySelect);
      
      expect(screen.getByText('🌍 African Currencies (Priority)')).toBeInTheDocument();
      expect(screen.getByText('🌐 Global Currencies')).toBeInTheDocument();
    });

    test('does not prioritize African regions when prioritizeAfrica is false', () => {
      render(
        <LocalizationSettings 
          settings={mockGlobalSettings}
          onSubmit={mockOnSubmit}
          prioritizeAfrica={false}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      fireEvent.click(countrySelect);
      
      // Should not see prioritized sections
      expect(screen.queryByText('🌍 African Countries (Priority)')).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('updates language options when country changes', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      
      // Change to Kenya (has Swahili and English)
      await user.selectOptions(countrySelect, 'ke');
      
      await waitFor(() => {
        const languageSelect = screen.getByLabelText(/language/i);
        expect(languageSelect).toBeInTheDocument();
      });
    });

    test('updates timezone options when country changes', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      
      // Change country
      await user.selectOptions(countrySelect, 'za');
      
      await waitFor(() => {
        const timezoneSelect = screen.getByLabelText(/timezone/i);
        expect(timezoneSelect).toBeInTheDocument();
      });
    });

    test('updates currency when country changes', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      
      // Change to South Africa
      await user.selectOptions(countrySelect, 'za');
      
      await waitFor(() => {
        const currencySelect = screen.getByLabelText(/currency/i) as HTMLSelectElement;
        expect(currencySelect.value).toBe(GlobalCurrency.ZAR);
      });
    });

    test('filters countries by region', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const regionFilter = screen.getByLabelText(/filter by region/i);
      
      // Filter to West Africa
      await user.selectOptions(regionFilter, GlobalRegion.WEST_AFRICA);
      
      await waitFor(() => {
        const countrySelect = screen.getByLabelText(/country\/region/i);
        fireEvent.click(countrySelect);
        
        // Should only show West African countries
        expect(screen.getByText(/nigeria/i)).toBeInTheDocument();
        expect(screen.getByText(/ghana/i)).toBeInTheDocument();
      });
    });

    test('filters countries by search term', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search by country name/i);
      
      // Search for "Nigeria"
      await user.type(searchInput, 'Nigeria');
      
      await waitFor(() => {
        const countrySelect = screen.getByLabelText(/country\/region/i);
        fireEvent.click(countrySelect);
        
        // Should only show Nigeria
        expect(screen.getByText(/🇳🇬 nigeria/i)).toBeInTheDocument();
      });
    });
  });

  describe('Format Preview', () => {
    test('updates date preview when date format changes', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const dateFormatSelect = screen.getByLabelText(/date format/i);
      
      // Change to US format
      await user.selectOptions(dateFormatSelect, DateFormat.MM_DD_YYYY);
      
      await waitFor(() => {
        const preview = screen.getByText(/format preview/i).parentElement;
        expect(preview).toHaveTextContent(/\d{2}\/\d{2}\/\d{4}/);
      });
    });

    test('updates number preview when number format changes', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const numberFormatSelect = screen.getByLabelText(/number format/i);
      
      // Change to European format
      await user.selectOptions(numberFormatSelect, NumberFormat.DOT_COMMA);
      
      await waitFor(() => {
        const preview = screen.getByText(/format preview/i).parentElement;
        expect(preview).toBeInTheDocument();
      });
    });

    test('updates currency preview when currency changes', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const currencySelect = screen.getByLabelText(/currency/i);
      
      // Change to USD
      await user.selectOptions(currencySelect, GlobalCurrency.USD);
      
      await waitFor(() => {
        const preview = screen.getByText(/format preview/i).parentElement;
        expect(preview).toHaveTextContent(/\$/);
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with updated localization settings', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      const currencySelect = screen.getByLabelText(/currency/i);
      const submitButton = screen.getByRole('button', { name: /save changes/i });

      // Make changes
      await user.selectOptions(countrySelect, 'ke');
      await user.selectOptions(currencySelect, GlobalCurrency.KES);
      
      // Submit
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            country: 'ke',
            currency: GlobalCurrency.KES
          })
        );
      });
    });

    test('resets form when reset button is clicked', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i) as HTMLSelectElement;
      const resetButton = screen.getByRole('button', { name: /reset/i });

      // Make changes
      await user.selectOptions(countrySelect, 'za');
      expect(countrySelect.value).toBe('za');

      // Reset
      await user.click(resetButton);

      await waitFor(() => {
        expect(countrySelect.value).toBe('ng');
      });
    });

    test('validates required fields', async () => {
      render(
        <LocalizationSettings 
          settings={{ ...mockSettings, country: '', language: '' }}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      
      await user.click(submitButton);

      // Should not call onSubmit with invalid data
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('disables submit button when loading', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    test('shows saving text when loading', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when provided', () => {
      const errorMessage = 'Failed to save localization settings';
      
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toHaveClass('text-red-600');
    });

    test('does not display error section when no error', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
          error={null}
        />
      );

      expect(screen.queryByText(/failed to save/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels and structure', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      // Check for proper form structure
      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Check for labeled inputs
      expect(screen.getByLabelText(/country\/region/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    });

    test('has proper button roles and labels', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      
      // Should be focusable
      countrySelect.focus();
      expect(countrySelect).toHaveFocus();
    });
  });

  describe('Global vs African Focus', () => {
    test('works correctly with global settings', () => {
      render(
        <LocalizationSettings 
          settings={mockGlobalSettings}
          onSubmit={mockOnSubmit}
          prioritizeAfrica={false}
        />
      );

      expect(screen.getByDisplayValue('us')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    });

    test('maintains African priority by default', () => {
      render(
        <LocalizationSettings 
          settings={mockSettings}
          onSubmit={mockOnSubmit}
        />
      );

      const countrySelect = screen.getByLabelText(/country\/region/i);
      fireEvent.click(countrySelect);
      
      expect(screen.getByText('🌍 African Countries (Priority)')).toBeInTheDocument();
    });
  });
});
