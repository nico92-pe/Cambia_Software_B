import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client with service role
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

    // Verify the request is from a super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized - Invalid token');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    if (profile.role !== 'super_admin' && profile.role !== 'admin') {
      throw new Error('Unauthorized - Only administrators can access this resource');
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET': {
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
          throw new Error(`Failed to list users: ${usersError.message}`);
        }

        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        return new Response(
          JSON.stringify({ users, profiles }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'POST': {
        const { email, password, metadata } = await req.json();

        if (!email || !password || !metadata) {
          throw new Error('Missing required fields');
        }

        // Check if user exists using admin.listUsers()
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          throw new Error(`Failed to check existing users: ${listError.message}`);
        }

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          throw new Error('Usuario ya existe');
        }

        // Create auth user
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: metadata,
        });

        if (createError) {
          throw new Error(`Failed to create user: ${createError.message}`);
        }

        try {
          // Create or update profile using upsert
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: metadata.full_name,
              phone: metadata.phone,
              birthday: metadata.birthday,
              cargo: metadata.cargo,
              role: metadata.role,
              must_change_password: true,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (profileError) {
            // Clean up auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }

          return new Response(
            JSON.stringify({ 
              user: data.user,
              profile: {
                id: data.user.id,
                ...metadata,
              }
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          // Clean up auth user if anything fails
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          throw error;
        }
      }

      case 'PATCH': {
        const url = new URL(req.url);
        const userId = url.pathname.split('/').pop();
        
        if (!userId) {
          throw new Error('User ID is required');
        }

        const { profile_data, email } = await req.json();
        if (!profile_data) {
          throw new Error('Profile data is required');
        }

        // Update email in auth if provided
        if (email) {
          const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: email,
            email_confirm: true,
          });

          if (emailError) {
            throw new Error(`Failed to update email: ${emailError.message}`);
          }
        }

        // Update profile in database
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            ...profile_data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({ profile: updatedProfile }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'DELETE': {
        const userId = new URL(req.url).pathname.split('/').pop();
        if (!userId) {
          throw new Error('User ID is required');
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
          throw new Error(`Failed to delete user: ${deleteError.message}`);
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        return new Response('Method not allowed', { 
          status: 405,
          headers: corsHeaders
        });
    }
  } catch (error) {
    console.error('Error in admin-users function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: error.message.includes('Unauthorized') ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});