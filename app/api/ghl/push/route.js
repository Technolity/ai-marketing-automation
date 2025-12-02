// app/api/ghl/push/route.js
export async function POST(request) {
  try {
    const data = await request.json();
    
    // GoHighLevel API integration
    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocationId = process.env.GHL_LOCATION_ID;
    
    if (!ghlApiKey || !ghlLocationId) {
      return Response.json(
        { error: 'GHL API credentials not configured' },
        { status: 500 }
      );
    }

    // EXAMPLE: Push to GHL Custom Values
    // Adjust based on your GHL funnel template structure
    const customValues = {
      business_name: data.businessName,
      tagline: data.brandMessaging?.tagline,
      vsl_hook: data.vslScript?.hook,
      hero_headline: data.landingPageCopy?.hero?.headline,
      // Add more custom values as needed
    };

    const response = await fetch(
      `https://rest.gohighlevel.com/v1/locations/${ghlLocationId}/customValues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customValues)
      }
    );

    if (!response.ok) {
      throw new Error('GHL API request failed');
    }

    return Response.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('GHL push error:', error);
    return Response.json(
      { error: 'Failed to push to GoHighLevel' },
      { status: 500 }
    );
  }
}
