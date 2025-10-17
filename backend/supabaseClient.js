// ===============================
// Supabase Client Configuration
//  Error Handling
// ===============================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate Environment Variables
const validateEnvVariables = () => {
  const missing = [];
  
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('❌ Invalid SUPABASE_URL format. Must be a valid URL.');
    process.exit(1);
  }
};

validateEnvVariables();

// ===============================
// Admin Client (Service Role)
// Full database access - use with caution
// ===============================
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ===============================
// User Client (Anon Key)
// Respects Row Level Security policies
// ===============================
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// ===============================
// Create User-Specific Client
// ===============================
const createUserClient = (accessToken) => {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Valid access token is required');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
};

// ===============================
// Verify JWT Token
// ===============================
const verifyToken = async (token) => {
  if (!token || typeof token !== 'string') {
    return { user: null, error: 'Invalid token format' };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return { user: null, error: error.message };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return { user: null, error: 'Token verification failed' };
  }
};

// ===============================
// Health Check
// ===============================
const checkConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('data_issues')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

// ===============================
// Exports
// ===============================
module.exports = {
  supabase,
  supabaseAdmin,
  createUserClient,
  verifyToken,
  checkConnection
};