// Test the URL conversion function
function convertToDirectDownloadUrl(url) {
    if (!url) return url;
    
    // Check if it's a Google Drive sharing URL with /view format
    const driveViewMatch = url.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/);
    if (driveViewMatch) {
        const fileId = driveViewMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // Check if it's a Google Drive sharing URL with /open format
    const driveOpenMatch = url.match(/https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (driveOpenMatch) {
        const fileId = driveOpenMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // If it's already a direct download URL or different format, return as is
    return url;
}

// Test with actual URLs from database
const testUrls = [
    'https://drive.google.com/file/d/1tVgQU2dAmh87APRbsgii6hqln8orOS63/view?usp=sharing',
    'https://drive.google.com/file/d/1j0bKc5tzdLfcgMX5sZk_3usAvBoDpvLg/view?usp=sharing'
];

console.log('URL Conversion Test:');
testUrls.forEach((url, index) => {
    const converted = convertToDirectDownloadUrl(url);
    console.log(`\nOriginal ${index + 1}: ${url}`);
    console.log(`Converted ${index + 1}: ${converted}`);
});

console.log('\nTesting if conversion works by extracting file IDs:');
testUrls.forEach((url, index) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\/view/);
    if (match) {
        console.log(`File ID ${index + 1}: ${match[1]}`);
    }
});