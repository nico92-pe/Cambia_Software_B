/*
  # Disable Email Confirmation for Email Updates

  1. Changes
    - Configures Supabase Auth to allow email updates without confirmation
    - Users can immediately use their new email to login after changing it

  2. Notes
    - This is configured at the auth settings level
    - No RLS or table changes needed
    - Email changes take effect immediately
*/

-- Note: Email confirmation settings are configured at the Supabase project level
-- This migration serves as documentation for the configuration change
-- The actual setting needs to be disabled in Supabase Dashboard:
-- Authentication > Settings > Enable email confirmations = OFF
-- Or via Supabase CLI: supabase config set auth.enable_confirmations false

-- Create a note in the database for documentation purposes
DO $$
BEGIN
  RAISE NOTICE 'Email confirmation for updates should be disabled in Supabase Auth settings';
  RAISE NOTICE 'This allows users to immediately login with their new email after updating';
END $$;
