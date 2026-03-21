import React from 'react';
import PrivateRoute from '../components/PrivateRoute';
import { isAuthenticated } from '../utils/localStorageHelpers';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../pages/Register';
import { authService } from '../services/authService';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/authService');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Page', () => {
  test('successful registration', async () => {
    authService.register.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'new@test.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByText(/register/i));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});