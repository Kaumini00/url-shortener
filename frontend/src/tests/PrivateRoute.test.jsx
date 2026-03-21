import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivateRoute from '../components/PrivateRoute';
import { MemoryRouter } from 'react-router-dom';
import * as localStorageHelpers from '../utils/localStorageHelpers'; // <-- namespace import

// Mock the module
jest.mock('../utils/localStorageHelpers');

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when authenticated', () => {
    // Mock return value for this test
    localStorageHelpers.isAuthenticated.mockReturnValue(true);

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Protected</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  test('redirects when not authenticated', () => {
    localStorageHelpers.isAuthenticated.mockReturnValue(false);

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Protected</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });
});