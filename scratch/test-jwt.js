function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return { error: e.message };
  }
}

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBlci1hZG1pbi1pZCIsImVtYWlsIjoiYWRtaW5AY29pbmRhaWx5Lm9ubGluZSIsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJTVVBFUl9BRE1JTiIsInN1YnNjcmlwdGlvblRpZXIiOiJGUkVFIiwic3RhdHVzIjoiQUNUSVZFIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwidHlwZSI6ImFjY2VzcyIsImp0aSI6ImY0N2M1ZGRiLWMzZDQtNGU5ZC05Y2JiLWM3NGY4MGFmYWRiNiIsImlhdCI6MTc4MDA0OTIwMSwiZXhwIjoxNzgwMDUwMTAxLCJhdWQiOiJjb2luZGFpbHktYXBwIiwiaXNzIjoiY29pbmRhaWx5LWFwaSJ9.JhUk0cBpZQM-YPSJ1NVFV4-w3_7BKZkGpq0e17NI8Og";

console.log(decodeJwtPayload(token));
