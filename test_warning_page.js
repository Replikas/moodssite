const axios = require('axios');

// Test the Google Drive warning page handling
const testUrl = 'https://drive.google.com/uc?export=download&id=1j0bKc5tzdLfcgMX5sZk_3usAvBoDpvLg';

async function testWarningPageHandling() {
    try {
        console.log('Testing Google Drive warning page handling...');
        console.log('URL:', testUrl);
        
        const response = await axios({
            method: 'GET',
            url: testUrl,
            responseType: 'stream',
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
            console.log('\n✅ Detected HTML warning page - extracting download link...');
            
            let htmlContent = '';
            response.data.on('data', (chunk) => {
                htmlContent += chunk.toString();
            });
            
            response.data.on('end', async () => {
                try {
                    // Extract the download link from the warning page
                    const confirmMatch = htmlContent.match(/href="\/uc\?export=download&amp;confirm=([^&]+)&amp;id=([^"]+)"/); 
                    if (confirmMatch) {
                        const confirmCode = confirmMatch[1];
                        const fileId = confirmMatch[2];
                        const actualDownloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmCode}&id=${fileId}`;
                        
                        console.log('\n🎯 Extracted download URL:', actualDownloadUrl);
                        console.log('Confirm code:', confirmCode);
                        console.log('File ID:', fileId);
                        
                        // Test the actual download
                        console.log('\n🔄 Testing actual file download...');
                        const actualResponse = await axios({
                            method: 'GET',
                            url: actualDownloadUrl,
                            responseType: 'stream',
                            timeout: 10000
                        });
                        
                        console.log('✅ Actual download response status:', actualResponse.status);
                        console.log('✅ Actual content type:', actualResponse.headers['content-type']);
                        console.log('✅ Content length:', actualResponse.headers['content-length']);
                        
                        // Check first few bytes to verify it's not HTML
                        let firstBytes = '';
                        let bytesRead = 0;
                        actualResponse.data.on('data', (chunk) => {
                            if (bytesRead < 100) {
                                firstBytes += chunk.toString('utf8', 0, Math.min(chunk.length, 100 - bytesRead));
                                bytesRead += chunk.length;
                            }
                        });
                        
                        actualResponse.data.on('end', () => {
                            if (firstBytes.includes('<html') || firstBytes.includes('<!DOCTYPE')) {
                                console.log('❌ Still getting HTML content - download failed');
                                console.log('First 100 bytes:', firstBytes);
                            } else {
                                console.log('✅ SUCCESS! Getting binary file content');
                                console.log('First 50 bytes (hex):', Buffer.from(firstBytes, 'utf8').toString('hex').substring(0, 100));
                            }
                        });
                        
                    } else {
                        console.log('❌ Could not extract download link from warning page');
                        console.log('HTML content preview:', htmlContent.substring(0, 500));
                    }
                } catch (extractError) {
                    console.error('❌ Error extracting download link:', extractError.message);
                }
            });
        } else {
            console.log('✅ Direct file download (no warning page)');
            console.log('Content-Type:', contentType);
        }
        
    } catch (error) {
        console.error('❌ Error testing warning page handling:', error.message);
    }
}

testWarningPageHandling();