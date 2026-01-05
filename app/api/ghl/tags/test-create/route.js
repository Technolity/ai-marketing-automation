// app/api/ghl/tags/test-create/route.js
// Test endpoint for creating GoHighLevel option tags

export async function POST(request) {
  try {
    // Get GHL credentials from environment variables
    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocationId = process.env.GHL_LOCATION_ID;

    // Validate credentials exist
    if (!ghlApiKey || !ghlLocationId) {
      return Response.json(
        {
          success: false,
          error: 'GHL API credentials not configured',
          details: 'Please ensure GHL_API_KEY and GHL_LOCATION_ID are set in .env.local'
        },
        { status: 500 }
      );
    }

    // Hardcoded test tag name for testing
    const testTagName = "Test-Option-Tag";

    console.log('Creating GHL tag:', testTagName);
    console.log('Using location ID:', ghlLocationId);

    // Make request to GoHighLevel API to create tag
    const response = await fetch(
      `https://services.leadconnectorhq.com/locations/${ghlLocationId}/tags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          name: testTagName
        })
      }
    );

    const responseData = await response.json();

    // Handle different response codes
    if (!response.ok) {
      let errorMessage = 'Failed to create tag in GoHighLevel';
      let troubleshooting = '';

      switch (response.status) {
        case 400:
          errorMessage = 'Bad Request - Invalid tag data';
          troubleshooting = 'Check if the tag name is valid and meets GHL requirements.';
          break;
        case 401:
          errorMessage = 'Unauthorized - Invalid access token';
          troubleshooting = 'Verify your GHL_API_KEY is correct and has not expired.';
          break;
        case 403:
          errorMessage = 'Forbidden - Permission denied';
          troubleshooting = 'Ensure your API key has permissions to create tags.';
          break;
        case 404:
          errorMessage = 'Location not found';
          troubleshooting = 'Verify your GHL_LOCATION_ID is correct.';
          break;
        case 422:
          errorMessage = 'Unprocessable Entity - Tag may already exist';
          troubleshooting = 'This tag might already exist in your location. Try a different name or delete the existing tag first.';
          break;
        default:
          errorMessage = `GHL API error (Status: ${response.status})`;
      }

      console.error('GHL API Error:', {
        status: response.status,
        data: responseData
      });

      return Response.json(
        {
          success: false,
          error: errorMessage,
          troubleshooting,
          status: response.status,
          details: responseData
        },
        { status: response.status }
      );
    }

    // Success response
    console.log('Tag created successfully:', responseData);

    return Response.json({
      success: true,
      message: 'Tag created successfully in GoHighLevel!',
      tagId: responseData.id || responseData._id,
      tagName: testTagName,
      ghlResponse: responseData,
      nextSteps: [
        'Go to your GoHighLevel dashboard',
        'Navigate to Settings → Tags',
        'Verify that "Test-Option-Tag" appears in the list',
        'You can now use this tag to organize contacts'
      ]
    }, { status: 200 });

  } catch (error) {
    console.error('Tag creation error:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to create tag',
        details: error.message,
        troubleshooting: 'Check your network connection and ensure GHL API is accessible.'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check if tag exists
export async function GET(request) {
  try {
    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocationId = process.env.GHL_LOCATION_ID;

    if (!ghlApiKey || !ghlLocationId) {
      return Response.json(
        {
          success: false,
          error: 'GHL API credentials not configured'
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'GHL tag creation endpoint is ready',
      configured: true,
      locationId: ghlLocationId.substring(0, 8) + '...' // Show partial ID for verification
    }, { status: 200 });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

