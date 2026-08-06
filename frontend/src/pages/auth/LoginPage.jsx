import React, { useState } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Sprout } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});



export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useReactHookForm({
    resolver: zodResolver(loginSchema)
  });

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await login(data);
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      toast('Login failed', {
        body: error.message || 'Invalid email or password',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background animate-fade-in">
      {/* Left Panel - Hero Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden flex-col justify-center p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          {/* Decorative SVG Circles */}
          <svg className="absolute -top-24 -left-24 w-96 h-96 text-white" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="absolute bottom-10 right-10 w-64 h-64 text-white" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">AgriConnect</h1>
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            Empowering the <br /> Agricultural Future.
          </h2>
          <p className="text-lg text-white/80 font-medium">
            Join thousands of farmers, buyers, and experts on a platform dedicated to sustainable growth and transparent markets.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AgriConnect</h1>
          </div>

          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border/50 p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className={cn(
                      'w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                      errors.email && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                    )}
                    placeholder="name@example.com" />
                  
                </div>
                {errors.email &&
                <p className="text-sm text-destructive ml-1">{errors.email.message}</p>
                }
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={cn(
                      'w-full pl-11 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                      errors.password && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                    )}
                    placeholder="••••••••" />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                    
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password &&
                <p className="text-sm text-destructive ml-1">{errors.password.message}</p>
                }
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary/50 bg-background" />
                  
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                    Remember me
                  </label>
                </div>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]">
                
                {isLoading ?
                <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Signing in...
                  </> :

                <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                }
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-semibold text-primary hover:text-primary/80 transition-colors">
                
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>);

}