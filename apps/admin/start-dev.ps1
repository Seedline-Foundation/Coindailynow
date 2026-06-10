$env:ADMIN_WHITELISTED_IPS="BYPASS_ALL"
$env:NEXT_PUBLIC_API_URL="http://localhost:4000"
$env:npm_config_workspaces="false"

# Run via helper to handle hoisted next dependency correctly
node scripts/next-cli.cjs dev -p 3010

