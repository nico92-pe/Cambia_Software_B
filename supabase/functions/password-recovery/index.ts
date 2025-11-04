import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email: string, code: string) {
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@cambia.com';
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Código de Recuperación de Contraseña</title>
      <style>
        body {
          background-color: #f4f4f4;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 32px 20px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .header h1 {
          margin: 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px 20px;
          line-height: 1.6;
          color: #374151;
        }
        .code-container {
          text-align: center;
          margin: 32px 0;
          padding: 24px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 2px dashed #d1d5db;
        }
        .code {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #2563eb;
          font-family: 'Courier New', monospace;
        }
        .code-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 8px;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
        }
        .info {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
          padding: 12px 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info p {
          margin: 0;
          color: #1e40af;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cambia</h1>
        </div>
        <div class="content">
          <h2 style="color: #1f2937; margin-top: 0;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Utiliza el siguiente código de verificación:</p>

          <div class="code-container">
            <div class="code">${code}</div>
            <div class="code-label">Código de Verificación</div>
          </div>

          <div class="warning">
            <p><strong>⏱️ Este código expirará en 10 minutos.</strong></p>
          </div>

          <div class="info">
            <p><strong>Instrucciones:</strong></p>
            <p>1. Regresa a la aplicación de Cambia</p>
            <p>2. Ingresa este código de 6 dígitos</p>
            <p>3. Crea tu nueva contraseña</p>
          </div>

          <p style="margin-top: 24px;">Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo de forma segura. Tu contraseña no será cambiada.</p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Por seguridad, nunca compartas este código con nadie. El equipo de Cambia nunca te pedirá este código.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Cambia. Todos los derechos reservados.</p>
          <p style="margin-top: 8px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { Resend } = await import('npm:resend@2.1.0');
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Código de Recuperación de Contraseña - Cambia',
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/request-code') && req.method === 'POST') {
      const { email } = await req.json();

      if (!email) {
        throw new Error('Email is required');
      }

      const { data: authUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers();

      if (userError) {
        console.error('Error listing users:', userError);
      }

      const userExists = authUsers?.users?.some(user => user.email === email);

      if (!userExists) {
        return new Response(
          JSON.stringify({
            message: 'Si el correo está registrado, recibirás un código de verificación en breve.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      const { data: recentCodes, error: countError } = await supabaseAdmin
        .from('password_recovery_codes')
        .select('created_at')
        .eq('email', email)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (countError) {
        console.error('Error checking recent codes:', countError);
      }

      if (recentCodes && recentCodes.length >= 3) {
        throw new Error('Demasiados intentos. Por favor espera una hora antes de intentar nuevamente.');
      }

      await supabaseAdmin
        .from('password_recovery_codes')
        .update({ used: true })
        .eq('email', email)
        .eq('used', false);

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const { error: insertError } = await supabaseAdmin
        .from('password_recovery_codes')
        .insert({
          email,
          code,
          expires_at: expiresAt.toISOString(),
          used: false,
          attempts: 0,
        });

      if (insertError) {
        console.error('Error inserting code:', insertError);
        throw insertError;
      }

      const emailResult = await sendVerificationEmail(email, code);

      if (!emailResult.success) {
        console.error('Failed to send email, but code was generated');
      }

      return new Response(
        JSON.stringify({
          message: 'Si el correo está registrado, recibirás un código de verificación en breve.',
          emailSent: emailResult.success
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (path.endsWith('/verify-code') && req.method === 'POST') {
      const { email, code } = await req.json();

      if (!email || !code) {
        throw new Error('Email and code are required');
      }

      const { data: recoveryCode, error: codeError } = await supabaseAdmin
        .from('password_recovery_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('used', false)
        .maybeSingle();

      if (codeError || !recoveryCode) {
        return new Response(
          JSON.stringify({ error: 'Código inválido o expirado' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      if (recoveryCode.attempts >= 5) {
        await supabaseAdmin
          .from('password_recovery_codes')
          .update({ used: true })
          .eq('id', recoveryCode.id);

        throw new Error('Demasiados intentos fallidos. Por favor solicita un nuevo código.');
      }

      if (new Date(recoveryCode.expires_at) < new Date()) {
        await supabaseAdmin
          .from('password_recovery_codes')
          .update({ used: true })
          .eq('id', recoveryCode.id);

        throw new Error('El código ha expirado. Por favor solicita uno nuevo.');
      }

      const verificationToken = crypto.randomUUID();

      await supabaseAdmin
        .from('password_recovery_codes')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', recoveryCode.id);

      return new Response(
        JSON.stringify({
          success: true,
          token: verificationToken,
          email: email
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (path.endsWith('/reset-password') && req.method === 'POST') {
      const { email, token, newPassword } = await req.json();

      if (!email || !token || !newPassword) {
        throw new Error('Email, token, and new password are required');
      }

      const { data: authUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers();

      if (userError) {
        throw new Error('Error al buscar usuario');
      }

      const user = authUsers?.users?.find(u => u.email === email);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contraseña actualizada exitosamente'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );

  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error inesperado'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
