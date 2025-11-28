import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import 'dotenv/config';

async function checkR2() {
  console.log('🔍 Checking R2 Configuration...');

  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ? '******' : undefined,
    bucket: process.env.R2_BUCKET_NAME,
    cdnUrl: process.env.PUBLIC_PHOTO_CDN_URL
  };

  console.log('Environment Variables:', config);

  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    console.error('❌ Missing R2 credentials in .env file');
    return;
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log(`\n📡 Connecting to bucket: ${process.env.R2_BUCKET_NAME}...`);
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 10
    });

    const response = await s3Client.send(command);
    
    console.log('✅ Connection successful!');
    
    if (response.Contents && response.Contents.length > 0) {
      console.log(`\n📁 Found ${response.KeyCount} files (showing first 10):`);
      response.Contents.forEach(file => {
        console.log(`   - ${file.Key} (${(file.Size / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log('\n⚠️  Bucket is empty.');
    }

    if (!process.env.PUBLIC_PHOTO_CDN_URL) {
      console.log('\n⚠️  PUBLIC_PHOTO_CDN_URL is missing in .env');
      console.log('   Your site is still trying to load images locally.');
    } else {
      console.log(`\n✅ CDN URL Configured: ${process.env.PUBLIC_PHOTO_CDN_URL}`);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

checkR2();

