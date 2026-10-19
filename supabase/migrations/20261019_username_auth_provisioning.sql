-- InternSync Migration: Username-based Account Provisioning & Isolation
-- Migration: 20261019_username_auth_provisioning.sql

-- 1. Ensure username column exists on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- 2. Create unique case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (LOWER(username)) WHERE username IS NOT NULL;

-- 3. Create secure stored procedure for atomic username provisioning
CREATE OR REPLACE FUNCTION public.provision_username_student(
  p_username text,
  p_password text,
  p_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_norm_username text;
  v_email text;
  v_user_id uuid;
  v_identity_id uuid;
  v_encrypted_pw text;
  v_existing_id uuid;
BEGIN
  -- 1. Validate inputs
  v_norm_username := lower(trim(p_username));
  IF length(v_norm_username) < 3 OR length(v_norm_username) > 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username must be between 3 and 30 characters.');
  END IF;

  IF v_norm_username !~ '^[a-z0-9_]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username may only contain letters, numbers, and underscores.');
  END IF;

  IF length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters long.');
  END IF;

  IF length(trim(p_full_name)) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Full name is required.');
  END IF;

  v_email := v_norm_username || '@demo.internsync.invalid';

  -- 2. Check if username or email already exists
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username "' || v_norm_username || '" is already taken. Please choose another username.');
  END IF;

  SELECT id INTO v_existing_id FROM public.profiles WHERE lower(username) = v_norm_username LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username "' || v_norm_username || '" is already taken. Please choose another username.');
  END IF;

  -- 3. Generate IDs and password hash
  v_user_id := gen_random_uuid();
  v_identity_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- 4. Insert into auth.users (email confirmed immediately)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    is_sso_user,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', trim(p_full_name), 'username', v_norm_username, 'account_type', 'username_temporary'),
    false,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  );

  -- 5. Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- 6. Insert baseline into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    university,
    degree,
    branch,
    current_year,
    graduation_year,
    location,
    target_role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    trim(p_full_name),
    v_norm_username,
    'Student University',
    'B.Tech / B.E.',
    'Computer Science & Engineering',
    3,
    2026,
    'Bengaluru, India',
    'Software Development Intern',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'userId', v_user_id,
    'username', v_norm_username,
    'email', v_email
  );
END;
$$;
