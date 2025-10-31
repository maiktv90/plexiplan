// Clean Architecture - Login Form Feature Component
import React, { useEffect, useState, useTransition } from 'react';
import { useNavigate }                     from 'react-router-dom';
import { useLoginMutation, isExtensionContext }                          from '@/api';
import { useAuthStore } from '@/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const { isAuthenticated, error } = useAuthStore();
  const loginMutation = useLoginMutation();
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
      await loginMutation.mutateAsync({ email, password });
      startTransition(() => {
        if (isExtensionContext()) {
          window.location.hash = '#/';
        } else {
          navigate('/');
        }
      });
    } catch (error) {
      // The error is already handled by the useLoginMutation's onError callback
    }
  };

  useEffect(() => {
    console.log({isAuthenticated})
    if(isAuthenticated) {
      console.log("is auth ", isAuthenticated)
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
          loading={loginMutation.isPending}
          disabled={loginMutation.isPending || isPending}
          className="w-full"
        >
          {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a
              href="#/register"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
            >
              Sign up here
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
};