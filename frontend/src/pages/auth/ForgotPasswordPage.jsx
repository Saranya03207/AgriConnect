import React, { useState } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';

const requestSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format')
});

const resetSchema = z.object({
  code: z.string().length(6, 'Code must be exactly 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});




export default function ForgotPasswordPage() {
  const [stage, setStage] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const requestForm = useReactHookForm({
    resolver: zodResolver(requestSchema)
  });

  const resetForm = useReactHookForm({
    resolver: zodResolver(resetSchema)
  });

  const onRequestSubmit = async (data) => {
    try {
      setIsLoading(true);
      await forgotPassword(data.email);
      setEmail(data.email);
      setStage(2);
      toast('Code sent', {
        body: 'Check your email for the reset code',
        variant: 'success'
      });
    } catch (error) {
      toast('Request failed', {
        body: error.message || 'Could not process request',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data) => {
    try {
      setIsLoading(true);
      await resetPassword(email, data.code, data.password);
      toast('Password updated', {
        body: 'Your password has been reset successfully',
        variant: 'success'
      });
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast('Reset failed', {
        body: error.message || 'Could not reset password',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border/50 p-8">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {stage === 1 ? 'Reset your password' : 'Enter new password'}
            </h2>
            <p className="text-muted-foreground">
              {stage === 1 ?
              "Enter your email address and we'll send you a recovery code." :
              `Enter the code sent to ${email} and your new password.`}
            </p>
          </div>

          {stage === 1 ?
          <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                  type="email"
                  {...requestForm.register('email')}
                  className={cn(
                    'w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                    requestForm.formState.errors.email && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                  )}
                  placeholder="name@example.com" />
                
                </div>
                {requestForm.formState.errors.email &&
              <p className="text-sm text-destructive ml-1">{requestForm.formState.errors.email.message}</p>
              }
              </div>

              <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]">
              
                {isLoading ?
              <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Sending...
                  </> :

              <>
                    Send Reset Code
                    <ArrowRight className="h-5 w-5" />
                  </>
              }
              </button>
            </form> :

          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground ml-1">6-Digit Reset Code</label>
                <input
                type="text"
                maxLength={6}
                {...resetForm.register('code')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                  resetForm.formState.errors.code && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                )}
                placeholder="••••••" />
              
                {resetForm.formState.errors.code &&
              <p className="text-sm text-destructive ml-1 text-center">{resetForm.formState.errors.code.message}</p>
              }
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                  type={showPassword ? 'text' : 'password'}
                  {...resetForm.register('password')}
                  className={cn(
                    'w-full pl-11 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                    resetForm.formState.errors.password && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                  )}
                  placeholder="••••••••" />
                
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {resetForm.formState.errors.password &&
              <p className="text-sm text-destructive ml-1">{resetForm.formState.errors.password.message}</p>
              }
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground ml-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...resetForm.register('confirmPassword')}
                  className={cn(
                    'w-full pl-11 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                    resetForm.formState.errors.confirmPassword && 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                  )}
                  placeholder="••••••••" />
                
                  <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword &&
              <p className="text-sm text-destructive ml-1">{resetForm.formState.errors.confirmPassword.message}</p>
              }
              </div>

              <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]">
              
                {isLoading ?
              <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Resetting...
                  </> :

              <>
                    Reset Password
                    <ArrowRight className="h-5 w-5" />
                  </>
              }
              </button>
            </form>
          }

          <div className="mt-8 text-center text-sm">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors">
              
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>);

}