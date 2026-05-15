const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ctdhjcxtyqulxpiimrrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoUser() {
  try {
    // Create user
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@clinic.com',
      password: 'password123',
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('✅ User created:', user.user.id);

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        user_id: user.user.id,
        email: 'admin@clinic.com',
        role: 'doctor',
        first_name: 'Admin',
        last_name: 'Doctor',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('✅ Profile created:', profile);
    console.log('\n✅ Demo user setup complete!');
    console.log('Email: admin@clinic.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Error:', error);
  }
}

createDemoUser();
