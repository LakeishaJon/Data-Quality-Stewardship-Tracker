const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🎉 Your server is working!' });
});

// TEST: Get all data issues
app.get('/api/issues', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('data_issues')
      .select('*');
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data: data,
      message: '✅ Connected to Supabase!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});