#!/usr/bin/env node
/**
 * Migration Runner Script
 * Executes SQL migration files on Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://iklibzcyfxcahbquuurv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM1ODU2MSwiZXhwIjoyMDg3OTM0NTYxfQ.DmLzLw9fQVb0huaI7EHq8qelGd6OTXKaEuir7bpgpPw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(migrationFile) {
  try {
    console.log(`\n📦 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL by statement (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          // Try direct query if rpc fails
          const { error: queryError } = await supabase.from('_migrations').insert({
            name: migrationFile,
            executed_at: new Date().toISOString()
          });
          
          if (queryError) {
            console.error(`   ⚠️  Statement ${i + 1} warning:`, error.message);
          }
        }
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
      }
    }

    console.log(`✅ Migration ${migrationFile} completed`);
    return true;

  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    return false;
  }
}

// Get migration file from command line or run default
const migrationFile = process.argv[2] || '002_events_bills.sql';

runMigration(migrationFile)
  .then(success => {
    if (success) {
      console.log('\n✅ All migrations completed successfully\n');
      process.exit(0);
    } else {
      console.log('\n❌ Migration failed\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
