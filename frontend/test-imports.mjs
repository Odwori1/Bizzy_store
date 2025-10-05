// Test script using dynamic imports
const tests = [
  { name: 'React', import: () => import('react') },
  { name: 'React Router', import: () => import('react-router-dom') },
  { name: 'TestComponent', import: () => import('./src/TestComponent.tsx') },
  { name: 'App Component', import: () => import('./src/App.tsx') }
];

async function runTests() {
  console.log('🧪 Running import tests...\\n');
  
  for (const test of tests) {
    try {
      await test.import();
      console.log(`✅ ${test.name} - Import successful`);
    } catch (error) {
      console.log(`❌ ${test.name} - Import failed: ${error.message}`);
    }
  }
  
  console.log('\\n📋 Test completed');
}

runTests();
