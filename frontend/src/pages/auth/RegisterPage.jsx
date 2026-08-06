import React, { useState } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Sprout, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { ROUTES, USER_ROLES } from '@/constants';
import { UserRole } from '@/types';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().
  min(8, 'Password must be at least 8 characters').
  regex(/[A-Z]/, 'Must contain uppercase').
  regex(/[a-z]/, 'Must contain lowercase').
  regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
  role: z.string().min(1, 'Please select a role')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});



export default function RegisterPage() {
  const { signUp, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useReactHookForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: ''
    }
  });

  const password = watch('password', '');
  const selectedRole = watch('role');

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 33;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 33;
    if (/[0-9]/.test(password)) strength += 34;
    return strength;
  };

  const strength = getPasswordStrength();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const handleNext = async () => {
    const isStep1Valid = await trigger(['displayName', 'email', 'password', 'confirmPassword']);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        role: data.role
      });
      // Pass role and displayName in state so the verify page can initialize the profile
      navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.email)}`, {
        state: { 
          role: data.role, 
          displayName: data.displayName 
        }
      });
    } catch (error) {
      toast('Registration failed', {
        body: error.message || 'Could not create account',
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
            Join the <br /> Community.
          </h2>
          <p className="text-lg text-white/80 font-medium">
            Create an account to connect, trade, and grow your agricultural business with confidence.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AgriConnect</h1>
          </div>

          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border/50 p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold text-foreground">Create Account</h2>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-muted-foreground">
                {step === 1 ? 'Enter your details to get started' : 'Choose your role on the platform'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {step === 1 &&
              <div className="space-y-5 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                      type="text"
                      {...register('displayName')}
                      className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                        errors.displayName && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                      )}
                      placeholder="John Doe" />
                    
                    </div>
                    {errors.displayName && <p className="text-sm text-destructive ml-1">{errors.displayName.message}</p>}
                  </div>

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
                    {errors.email && <p className="text-sm text-destructive ml-1">{errors.email.message}</p>}
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
                    {/* Password Strength Indicator */}
                    {password.length > 0 &&
                  <div className="mt-2 flex gap-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${strength > 0 ? strength < 60 ? 'bg-red-500 w-1/3' : strength < 90 ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full' : 'w-0'}`} />
                      </div>
                  }
                    {errors.password && <p className="text-sm text-destructive ml-1 mt-1">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={cn(
                        'w-full pl-11 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                        errors.confirmPassword && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                      )}
                      placeholder="••••••••" />
                    
                      <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                      
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive ml-1">{errors.confirmPassword.message}</p>}
                  </div>

                  <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]">
                  
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              }

              {step === 2 &&
              <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 gap-4">
                    {USER_ROLES.map((roleOpt) => {
                    const isSelected = selectedRole === roleOpt.value;
                    return (
                      <div
                        key={roleOpt.value}
                        onClick={() => setValue('role', roleOpt.value, { shouldValidate: true })}
                        className={cn(
                          "cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
                          isSelected ?
                          "border-primary bg-primary/5 shadow-primary/10" :
                          "border-border bg-card hover:border-primary/50"
                        )}>
                        
                          <div className="flex items-start gap-4">
                            <div className={cn(
                            "text-2xl p-2 rounded-lg",
                            isSelected ? "bg-primary/20" : "bg-secondary"
                          )}>
                              {roleOpt.icon}
                            </div>
                            <div>
                              <h3 className={cn("font-semibold mb-1", isSelected ? "text-primary" : "text-foreground")}>
                                {roleOpt.label}
                              </h3>
                              <p className="text-sm text-muted-foreground">{roleOpt.description}</p>
                            </div>
                          </div>
                        </div>);

                  })}
                  </div>
                  {errors.role && <p className="text-sm text-destructive font-medium text-center">{errors.role.message}</p>}

                  <div className="flex gap-3">
                    <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-4 rounded-xl border border-input bg-background hover:bg-secondary transition-colors text-foreground flex items-center justify-center">
                    
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]">
                    
                      {isLoading ?
                    <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          Creating...
                        </> :

                    <>
                          Complete Setup
                          <ArrowRight className="h-5 w-5" />
                        </>
                    }
                    </button>
                  </div>
                </div>
              }
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-semibold text-primary hover:text-primary/80 transition-colors">
                
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>);

}