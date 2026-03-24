import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

// Mock the @zxing/browser library
jest.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    listVideoInputDevices: jest.fn().mockResolvedValue([
      { deviceId: 'camera1', label: 'Front Camera' },
      { deviceId: 'camera2', label: 'Back Camera' }
    ]),
    decodeFromVideoDevice: jest.fn(),
    reset: jest.fn()
  }))
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  }
});

describe('BarcodeScannerModal', () => {
  const mockOnDetected = jest.fn();
  const mockOnHide = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal when show is true', () => {
    render(
      <BarcodeScannerModal
        show={true}
        onHide={mockOnHide}
        onDetected={mockOnDetected}
      />
    );

    expect(screen.getByText('Scan Barcode')).toBeInTheDocument();
    expect(screen.getByText('📷 Camera Scanner')).toBeInTheDocument();
  });

  test('does not render modal when show is false', () => {
    render(
      <BarcodeScannerModal
        show={false}
        onHide={mockOnHide}
        onDetected={mockOnDetected}
      />
    );

    expect(screen.queryByText('Scan Barcode')).not.toBeInTheDocument();
  });

  test('switches to manual input when button is clicked', () => {
    render(
      <BarcodeScannerModal
        show={true}
        onHide={mockOnHide}
        onDetected={mockOnDetected}
      />
    );

    const manualButton = screen.getByText('🔢 Manual Entry');
    fireEvent.click(manualButton);

    expect(screen.getByText('🔢 Manual Barcode Entry')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter barcode number, SKU, or product ID')).toBeInTheDocument();
  });

  test('calls onDetected when manual form is submitted', async () => {
    render(
      <BarcodeScannerModal
        show={true}
        onHide={mockOnHide}
        onDetected={mockOnDetected}
      />
    );

    // Switch to manual input
    const manualButton = screen.getByText('🔢 Manual Entry');
    fireEvent.click(manualButton);

    // Fill in the form
    const input = screen.getByPlaceholderText('Enter barcode number, SKU, or product ID');
    fireEvent.change(input, { target: { value: '123456789' } });

    // Submit the form
    const form = input.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnDetected).toHaveBeenCalledWith('123456789');
    });
  });

  test('calls onHide when cancel button is clicked', () => {
    render(
      <BarcodeScannerModal
        show={true}
        onHide={mockOnHide}
        onDetected={mockOnDetected}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnHide).toHaveBeenCalled();
  });
});
