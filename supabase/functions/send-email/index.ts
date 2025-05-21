import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import sgMail from 'npm:@sendgrid/mail@8.1.1';

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

    // Initialize SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    sgMail.setApiKey(sendgridApiKey);

    const msg = {
      to: email,
      from: Deno.env.get('SENDGRID_FROM_EMAIL') || '',
      subject: subject,
      html: content,
    };

    await sgMail.send(msg);

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }), 
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