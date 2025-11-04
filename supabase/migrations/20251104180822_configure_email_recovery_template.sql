/*
  # Configure Email Recovery Template Settings
  
  1. Overview
    - This migration provides SQL commands to customize the password recovery email template
    - Email subject will be: "Recuperacion Contraseña Cambia"
    - Email will include proper redirect URL for password reset
  
  2. Configuration Steps Required in Supabase Dashboard
    
    **Step 1: Configure URL Settings**
    Navigate to: Authentication > URL Configuration
    
    - Site URL: https://your-production-domain.com
      (Or use: https://iauykliievzykkuiekol.supabase.co for now)
    
    - Add these Redirect URLs:
      • http://localhost:5173/reset-password (for local dev)
      • https://your-production-domain.com/reset-password (for production)
      • https://iauykliievzykkuiekol.supabase.co/reset-password (Supabase domain)
    
    **Step 2: Customize Email Template**
    Navigate to: Authentication > Email Templates > Reset Password
    
    Update the template with:
    
    Subject Line:
    ```
    Recuperacion Contraseña Cambia
    ```
    
    Email Body (HTML):
    ```html
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Recuperación de Contraseña</title>
      <style>
        body { background-color: #f4f4f4; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .content { padding: 20px; line-height: 1.6; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cambia</h1>
        </div>
        <div class="content">
          <h2>Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
          <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">Restablecer Contraseña</a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #2563eb;">{{ .ConfirmationURL }}</p>
          <p><strong>Este enlace expirará en 1 hora.</strong></p>
          <p>Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo de forma segura.</p>
        </div>
        <div class="footer">
          <p>© 2024 Cambia. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    ```
    
    **Step 3: Verify Settings**
    - Ensure "Enable email confirmations" is OFF in Authentication > Settings
    - Verify SMTP is configured or using Supabase email service
  
  3. Testing the Flow
    
    a) From Login Page:
       1. Click "¿Olvidaste tu contraseña?"
       2. Enter registered email
       3. Check email inbox for "Recuperacion Contraseña Cambia"
       4. Click button or copy link
       5. Should redirect to /reset-password page
       6. Enter new password
       7. Login with new password
    
    b) Verify Email Contents:
       - Subject: "Recuperacion Contraseña Cambia"
       - Body includes button and link
       - Link format: https://your-domain.com/reset-password#access_token=...&type=recovery
  
  4. Troubleshooting
    
    - Link goes to localhost:
      → Update Site URL in Supabase Dashboard
    
    - Email not received:
      → Check SMTP configuration
      → Check spam/junk folder
      → Verify email exists in auth.users
    
    - "Invalid or expired token" error:
      → Ensure redirect URL matches exactly
      → Check link wasn't clicked after 1 hour
      → Request new reset link
    
    - Wrong email subject:
      → Verify template was saved in Dashboard
      → Clear email queue and try again
*/

-- This is a documentation-only migration
-- All configuration must be done in Supabase Dashboard

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'EMAIL RECOVERY TEMPLATE CONFIGURATION';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ACTION REQUIRED: Configure in Supabase Dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '1. Go to: Authentication > URL Configuration';
  RAISE NOTICE '   → Set Site URL to your production domain';
  RAISE NOTICE '   → Add /reset-password to Redirect URLs';
  RAISE NOTICE '';
  RAISE NOTICE '2. Go to: Authentication > Email Templates > Reset Password';
  RAISE NOTICE '   → Subject: "Recuperacion Contraseña Cambia"';
  RAISE NOTICE '   → Copy HTML template from migration file';
  RAISE NOTICE '   → Ensure {{ .ConfirmationURL }} is present';
  RAISE NOTICE '';
  RAISE NOTICE '3. Test the flow:';
  RAISE NOTICE '   → Request password reset';
  RAISE NOTICE '   → Check email with correct subject';
  RAISE NOTICE '   → Click link and reset password';
  RAISE NOTICE '';
  RAISE NOTICE 'Current Supabase URL: https://iauykliievzykkuiekol.supabase.co';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
END $$;
