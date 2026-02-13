$env:ADMIN_WHITELISTED_IPS="BYPASS_ALL"
$env:NEXT_PUBLIC_API_URL="http://localhost:3001"
$env:npm_config_workspaces="false"

# Run directly with node to avoid npm workspace issues
node node_modules\next\dist\bin\next dev -p 3010
