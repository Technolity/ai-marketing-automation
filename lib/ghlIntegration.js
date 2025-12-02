// lib/ghlIntegration.js

export async function pushToGHL(data) {
  const response = await fetch('/api/ghl/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to push to GoHighLevel');
  }

  return response.json();
}

export function formatForGHLCustomValues(results) {
  // Map your generated content to GHL custom value keys
  return {
    business_name: results.businessName,
    product_name: results.productName,
    tagline: results.brandMessaging?.tagline,
    mission: results.brandMessaging?.missionStatement,
    value_prop: results.brandMessaging?.valueProposition,
    vsl_hook: results.vslScript?.hook,
    vsl_problem: results.vslScript?.problemAgitate,
    vsl_solution: results.vslScript?.solutionReveal,
    vsl_cta: results.vslScript?.cta,
    hero_headline: results.landingPageCopy?.hero?.headline,
    hero_subheadline: results.landingPageCopy?.hero?.subheadline,
    offer_price: results.landingPageCopy?.offer?.price,
    // Add more mappings as needed for your GHL template
  };
}
