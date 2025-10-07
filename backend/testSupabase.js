require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', process.env.SUPABASE_URL);
console.log('Key exists:', !!process.env.SUPABASE_KEY);
console.log('Key length:', process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.length : 0);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test the connection
async function testConnection() {
  try {
    console.log('\n📡 Attempting to connect to Supabase...');
    const { data, error } = await supabase
      .from('data_issues')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ ERROR:', error.message);
      console.log('Full error:', error);
    } else {
      console.log('✅ SUCCESS! Connected to Supabase!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.log('❌ CAUGHT ERROR:', err.message);
  }
}

testConnection();