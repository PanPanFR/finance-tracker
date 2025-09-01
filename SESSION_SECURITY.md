# 🔐 Session-Based Security Implementation

## 🎯 **Mengapa Session-Based Security?**

**Teman Anda BENAR!** Session-based security adalah **best practice** untuk mengamankan API endpoints. Berbeda dengan API key yang statis, session memberikan:

✅ **Dynamic Security** - Token berubah setiap login  
✅ **User Isolation** - Setiap user punya session sendiri  
✅ **Automatic Expiry** - Session expire otomatis  
✅ **Revocation** - Bisa di-revoke jika ada masalah  
✅ **Audit Trail** - Track siapa yang akses apa  

## 🚀 **Implementasi Session-Based Security**

### **1. 🔑 Client-Side Session Management**

#### **AuthContext.tsx - Session State Management:**
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    };
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
}
```

#### **Session Token Usage in API Calls:**
```typescript
// aiParser.ts - Secure API call with session token
export async function parseTransaction(input: string): Promise<ParsedTransaction[] | null> {
  // Get current session token for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("Authentication required. Please login first.");
  }
  
  const res = await fetch("/api/ai/parse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`, // 🔐 Session token
    },
    body: JSON.stringify({ input }),
  });
}
```

### **2. 🛡️ Server-Side Session Validation**

#### **API Route - Session Token Validation:**
```typescript
// /api/ai/parse/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. CORS Protection
    const origin = request.headers.get('origin');
    // ... CORS checks
    
    // 2. Authentication Check - 🔐 SESSION VALIDATION
    const authHeader = request.headers.get('authorization');
    const authResult = await validateUser(authHeader);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { userId, user } = authResult;
    console.log("AI Parser - Authenticated user:", userId);
    
    // 3. Rate Limiting per user
    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    // 4. Process request with user context
    // ... AI processing
  } catch (error) {
    // ... error handling
  }
}
```

#### **Session Validation Function:**
```typescript
async function validateUser(authHeader: string | null): Promise<{ userId: string; user: any } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 🔐 VALIDATE SESSION TOKEN dengan Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null; // Invalid or expired token
    }
    
    return { userId: user.id, user };
  } catch (error) {
    console.error("Auth validation error:", error);
    return null;
  }
}
```

## 🔄 **Flow Session-Based Security**

### **Complete Security Flow:**

```
1. User Login
   ↓
2. Supabase Create Session
   ↓
3. Browser Store JWT Token
   ↓
4. Client API Call with Bearer Token
   ↓
5. Server Validate Token with Supabase
   ↓
6. Server Check Rate Limit per User
   ↓
7. Server Process Request with User Context
   ↓
8. Server Return Response with Logging
```

### **Security Layers:**

#### **Layer 1: CORS Protection**
- ✅ Block cross-origin requests
- ✅ Only allow trusted domains
- ✅ Response: 403 Forbidden

#### **Layer 2: Session Authentication**
- ✅ Validate Bearer token
- ✅ Check token with Supabase
- ✅ Response: 401 Unauthorized

#### **Layer 3: Rate Limiting**
- ✅ Track requests per user
- ✅ Limit: 10 requests/minute
- ✅ Response: 429 Too Many Requests

#### **Layer 4: Input Validation**
- ✅ Sanitize user input
- ✅ Max length: 500 characters
- ✅ Response: 400 Bad Request

## 🔍 **Session Token Security Features**

### **JWT Token Properties:**
```typescript
// Session token structure
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600, // 1 hour
  "token_type": "bearer"
}
```

### **Security Features:**
✅ **Signed** - JWT signed dengan secret key  
✅ **Encrypted** - Payload encrypted  
✅ **Expires** - Auto expire setelah 1 jam  
✅ **Refreshable** - Auto refresh sebelum expire  
✅ **Revocable** - Bisa di-revoke dari Supabase  

## 📊 **Session Monitoring & Analytics**

### **What We Track:**
```typescript
// Log examples
console.log("AI Parser - Authenticated user:", userId);
console.log("AI Parser - Processing input for user:", userId, "Input:", sanitizedInput);
console.log("AI Parser - Rate limit exceeded for user:", userId);
console.log("AI Parser - Final validated result for user:", userId, "Result:", parsed);
```

### **Security Metrics:**
- ✅ Authentication success/failure rates
- ✅ Rate limiting violations per user
- ✅ CORS violations
- ✅ API usage per user
- ✅ Session expiry events

## 🛠️ **Testing Session Security**

### **Test 1: Valid Session**
```bash
# Login first to get session token
curl -X POST https://your-api.com/api/ai/parse \
  -H "Authorization: Bearer VALID_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "beli bakso 5000"}'
# Expected: 200 OK + AI result
```

### **Test 2: Invalid Session**
```bash
# Use expired or invalid token
curl -X POST https://your-api.com/api/ai/parse \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "test"}'
# Expected: 401 Unauthorized
```

### **Test 3: No Session**
```bash
# No authorization header
curl -X POST https://your-api.com/api/ai/parse \
  -H "Content-Type: application/json" \
  -d '{"input": "test"}'
# Expected: 401 Unauthorized
```

## 🎯 **Keuntungan Session-Based vs API Key**

### **❌ API Key (Traditional):**
- Static key yang tidak berubah
- Sulit di-revoke
- Bisa di-share (security risk)
- No user isolation
- No automatic expiry

### **✅ Session-Based (Modern):**
- Dynamic token yang berubah setiap login
- Mudah di-revoke dari Supabase
- Tidak bisa di-share antar user
- User isolation per session
- Auto expire dan refresh

## 🔐 **Best Practices Session Security**

### **✅ Client-Side:**
- Store session di memory (bukan localStorage)
- Auto refresh sebelum expire
- Handle 401 errors gracefully
- Clear session on logout

### **✅ Server-Side:**
- Validate every request
- Use service role key for validation
- Implement rate limiting per user
- Log all authentication events

### **✅ Security Headers:**
- CORS protection
- Rate limiting headers
- Security headers (HSTS, CSP)
- HTTPS enforcement

## 🚨 **Security Incident Response**

### **If Session Compromised:**
1. **Immediate Action:**
   - Revoke session dari Supabase dashboard
   - Force user re-authentication
   - Monitor for suspicious activity

2. **Investigation:**
   - Check access logs
   - Review rate limiting violations
   - Analyze user behavior patterns

3. **Prevention:**
   - Implement session rotation
   - Add IP-based restrictions
   - Enhanced monitoring

## 🎉 **Kesimpulan Session Security**

**Session-based security memberikan:**

🛡️ **Multi-layer Protection** - CORS + Auth + Rate Limit  
🔐 **Dynamic Security** - Token berubah setiap login  
👤 **User Isolation** - Setiap user punya session sendiri  
📊 **Comprehensive Monitoring** - Track semua aktivitas  
🚀 **Scalable Security** - Bisa di-scale ke multiple servers  

**Keamanan level: ENTERPRISE** 🏢  
**Protection: SESSION-BASED** 🔐  
**Monitoring: REAL-TIME** 📡  

**Endpoint Anda sekarang AMAN dengan session-based security!** 🎯
