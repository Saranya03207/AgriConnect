import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowLeft, CheckCircle2, Sprout } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/axios';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmEmail } = useAuth();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || '';
  const { role, displayName } = location.state || {};

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.LOGIN);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every((c) => c !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleVerify = async (verificationCode) => {
    if (verificationCode.length !== 6) return;

    try {
      setIsLoading(true);
      await confirmEmail({ email, code: verificationCode });

      // Profile Initialization
      if (role && displayName) {
        try {
          await apiClient.post('/users/profile-init', {
            email,
            role,
            displayName
          });
        } catch (initError) {
          console.error("Profile initialization error:", initError);
          // Non-blocking error, profile might already exist
        }
      }

      setIsSuccess(true);
      
      // Redirect after success animation
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { replace: true });
      }, 2000);

    } catch (error) {
      const errorMessage = error.message || 'Invalid verification code';
      toast('Verification failed', {
        body: errorMessage,
        variant: 'error'
      });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await authService.resendConfirmationCode(email);
      setCountdown(30);
      toast('Code sent', {
        body: 'A new verification code has been sent to your email.',
        variant: 'success'
      });
    } catch (error) {
      toast('Failed to resend', {
        body: error.message || 'Could not resend verification code',
        variant: 'error'
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="flex flex-col items-center text-center p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-foreground mb-4"
          >
            Email Verified Successfully
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-muted-foreground max-w-md"
          >
            Your AgriConnect account has been verified. We're preparing your profile.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex items-center gap-2 text-primary font-medium"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirecting to login...
          </motion.div>
        </motion.div>
      </div>
    );
  }

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
            Verify Your Email
          </h2>
          <p className="text-lg text-white/80 font-medium">
            We've sent a verification code to your email address. Verify to complete your account setup and join the community.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border/50 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
            
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-3">Verify Email</h2>
            <p className="text-muted-foreground mb-8">
              Enter the 6-digit verification code sent to <br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>

            <div className="flex justify-center gap-2 sm:gap-3 mb-8" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={cn(
                    "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border bg-background transition-all",
                    digit ? "border-primary ring-2 ring-primary/20 text-primary" : "border-input text-foreground focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify(code.join(''))}
              disabled={isLoading || code.join('').length !== 6}
              className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mb-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={isResending || countdown > 0 || isLoading}
              className="w-full py-3 px-6 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
            >
              {isResending ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : countdown > 0 ? (
                `Resend available in ${countdown} seconds`
              ) : (
                'Resend Code'
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-border text-sm">
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center justify-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}