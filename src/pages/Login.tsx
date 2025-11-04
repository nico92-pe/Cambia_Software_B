import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Briefcase, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

interface LoginFormData {
  email: string;
  password: string;
}

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the store
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      setForgotPasswordError('Por favor ingresa tu correo electrónico');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordMessage(null);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-recovery/request-code`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el código');
      }

      setForgotPasswordMessage(
        'Si el correo está registrado, recibirás un código de verificación en breve. Revisa tu bandeja de entrada.'
      );

      // Redirect to verification page after 2 seconds
      setTimeout(() => {
        navigate(`/verify-code?email=${encodeURIComponent(forgotPasswordEmail)}`);
      }, 2000);
    } catch (error) {
      setForgotPasswordError(
        error instanceof Error ? error.message : 'Error al enviar el código de recuperación'
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };
  
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                <Mail size={28} />
              </div>
              <h1 className="text-2xl font-bold">Recuperar Contraseña</h1>
              <p className="text-muted-foreground mt-2">
                Ingresa tu correo electrónico y te enviaremos un código de verificación
              </p>
            </div>
            
            {forgotPasswordMessage && (
              <Alert variant="success" className="mb-6">
                {forgotPasswordMessage}
              </Alert>
            )}
            
            {forgotPasswordError && (
              <Alert variant="destructive" className="mb-6">
                {forgotPasswordError}
              </Alert>
            )}
            
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="forgotEmail" className="block text-sm font-medium">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <input
                    id="forgotEmail"
                    type="email"
                    className="input pl-10"
                    placeholder="ejemplo@empresa.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" loading={forgotPasswordLoading}>
                Enviar Código de Verificación
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
              <Briefcase size={28} />
            </div>
            <h1 className="text-2xl font-bold">Bienvenido a Cambia</h1>
            <p className="text-muted-foreground mt-2">
              Inicia sesión para acceder al sistema
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="text"
                  className={`input pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  placeholder="ejemplo@empresa.com"
                  {...register('email', {
                    required: 'El correo es requerido',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Ingrese un correo válido',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-10 ${errors.password ? 'border-destructive' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  onClick={toggleShowPassword}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" loading={isLoading}>
              Iniciar Sesión
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-primary hover:text-primary/80 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}