// Clean Architecture - Login Form Feature Component
import React, { useEffect, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { isExtensionContext } from '@/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const { isAuthenticated, error, login, isLoading } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      startTransition(() => {
        if (isExtensionContext()) {
          window.location.hash = '#/';
        } else {
          navigate('/');
        }
      });
    } catch (error) {
      console.error(error)
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      return navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Sign In
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={validationErrors.email}
          placeholder="Enter your email"
          required
          fullWidth
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={validationErrors.password}
          placeholder="Enter your password"
          required
          fullWidth
        />

        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading || isPending}
          className="w-full"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a
              href="#/register"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium"
            >
              Sign up here
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
};