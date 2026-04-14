/**
 * Meta Graph API Client
 * Handles OAuth 2.0 and posting to Instagram & Facebook
 */

const META_OAUTH_DIALOG_URL = 'https://www.facebook.com/v25.0/dialog/oauth';
const META_OAUTH_TOKEN_URL = 'https://graph.facebook.com/v25.0/oauth/access_token';
const META_GRAPH_API = 'https://graph.facebook.com/v25.0';

/**
 * Generate Meta OAuth authorization URL
 */
export function generateMetaAuthorizationUrl({ appId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_content_publish',
    state,
    response_type: 'code'
  });

  return `${META_OAUTH_DIALOG_URL}?${params.toString()}`;
}

/**
 * Exchange Meta authorization code for access token
 */
export async function exchangeMetaCode({ code, appId, appSecret, redirectUri }) {
  const params = new URLSearchParams({
    code,
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri
  });

  // Meta requires GET for this endpoint, URL params only
  const urlWithParams = `${META_OAUTH_TOKEN_URL}?${params.toString()}`;
  const res = await fetch(urlWithParams, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Meta token exchange failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data: { access_token, token_type, expires_in }
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

/**
 * Get Instagram Business Account connected to user
 */
export async function getInstagramBusinessAccount(accessToken) {
  const res = await fetch(`${META_GRAPH_API}/me/accounts?fields=id,name,instagram_business_account`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get Meta pages: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data.data is array of pages with instagram_business_account nested

  // Extract first Instagram account found
  for (const page of data.data) {
    if (page.instagram_business_account?.id) {
      return {
        accountId: page.instagram_business_account.id,
        pageName: page.name,
        pageId: page.id
      };
    }
  }

  return null;
}

/**
 * Create Instagram media container (Step 1 of publishing)
 */
export async function createInstagramMediaContainer(igUserId, { imageUrl, caption, accessToken }) {
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption: caption || '',
    access_token: accessToken
  });

  const res = await fetch(`${META_GRAPH_API}/${igUserId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Instagram media container creation failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data: { id }
  return data.id;
}

/**
 * Publish Instagram media container (Step 2 of publishing)
 */
export async function publishInstagramMedia(igUserId, { containerId, accessToken }) {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken
  });

  const res = await fetch(`${META_GRAPH_API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Instagram media publish failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data: { id }
  return data.id;
}

/**
 * Post to Facebook Page
 */
export async function postFacebookPage(pageId, { message, link, accessToken }) {
  const params = new URLSearchParams({
    message,
    ...(link && { link }),
    access_token: accessToken
  });

  const res = await fetch(`${META_GRAPH_API}/${pageId}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Facebook page post failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data: { id }
  return data.id;
}

/**
 * Get Instagram content publishing limit
 * Helps track daily post count for rate limiting
 */
export async function getInstagramPublishingLimit(igUserId, accessToken) {
  const res = await fetch(
    `${META_GRAPH_API}/${igUserId}/content_publishing_limit?fields=config,quota_usage`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get Instagram publishing limit: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // data.data: { config: { quota_total }, quota_usage }
  return {
    quotaTotal: data.data[0]?.config.quota_total || 50,
    quotaUsage: data.data[0]?.quota_usage || 0
  };
}
