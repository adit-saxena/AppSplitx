// supabase/functions/send-otp/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Restrict CORS to your production domain only
const ALLOWED_ORIGIN = 'https://app.splitx.live'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Cryptographically secure 6-digit OTP
function generateSecureOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(100000 + (array[0] % 900000))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Reject requests from unexpected origins
  const origin = req.headers.get('Origin')
  if (origin && origin !== ALLOWED_ORIGIN) {
    return new Response('Forbidden', { status: 403 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // --- Rate limiting: check recent send attempts ---
    const { data: existing } = await supabase
      .from('email_verifications')
      .select('created_at, attempts')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      const secondsSinceCreated = (Date.now() - new Date(existing.created_at).getTime()) / 1000
      // Block resend if last OTP was sent less than 60 seconds ago
      if (secondsSinceCreated < 60) {
        return new Response(
          JSON.stringify({ success: true, message: 'If this email is new, an OTP has been sent.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // --- Check if user already exists (without revealing it) ---
    // Use a targeted query on profiles to avoid listUsers() fetching all users
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', (await supabase.auth.admin.getUserByEmail(normalizedEmail)).data?.user?.id ?? '')
      .maybeSingle()

    // Use getUserByEmail (single targeted lookup) instead of listUsers()
    const { data: { user: existingUser } } = await supabase.auth.admin.getUserByEmail(normalizedEmail)

    if (existingUser) {
      // Return the same generic response — don't reveal that the account exists
      return new Response(
        JSON.stringify({ success: true, message: 'If this email is new, an OTP has been sent.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate secure OTP
    const otpCode = generateSecureOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Store or update OTP in database
    const { error: dbError } = await supabase
      .from('email_verifications')
      .upsert(
        {
          email: normalizedEmail,
          otp_code: otpCode,
          expires_at: expiresAt,
          verified: false,
          attempts: 0
        },
        { onConflict: 'email' }
      )

    if (dbError) {
      throw dbError
    }

    // TODO: Replace with real email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     from: 'noreply@splitx.live',
    //     to: normalizedEmail,
    //     subject: 'Your SplitX verification code',
    //     html: `<p>Your verification code is: <strong>${otpCode}</strong>. It expires in 10 minutes.</p>`
    //   })
    // })

    // Generic response — same message whether user existed or not
    return new Response(
      JSON.stringify({
        success: true,
        message: 'If this email is new, an OTP has been sent.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    // Log generic error without sensitive data
    console.error('send-otp error:', (error as Error).message)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})