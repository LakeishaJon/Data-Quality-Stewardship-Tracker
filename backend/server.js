// server.js
// ===============================
// Data Quality & Stewardship Tracker Backend
// Full-Featured Production API
// ===============================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { Parser } = require('json2csv');
const { supabase, supabaseAdmin, verifyToken, checkConnection } = require('./supabaseClient');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===============================
// Security Middleware
// ===============================
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// ===============================
// Authentication Middleware
// ===============================
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { user, error } = await verifyToken(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token'
      });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// ===============================
// Validation Middleware
// ===============================
const validateIssueData = (req, res, next) => {
  const { dataset_name, description, owner, issue_type } = req.body;
  const errors = [];
  
  if (!dataset_name?.trim()) errors.push('dataset_name is required');
  if (!description?.trim()) errors.push('description is required');
  if (!owner?.trim()) errors.push('owner is required');
  if (!issue_type?.trim()) errors.push('issue_type is required');
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  
  next();
};

// ===============================
// Health Check
// ===============================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Data Quality Tracker API',
    version: '1.0.0',
    environment: NODE_ENV
  });
});

app.get('/api/health', async (req, res) => {
  const dbConnected = await checkConnection();
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ===============================
// Auth Routes
// ===============================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: full_name || email.split('@')[0] }
      }
    });
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: { id: data.user?.id, email: data.user?.email }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/signout', authenticateUser, async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.user_metadata?.full_name
    }
  });
});

// ===============================
// Categories Routes
// ===============================
app.get('/api/categories', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// ===============================
// Severity Levels Routes
// ===============================
app.get('/api/severity-levels', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('severity_levels')
      .select('*')
      .order('level', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch severity levels' });
  }
});

// ===============================
// Dashboard Stats
// ===============================
app.get('/api/dashboard/stats', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('dashboard_stats')
      .select('*');
    
    if (error) throw error;
    
    // Get overall stats
    const { data: allIssues } = await supabaseAdmin
      .from('data_issues')
      .select('status, accuracy_score, completeness_score, timeliness_score');
    
    const totalIssues = allIssues?.length || 0;
    const openIssues = allIssues?.filter(i => i.status === 'open').length || 0;
    const resolvedIssues = allIssues?.filter(i => i.status === 'resolved').length || 0;
    
    const avgScores = allIssues?.reduce((acc, issue) => {
      acc.accuracy += issue.accuracy_score || 0;
      acc.completeness += issue.completeness_score || 0;
      acc.timeliness += issue.timeliness_score || 0;
      acc.count += 1;
      return acc;
    }, { accuracy: 0, completeness: 0, timeliness: 0, count: 0 });
    
    res.json({
      success: true,
      data: {
        datasetStats: data,
        overallStats: {
          totalIssues,
          openIssues,
          resolvedIssues,
          avgAccuracy: avgScores?.count ? (avgScores.accuracy / avgScores.count).toFixed(2) : 0,
          avgCompleteness: avgScores?.count ? (avgScores.completeness / avgScores.count).toFixed(2) : 0,
          avgTimeliness: avgScores?.count ? (avgScores.timeliness / avgScores.count).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// ===============================
// Issues Routes (CRUD)
// ===============================
app.get('/api/issues', authenticateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'created_at', 
      order = 'desc',
      dataset,
      category,
      severity,
      status,
      owner
    } = req.query;
    
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    
    let query = supabaseAdmin
      .from('data_issues')
      .select(`
        *,
        category:categories(id, name),
        severity:severity_levels(id, name, level, color)
      `, { count: 'exact' });
    
    // Apply filters
    if (dataset) query = query.ilike('dataset_name', `%${dataset}%`);
    if (category) query = query.eq('category_id', category);
    if (severity) query = query.eq('severity_id', severity);
    if (status) query = query.eq('status', status);
    if (owner) query = query.ilike('owner', `%${owner}%`);
    
    const { data, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(from, to);
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch issues' });
  }
});

app.get('/api/issues/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('data_issues')
      .select(`
        *,
        category:categories(id, name),
        severity:severity_levels(id, name, level, color)
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch issue' });
  }
});

app.post('/api/issues', authenticateUser, validateIssueData, async (req, res) => {
  try {
    const {
      dataset_name,
      description,
      owner,
      issue_type,
      category_id,
      severity_id,
      accuracy_score,
      completeness_score,
      timeliness_score,
      status
    } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('data_issues')
      .insert([{
        dataset_name,
        description,
        owner,
        issue_type,
        category_id: category_id || null,
        severity_id: severity_id || null,
        accuracy_score: accuracy_score || null,
        completeness_score: completeness_score || null,
        timeliness_score: timeliness_score || null,
        status: status || 'open',
        created_by: req.user.id
      }])
      .select(`
        *,
        category:categories(id, name),
        severity:severity_levels(id, name, level, color)
      `)
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create issue' });
  }
});

app.put('/api/issues/:id', authenticateUser, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    
    const { data, error } = await supabaseAdmin
      .from('data_issues')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        category:categories(id, name),
        severity:severity_levels(id, name, level, color)
      `)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    
    res.json({
      success: true,
      message: 'Issue updated successfully',
      data
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update issue' });
  }
});

app.delete('/api/issues/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('data_issues')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete issue' });
  }
});

// ===============================
// Export Routes
// ===============================
app.get('/api/export/csv', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_issues_for_export');
    
    if (error) throw error;
    
    const fields = [
      'dataset_name',
      'description',
      'owner',
      'issue_type',
      'category',
      'severity',
      'accuracy_score',
      'completeness_score',
      'timeliness_score',
      'status',
      'created_at'
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=data-quality-issues.csv');
    res.send(csv);
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

// ===============================
// 404 & Error Handlers
// ===============================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ===============================
// Graceful Shutdown
// ===============================
const gracefulShutdown = () => {
  console.log('\n⏳ Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ===============================
// Start Server
// ===============================
const server = app.listen(PORT, async () => {
  console.log('===============================');
  console.log('🚀 Data Quality Tracker API');
  console.log('===============================');
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log('===============================');
  
  const dbConnected = await checkConnection();
  if (!dbConnected) console.error('⚠️  Database connection failed');
});

module.exports = app;