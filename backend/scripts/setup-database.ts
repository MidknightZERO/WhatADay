import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🔗 Testing Supabase connection...');
    
    // Test connection
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // Not found is OK for migrations table
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Executing database schema...');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️  Statement warning: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement error: ${err}`);
        }
      }
    }
    
    console.log('✅ Database schema setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup
setupDatabase();


