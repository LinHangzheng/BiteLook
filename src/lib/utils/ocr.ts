import vision from '@google-cloud/vision';

// Initialize Vision API client
// Uses GOOGLE_CLOUD_API_KEY for authentication
const visionClient = new vision.ImageAnnotatorClient({
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  try {
    console.log('Starting text extraction with Google Cloud Vision OCR...');
    const startTime = Date.now();

    // Use Google Cloud Vision API for accurate OCR
    const [result] = await visionClient.textDetection({
      image: {
        content: imageBase64,
      },
    });

    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.warn('⚠️  No text detected in image');
      return '';
    }

    // First annotation contains the full text with preserved formatting
    const extractedText = detections[0]?.description || '';
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n========== TEXT EXTRACTION COMPLETE (${duration}s) ==========`);
    console.log(`Extracted ${extractedText.length} characters`);
    console.log(`Text preview (first 500 chars):`);
    console.log(extractedText.substring(0, 500));
    console.log(`============================================\n`);

    return extractedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ TEXT EXTRACTION FAILED:', errorMessage);
    console.error('Full error:', error);

    // Check for specific error types
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.error('⚠️  Rate limit hit during text extraction');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('DEADLINE_EXCEEDED')) {
      console.error('⚠️  Request timeout during text extraction');
    } else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      console.error('⚠️  Authentication error - check GOOGLE_CLOUD_API_KEY');
    }

    return ''; // Return empty string if extraction fails, LLM will work without it
  }
}
