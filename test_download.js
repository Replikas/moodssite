const axios = require('axios');

// Test the Google Drive direct download URL
const testUrl = 'https://drive.google.com/uc?export=download&id=1j0bKc5tzdLfcgMX5sZk_3usAvBoDpvLg';

async function testDownload() {
    try {
        console.log('Testing download from:', testUrl);
        
        const response = await axios({
            method: 'GET',
            url: testUrl,
            responseType: 'stream',
            timeout: 30000
        });
        
        console.log('Response status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);
        console.log('Content-Disposition:', response.headers['content-disposition']);
        
        // Check if we're getting a redirect or warning page
        let dataReceived = '';
        let bytesReceived = 0;
        
        response.data.on('data', (chunk) => {
            bytesReceived += chunk.length;
            if (dataReceived.length < 1000) {
                dataReceived += chunk.toString();
            }
        });
        
        response.data.on('end', () => {
            console.log('Total bytes received:', bytesReceived);
            console.log('First 500 characters of response:');
            console.log(dataReceived.substring(0, 500));
            
            if (dataReceived.includes('Google Drive') && dataReceived.includes('virus')) {
                console.log('\n⚠️  WARNING: This appears to be a Google Drive warning page, not the actual file!');
                console.log('The file might be too large for Google to scan for viruses.');
            } else {
                console.log('\n✅ This appears to be the actual file content.');
            }
        });
        
    } catch (error) {
        console.error('Error testing download:', error.message);
    }
}

testDownload();