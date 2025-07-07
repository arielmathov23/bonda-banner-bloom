import { supabase } from '@/integrations/supabase/client';

export async function testStorageSetup() {
  console.log('🔍 Testing Supabase Storage Setup...');
  
  try {
    // Test 1: List buckets
    console.log('📋 Listing all buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return false;
    }
    
    console.log('✅ Available buckets:', buckets?.map(b => b.name));
    
    // Test 2: Check if partner-assets bucket exists
    const partnerAssetsBucket = buckets?.find(b => b.name === 'partner-assets');
    if (!partnerAssetsBucket) {
      console.error('❌ partner-assets bucket does not exist!');
      console.log('💡 Please create it in Supabase Dashboard → Storage');
      return false;
    }
    
    console.log('✅ partner-assets bucket found:', partnerAssetsBucket);
    
    // Test 3: Test upload with a small test file
    console.log('📤 Testing file upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const fileName = `test/${Date.now()}-test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partner-assets')
      .upload(fileName, testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', {
        message: uploadError.message,
        error: uploadError
      });
      return false;
    }
    
    console.log('✅ Upload test successful:', uploadData);
    
    // Test 4: Test getting public URL
    const { data: urlData } = supabase.storage
      .from('partner-assets')
      .getPublicUrl(fileName);
    
    console.log('🔗 Generated URL:', urlData.publicUrl);
    
    // Test 5: Test URL accessibility
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log('✅ URL accessible:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('❌ URL not accessible:', fetchError);
      return false;
    }
    
    // Test 6: Cleanup test file
    const { error: deleteError } = await supabase.storage
      .from('partner-assets')
      .remove([fileName]);
    
    if (deleteError) {
      console.warn('⚠️ Could not cleanup test file:', deleteError);
    } else {
      console.log('🗑️ Test file cleaned up');
    }
    
    console.log('🎉 All storage tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Storage test failed with exception:', error);
    return false;
  }
}

// Auto-run test when imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    testStorageSetup();
  }, 1000);
} 