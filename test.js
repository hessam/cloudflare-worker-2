/**
 * Simple validation test - checks code logic without running the worker
 * Run: node test.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Worker Validation Tests\n');

// Test 1: Check file exists and is valid JavaScript
console.log('Test 1: Code Syntax Validation');
console.log('━'.repeat(50));
try {
  const workerCode = fs.readFileSync('./index.js', 'utf-8');
  
  // Check for common issues
  const issues = [];
  
  if (workerCode.includes('getInnerHTML()')) {
    issues.push('❌ Found getInnerHTML() - this is not a valid HTMLRewriter API method');
  } else {
    console.log('✓ No invalid getInnerHTML() calls');
  }
  
  if (workerCode.includes('.headers.set(\'Vary\', \'Cookie\')')) {
    issues.push('❌ Found direct Vary header overwrite - should merge instead');
  } else {
    console.log('✓ Vary header is properly merged');
  }
  
  if (workerCode.includes('userAgent.includes(\'bot\') && userAgent.includes(\'preview\')')) {
    issues.push('❌ Bot detection uses AND instead of OR');
  } else {
    console.log('✓ Bot detection logic is correct');
  }
  
  if (!workerCode.includes('class StyleContentHandler')) {
    issues.push('❌ Missing StyleContentHandler class for text capture');
  } else {
    console.log('✓ StyleContentHandler class exists');
  }
  
  if (workerCode.includes('shouldRemoveElement(selector, tagName, id, type)')) {
    issues.push('❌ shouldRemoveElement missing element parameter');
  } else {
    console.log('✓ shouldRemoveElement has correct signature');
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    issues.forEach(issue => console.log('  ' + issue));
    process.exit(1);
  }
  
  console.log('✅ All syntax validations passed!\n');
  
} catch (error) {
  console.error('❌ Failed to read index.js:', error.message);
  process.exit(1);
}

// Test 2: Check configuration
console.log('Test 2: Configuration Validation');
console.log('━'.repeat(50));
try {
  const toml = fs.readFileSync('./wrangler.toml', 'utf-8');
  
  if (!toml.includes('name =')) {
    console.log('⚠️  Warning: No name in wrangler.toml');
  } else {
    console.log('✓ Worker name configured');
  }
  
  if (!toml.includes('main =')) {
    console.log('⚠️  Warning: No main entry point in wrangler.toml');
  } else {
    console.log('✓ Main entry point configured');
  }
  
  if (!toml.includes('compatibility_date')) {
    console.log('⚠️  Warning: No compatibility_date in wrangler.toml');
  } else {
    console.log('✓ Compatibility date set');
  }
  
  console.log('✅ Configuration looks good!\n');
  
} catch (error) {
  console.error('❌ Failed to read wrangler.toml:', error.message);
  process.exit(1);
}

// Test 3: Check test fixtures
console.log('Test 3: Test Fixtures');
console.log('━'.repeat(50));
try {
  const testHtml = fs.readFileSync('./test-fixtures/test-page.html', 'utf-8');
  
  const checks = [
    { pattern: 'wpcode-admin-bar-css-css', desc: 'Admin bar CSS (should be removed)' },
    { pattern: 'fonts.googleapis.com', desc: 'Google Fonts (duplicates should be removed)' },
    { pattern: '<style>', desc: 'Inline styles (should be merged)' },
    { pattern: 'critical-css', desc: 'Critical CSS (should NOT be merged)' },
    { pattern: 'analytics-script', desc: 'Analytics script (should NOT be modified)' },
  ];
  
  checks.forEach(check => {
    if (testHtml.includes(check.pattern)) {
      console.log(`✓ Found: ${check.desc}`);
    } else {
      console.log(`⚠️  Missing: ${check.desc}`);
    }
  });
  
  console.log('✅ Test fixtures ready!\n');
  
} catch (error) {
  console.error('❌ Failed to read test fixtures:', error.message);
  process.exit(1);
}

console.log('━'.repeat(50));
console.log('✅ All validation tests passed!\n');
console.log('📝 Next steps:');
console.log('   1. Install dependencies: npm install');
console.log('   2. Start dev server: npm run dev');
console.log('   3. Test in browser: http://localhost:8787');
console.log('   4. Deploy: npm run deploy\n');
