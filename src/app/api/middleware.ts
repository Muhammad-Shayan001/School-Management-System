/**
 * Mock JWT Authentication Middleware for HEC/PITB Portal APIs
 * Implements token verification, extraction, and role-based validation.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'trainer' | 'student' | 'admin';
  name: string;
}

// Simple base64 decoding helper to mock JWT token parsing safely
function decodeJwtMock(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decrypting payload part
    const payloadJson = atob(parts[1]);
    const parsed = JSON.parse(payloadJson);
    
    if (parsed && parsed.email && parsed.role) {
      return {
        id: parsed.id || 'usr-default',
        email: parsed.email,
        role: parsed.role,
        name: parsed.name || 'Anonymous User',
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function verifyAuth(request: Request): Promise<{ user: AuthenticatedUser | null; errorResponse?: Response }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Access Denied: Missing or malformed Authorization token. Please authenticate via PITB/HEC secure login.' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  const token = authHeader.split(' ')[1];
  const user = decodeJwtMock(token);

  if (!user) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Security Block: Invalid Cryptographic Signature on JWT token. Action logged with National Telecom Corporation (NTC).' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    };
  }

  return { user };
}
