import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase admin client
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

    // Verify the request is from an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !['super_admin', 'admin'].includes(profile.role)) {
      throw new Error('Unauthorized - Only admins can send emails');
    }

    const { email, subject, content } = await req.json();

    if (!email || !subject || !content) {
      throw new Error('Missing required parameters');
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      throw new Error('RESEND_API_KEY not configured. Please add it to Supabase Secrets.');
    }

    const resend = new Resend(resendApiKey);

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com';
    
    if (!fromEmail.includes('@')) {
      console.error('RESEND_FROM_EMAIL is invalid:', fromEmail);
      throw new Error('RESEND_FROM_EMAIL must be a valid email address. Please configure it in Supabase Secrets.');
    }

    console.log('Attempting to send email from:', fromEmail, 'to:', email);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: subject,
      html: content,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }
    
    if (!data) {
      throw new Error('No data returned from Resend API - check your API key and domain verification');
    }

    console.log('Email sent successfully with ID:', data.id);

    return new Response(
      JSON.stringify({ 
        message: 'Email sent successfully',
        id: data?.id 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: error.message.includes('Unauthorized') ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});