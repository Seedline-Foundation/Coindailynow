export default function LoginPage() {
  return (
    <html>
      <head>
        <title>Login</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#1e40af', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '300px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1f2937' }}>Super Admin Login</h1>
          
          <form action="/super-admin" method="get">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username:</label>
              <input 
                type="text" 
                name="username"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="admin"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
              <input 
                type="password" 
                name="password"
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="admin123"
              />
            </div>
            
            <button 
              type="submit"
              style={{ width: '100%', padding: '12px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}
            >
              Login
            </button>
          </form>
          
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '14px' }}>
            <strong>Demo:</strong><br/>
            Username: admin<br/>
            Password: admin123
          </div>
        </div>
      </body>
    </html>
  );
}