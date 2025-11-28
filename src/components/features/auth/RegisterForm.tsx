// Clean Architecture - Register Form Feature Component
import React, { useEffect, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { isExtensionContext } from '@/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { isAuthenticated, error, register, isLoading } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(firstName.trim(), lastName.trim(), email, password);
      startTransition(() => {
        if (isExtensionContext()) {
          window.location.hash = '#/';
        } else {
          navigate('/');
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      return navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Create Account
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={validationErrors.firstName}
            placeholder="John"
            required
            fullWidth
          />

          <Input
            label="Last Name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={validationErrors.lastName}
            placeholder="Doe"
            required
            fullWidth
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={validationErrors.email}
          placeholder="john.doe@example.com"
          required
          fullWidth
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={validationErrors.password}
          placeholder="Create a password"
          helperText="Must be at least 6 characters"
          required
          fullWidth
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={validationErrors.confirmPassword}
          placeholder="Confirm your password"
          required
          fullWidth
        />

        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading || isPending}
          className="w-full"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a
              href="#/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium"
            >
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
};
