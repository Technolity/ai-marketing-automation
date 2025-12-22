import { NextResponse } from 'next/server';

/**
 * POST /api/ghl/test-push-batch
 * Test pushing MULTIPLE custom values at once to GHL
 * Tests: text, URLs (for images), colors, and multiple types
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { accessToken, locationId } = body;

    if (!accessToken || !locationId) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['accessToken', 'locationId']
      }, { status: 400 });
    }

    // Test data covering different types
    const testCustomValues = [
      // Text values
      {
        name: 'test_headline',
        value: 'Transform Your Business in 90 Days'
      },
      {
        name: 'test_subheadline',
        value: 'Join 1,000+ entrepreneurs who have scaled their business with our proven system'
      },

      // Image URLs (simulate uploaded images)
      {
        name: 'test_hero_image',
        value: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800'
      },
      {
        name: 'test_testimonial_image',
        value: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
      },

      // Brand colors (hex codes)
      {
        name: 'test_brand_color_primary',
        value: '#0891b2'
      },
      {
        name: 'test_brand_color_secondary',
        value: '#06b6d4'
      },
      {
        name: 'test_brand_color_accent',
        value: '#22d3ee'
      },

      // Multiple page values (shows how different pages use different values)
      {
        name: 'test_landing_cta',
        value: 'Get Your Free Guide Now'
      },
      {
        name: 'test_thankyou_headline',
        value: 'Success! Check Your Email'
      },
      {
        name: 'test_vsl_hook',
        value: 'What if I told you that everything you know about marketing is wrong?'
      }
    ];

    console.log(`Pushing ${testCustomValues.length} custom values to GHL...`);

    const ghlApiUrl = `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

    // Get existing custom values to check which ones exist
    const getResponse = await fetch(ghlApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      }
    });

    let existingValues = [];
    if (getResponse.ok) {
      const data = await getResponse.json();
      existingValues = data.customValues || [];
      console.log(`Found ${existingValues.length} existing custom values`);
    }

    const results = {
      created: [],
      updated: [],
      failed: []
    };

    // Push each custom value
    for (const customValue of testCustomValues) {
      const existing = existingValues.find(cv => cv.name === customValue.name);

      try {
        let response;
        let method;

        if (existing) {
          // UPDATE existing
          method = 'PUT';
          response = await fetch(`${ghlApiUrl}/${existing.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            body: JSON.stringify({
              name: customValue.name,
              value: customValue.value
            })
          });
        } else {
          // CREATE new
          method = 'POST';
          response = await fetch(ghlApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            body: JSON.stringify(customValue)
          });
        }

        if (response.ok) {
          const data = await response.json();
          if (existing) {
            results.updated.push({
              name: customValue.name,
              value: customValue.value,
              type: getValueType(customValue.name, customValue.value)
            });
          } else {
            results.created.push({
              name: customValue.name,
              value: customValue.value,
              type: getValueType(customValue.name, customValue.value)
            });
          }
          console.log(`✅ ${method} ${customValue.name}: ${customValue.value.substring(0, 50)}...`);
        } else {
          const errorText = await response.text();
          results.failed.push({
            name: customValue.name,
            error: errorText,
            status: response.status
          });
          console.error(`❌ Failed ${customValue.name}:`, errorText);
        }
      } catch (error) {
        results.failed.push({
          name: customValue.name,
          error: error.message
        });
        console.error(`❌ Error ${customValue.name}:`, error);
      }
    }

    const totalSuccess = results.created.length + results.updated.length;
    const totalFailed = results.failed.length;
    const successRate = Math.round((totalSuccess / testCustomValues.length) * 100);

    return NextResponse.json({
      success: totalFailed === 0,
      summary: {
        total: testCustomValues.length,
        created: results.created.length,
        updated: results.updated.length,
        failed: results.failed.length,
        successRate: `${successRate}%`
      },
      results,
      usage: {
        text: {
          example: 'test_headline',
          howToUse: 'In any text element, type: {{custom_values.test_headline}}'
        },
        images: {
          example: 'test_hero_image',
          howToUse: 'Add image element, set src to: {{custom_values.test_hero_image}}'
        },
        colors: {
          example: 'test_brand_color_primary',
          howToUse: 'In style settings, use: {{custom_values.test_brand_color_primary}}'
        },
        multiplePages: {
          explanation: 'Each page can use different custom values from the same pool',
          examples: {
            landingPage: '{{custom_values.test_landing_cta}}',
            thankYouPage: '{{custom_values.test_thankyou_headline}}',
            vslPage: '{{custom_values.test_vsl_hook}}'
          }
        }
      },
      nextSteps: [
        '1. Go to GHL → Settings → Custom Values to see all pushed values',
        '2. Create/edit pages in different funnels',
        '3. Use merge tags to pull specific values: {{custom_values.KEY_NAME}}',
        '4. All funnels in this location can access these values',
        '5. Each page determines which values to display'
      ]
    });

  } catch (error) {
    console.error('Batch test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Helper to identify value type for documentation
 */
function getValueType(name, value) {
  if (name.includes('image') || name.includes('photo') || name.includes('avatar')) {
    return 'image_url';
  }
  if (name.includes('color') || /^#[0-9A-Fa-f]{6}$/.test(value)) {
    return 'color';
  }
  if (value.length > 100) {
    return 'long_text';
  }
  return 'text';
}
