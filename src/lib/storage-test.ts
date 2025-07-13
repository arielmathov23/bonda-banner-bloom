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

// Storage Test Utility - Add to debug Supabase Storage issues
// This helps diagnose why images fail to load in the BannerEditor

export interface ImageTestResult {
  method: string;
  success: boolean;
  error?: string;
  loadTime?: number;
}

export async function testImageLoading(imageUrl: string): Promise<ImageTestResult[]> {
  const results: ImageTestResult[] = [];
  
  console.log('🔍 Testing image loading methods for:', imageUrl);
  
  // Test 1: Direct load without CORS
  const result1 = await testDirectLoad(imageUrl, false);
  results.push(result1);
  
  // Test 2: Direct load with CORS
  const result2 = await testDirectLoad(imageUrl, true);
  results.push(result2);
  
  // Test 3: Fetch test
  const result3 = await testFetchMethod(imageUrl);
  results.push(result3);
  
  console.log('📊 Image loading test results:', results);
  return results;
}

async function testDirectLoad(imageUrl: string, useCors: boolean): Promise<ImageTestResult> {
  const method = useCors ? 'Direct Load (with CORS)' : 'Direct Load (no CORS)';
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const img = new Image();
    
    if (useCors) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      const loadTime = Date.now() - startTime;
      console.log(`✅ ${method} succeeded in ${loadTime}ms`);
      resolve({
        method,
        success: true,
        loadTime
      });
    };
    
    img.onerror = (error) => {
      const loadTime = Date.now() - startTime;
      console.log(`❌ ${method} failed after ${loadTime}ms:`, error);
      resolve({
        method,
        success: false,
        error: error.toString(),
        loadTime
      });
    };
    
    img.src = imageUrl;
  });
}

async function testFetchMethod(imageUrl: string): Promise<ImageTestResult> {
  const method = 'Fetch Method';
  const startTime = Date.now();
  
  try {
    const response = await fetch(imageUrl);
    const loadTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ ${method} succeeded in ${loadTime}ms`);
      return {
        method,
        success: true,
        loadTime
      };
    } else {
      console.log(`❌ ${method} failed with status ${response.status} after ${loadTime}ms`);
      return {
        method,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        loadTime
      };
    }
  } catch (error) {
    const loadTime = Date.now() - startTime;
    console.log(`❌ ${method} failed after ${loadTime}ms:`, error);
    return {
      method,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      loadTime
    };
  }
}

// Quick test function to call from browser console
export function quickImageTest(imageUrl: string) {
  console.log('🚀 Starting quick image test...');
  testImageLoading(imageUrl).then((results) => {
    console.table(results);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📈 Summary: ${successful.length} successful, ${failed.length} failed`);
    
    if (successful.length === 0) {
      console.log('🚨 All methods failed! This indicates a serious storage configuration issue.');
      console.log('💡 Recommendations:');
      console.log('1. Run verify_supabase_storage.sql in your Supabase SQL Editor');
      console.log('2. Check if the banners bucket exists and is public');
      console.log('3. Verify RLS policies are correctly configured');
    } else if (failed.length > 0) {
      console.log('⚠️ Some methods failed. This might indicate CORS configuration issues.');
    } else {
      console.log('✅ All methods succeeded! The image should load correctly.');
    }
  });
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).quickImageTest = quickImageTest;
} 