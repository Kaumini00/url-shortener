import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { urlService } from '../services/urlService';
import { authService } from '../services/authService';
import * as localStorageHelpers from '../utils/localStorageHelpers';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/urlService');
jest.mock('../services/authService');
jest.mock('../utils/localStorageHelpers');

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure isAuthenticated always returns true for tests
    localStorageHelpers.isAuthenticated.mockReturnValue(true);
  });

  test('loads user URLs', async () => {
    urlService.getUserUrls.mockResolvedValue([
      {
        id: 1,
        long_url: 'https://example.com',
        short_code: 'abc123',
        clicks: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // wait for the URL to appear
    expect(await screen.findByText(/shortened url/i)).toBeInTheDocument();
  });

  test('shortens a URL', async () => {
    urlService.getUserUrls.mockResolvedValue([]);
    urlService.shortenUrl.mockResolvedValue({
      id: 2,
      long_url: 'https://test.com',
      short_code: 'xyz',
      clicks: 0,
      created_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter long url/i), {
      target: { value: 'https://test.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(urlService.shortenUrl).toHaveBeenCalledWith('https://test.com');
    });
  });

  test('logout works', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(authService.logout).toHaveBeenCalled();
  });
});