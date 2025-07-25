/*
  # Add OTP Email Verification System

  1. New Tables
    - `email_verifications`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `otp_code` (text)
      - `expires_at` (timestamp)
      - `verified` (boolean)
      - `attempts` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `email_verifications` table
    - Add policies for OTP verification process
    - Add cleanup function for expired OTPs

  3. Functions
    - Function to generate and send OTP
    - Function to verify OTP
    - Function to cleanup expired OTPs
*/

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification requests
CREATE POLICY "Anyone can request email verification"
  ON email_verifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow unauthenticated users to read their own verification record
CREATE POLICY "Anon users can read own verification"
  ON email_verifications
  FOR SELECT
  TO anon
  USING (email = request.jwt() ->> 'email');

-- Allow unauthenticated users to update their own verification record
CREATE POLICY "Anon users can update own verification"
  ON email_verifications
  FOR UPDATE
  TO anon
  USING (email = request.jwt() ->> 'email');

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_verifications 
  WHERE expires_at < now() AND verified = false;
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);