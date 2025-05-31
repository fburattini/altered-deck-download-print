/**
 * 🔐 AUTHENTICATION CONFIGURATION
 * 
 * Centralized bearer token configuration for all scripts
 */

import dotenv from 'dotenv';
dotenv.config();

// Bearer token for Altered API authentication
// To get a new token:
// 1. Go to https://www.altered.gg/
// 2. Log in to your account
// 3. Open browser dev tools (F12)
// 4. Go to Network tab
// 5. Make any API request (like viewing cards)
// 6. Look for requests to api.altered.gg
// 7. Copy the Authorization header value (remove "Bearer " prefix)
export const BEARER_TOKEN = process.env.ALTERED_BEARER_TOKEN as string

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
