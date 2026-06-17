import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function runTest() {
  const targetUrl = 'http://localhost:3000/api/shelter/intake/map';
  const testFileName = 'test-cage-card.jpg';
  // Look directly in the root of the frontend directory
  const filePath = join(process.cwd(), testFileName);

  console.log('🚀 Starting RescueHub AI Ingestion test...');

  if (!existsSync(filePath)) {
    console.error(`\n❌ Error: Missing test file!`);
    console.error(`Please place a sample image named "${testFileName}" directly in your frontend root folder.`);
    console.error(`Example: animal-rescue-app/frontend/${testFileName}\n`);
    process.exit(1);
  }

  try {
    const fileBuffer = readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('files', blob, testFileName);

    console.log(`📤 Uploading ${testFileName} to ${targetUrl}...`);
    console.log('⏳ Processing (remember, our route has a built-in 2-second rate-limit protection delay)...');

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('\n✅ AI Extraction Successful! Structured Data Received:\n');
    console.log(JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('\n❌ Test execution failed:');
    console.error(error.message || error);
  }
}

runTest();