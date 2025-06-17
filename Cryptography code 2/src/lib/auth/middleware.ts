import { getCurrentToken, isTokenExpired } from './tokens';

// Auth middleware for API requests
export async function withAuth(
  request: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  try {
    const token = await getCurrentToken();
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - No token provided' 
      }), { 
        status: 401 
      });
    }

    if (isTokenExpired(token)) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Token expired' 
      }), { 
        status: 401 
      });
    }

    // Add token to request headers
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // Create new request with auth header
    const authedRequest = new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    });

    return await handler(authedRequest);
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500 
    });
  }
}

// Role-based authorization middleware
export function withRole(
  role: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    return withAuth(req, async (authedReq) => {
      const token = authedReq.headers.get('Authorization')?.split(' ')[1];
      
      if (!token) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized - No token provided' 
        }), { 
          status: 401 
        });
      }

      const decoded = decodeToken(token);
      
      if (decoded.role !== role) {
        return new Response(JSON.stringify({ 
          error: 'Forbidden - Insufficient permissions' 
        }), { 
          status: 403 
        });
      }

      return await handler(authedReq);
    });
  };
}