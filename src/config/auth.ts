/**
 * 🔐 AUTHENTICATION CONFIGURATION
 * 
 * Centralized bearer token configuration for all scripts
 */

// Bearer token for Altered API authentication
// To get a new token:
// 1. Go to https://www.altered.gg/
// 2. Log in to your account
// 3. Open browser dev tools (F12)
// 4. Go to Network tab
// 5. Make any API request (like viewing cards)
// 6. Look for requests to api.altered.gg
// 7. Copy the Authorization header value (remove "Bearer " prefix)
export const BEARER_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDMFo0V3JVWE1xT2JtMy1CTU8xRFV5YktidFA2bldLb2VvWmE1UGJuZHhZIn0.eyJleHAiOjE3NDg2MjA3ODcsImlhdCI6MTc0ODYxMzU4NywiYXV0aF90aW1lIjoxNzQ3ODM3MzU3LCJqdGkiOiJjOWE1NGJlOC02NWRiLTRiMGMtYTM3Mi0yN2MwNGI0MGM1ZDkiLCJpc3MiOiJodHRwczovL2F1dGguYWx0ZXJlZC5nZy9yZWFsbXMvcGxheWVycyIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJiYmUzMGI4Yi1mNjhlLTRjYjQtYWMxMS0zZjY5ZmM5ZjBlN2MiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ3ZWIiLCJzaWQiOiI0OTRmMjg1Ni05OWZlLTQxYzEtYTU2YS1lNDI2NDkyZmRhZGUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vYXV0aC5hbHRlcmVkLmdnIiwiaHR0cHM6Ly93d3cuYWx0ZXJlZC5nZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib3RwX2VtYWlsIiwiZGVmYXVsdC1yb2xlcy1wbGF5ZXJzIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicHJlZmVycmVkX3VzZXJuYW1lIjoiZi5idXJhdHRpbmk5N0BnbWFpbC5jb20iLCJlbWFpbCI6ImYuYnVyYXR0aW5pOTdAZ21haWwuY29tIn0.eTbRTbKdBrr2dzbZXdiC4f0gUOMlvAbMwDgJxK4vMGBdGHIxMgn3wcuTrk0b-IQbvPxCYBcvMvKsofOcsc0gbJBTSHTkJlsdUg_e_DGTNNWojTuUiqrmt4mxTgyJJ_-j1exFrw7ilDQ5q4javnz8W6RU3vkNXwMp-KJRnQ1xQf3rplIm-kVzO63Yx7u76YdGwNfGUdP5GjjOdLAFI5tqCVYM2FYSp8ih--o6Ov_12E9elNuoXbeAfcnwJPlwEMUJqZPmv73hNEiKX0FsNtlbZR9P-gRdWTO6DJMu7mFDYjyzoCBHMVQqOrILxZCBDAa4RYWM-JO_l1pCt1TKk1mP9A';

/**
 * Get the bearer token for API authentication
 * This function can be extended to support multiple token sources
 * (environment variables, config files, etc.)
 */
export const getBearerToken = (): string => {
  // Check environment variable first
  const envToken = process.env.ALTERED_BEARER_TOKEN;
  if (envToken) {
    return envToken;
  }
  
  // Fall back to hardcoded token
  return BEARER_TOKEN;
};

/**
 * Check if the token is likely expired based on JWT payload
 * This is a simple check - tokens should be refreshed when they expire
 */
export const isTokenLikelyExpired = (token: string = BEARER_TOKEN): boolean => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    
    return now >= exp;
  } catch (error) {
    // If we can't parse the token, assume it's expired
    return true;
  }
};

/**
 * Get token expiration info for debugging
 */
export const getTokenInfo = (token: string = BEARER_TOKEN): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { error: 'Invalid JWT format' };
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const isExpired = now >= exp;
    const expiresInMinutes = Math.floor((exp - now) / 60);
    
    return {
      isExpired,
      expiresAt: new Date(exp * 1000).toISOString(),
      expiresInMinutes: isExpired ? 0 : expiresInMinutes,
      subject: payload.sub,
      email: payload.email,
      preferredUsername: payload.preferred_username
    };
  } catch (error) {
    return { error: 'Failed to parse token' };
  }
};
