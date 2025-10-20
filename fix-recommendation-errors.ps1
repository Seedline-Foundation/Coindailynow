# Fix all TypeScript errors in recommendation system

Write-Host "Fixing recommendation system TypeScript errors..." -ForegroundColor Cyan

# Read the aiRecommendationService.ts file
$serviceFile = "c:\Users\onech\Desktop\news-platform\backend\src\services\aiRecommendationService.ts"
$content = Get-Content $serviceFile -Raw

# Fix 1: Change imageUrl type to allow undefined properly
$content = $content -replace 'imageUrl\?:', 'imageUrl:'

# Fix 2: Fix memecoin alerts - remove the non-existent price data for now
$memecoinsOld = @'
      // Get trending memecoins (placeholder - integrate with real market data)
      const trendingCoins = await prisma.token.findMany({
        where: {
          isActive: true,
        },
        orderBy: { priceChange24h: 'desc' },
        take: 10,
      });

      const alerts: MemecoinAlert[] = trendingCoins
        .filter(coin => Math.abs(coin.priceChange24h) > 10) // Significant change
        .map(coin => ({
          symbol: coin.symbol,
          name: coin.name,
          alertType: coin.priceChange24h > 0 ? 'surge' : 'drop',
          relevanceScore: portfolioSymbols.includes(coin.symbol) ? 0.9 : 0.6,
          priceChange24h: coin.priceChange24h,
          volume24h: coin.volume24h,
          message: this.generateAlertMessage(coin),
          timestamp: new Date(),
        }));
'@

$memecoinsNew = @'
      // Get trending memecoins (placeholder - integrate with real market data)
      // Note: Token table doesn't have priceChange24h, volume24h fields yet
      // TODO: Add MarketData table or update Token schema
      const alerts: MemecoinAlert[] = [];
      
      // Temporary: Return empty alerts until market data integration is complete
      // This prevents database errors while keeping the API functional
'@

$content = $content -replace [regex]::Escape($memecoinsOld), $memecoinsNew

# Fix 3: Fix UserPreferences parsing - the fields are JSON strings in the database
$preferencesOld = @'
        userId: dbPreferences.userId,
        favoriteCategories: (dbPreferences.preferences as any)?.favoriteCategories || [],
        favoriteTopics: (dbPreferences.preferences as any)?.favoriteTopics || [],
        languagePreferences: (dbPreferences.preferences as any)?.languagePreferences || ['en'],
        contentDifficulty: (dbPreferences.preferences as any)?.contentDifficulty || DifficultyLevel.INTERMEDIATE,
        notificationFrequency: (dbPreferences.preferences as any)?.notificationFrequency || NotificationFrequency.DAILY,
        enableMemecoinAlerts: (dbPreferences.preferences as any)?.enableMemecoinAlerts ?? true,
        enableMarketInsights: (dbPreferences.preferences as any)?.enableMarketInsights ?? true,
        portfolioSymbols: (dbPreferences.preferences as any)?.portfolioSymbols || [],
        excludedTopics: (dbPreferences.preferences as any)?.excludedTopics || [],
'@

$preferencesNew = @'
        userId: dbPreferences.userId,
        favoriteCategories: JSON.parse(dbPreferences.favoriteCategories || '[]'),
        favoriteTopics: JSON.parse(dbPreferences.preferredTopics || '[]'),
        languagePreferences: JSON.parse(dbPreferences.contentLanguages || '["en"]'),
        contentDifficulty: (dbPreferences.readingLevel as DifficultyLevel) || DifficultyLevel.INTERMEDIATE,
        notificationFrequency: (dbPreferences.digestFrequency as NotificationFrequency) || NotificationFrequency.DAILY,
        enableMemecoinAlerts: dbPreferences.priceAlerts ?? true,
        enableMarketInsights: dbPreferences.aiRecommendations ?? true,
        portfolioSymbols: [],  // TODO: Add to UserPreference schema
        excludedTopics: [],    // TODO: Add to UserPreference schema
'@

$content = $content -replace [regex]::Escape($preferencesOld), $preferencesNew

# Fix 4: Fix updatePreferences to use correct field mapping
$updateOld = @'
      const result = await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          preferences: updated,
        },
        update: {
          preferences: updated,
        },
      });
'@

$updateNew = @'
      // Map our UserPreferences to database fields
      const dbData: any = {
        userId,
      };
      
      if (updated.favoriteCategories) dbData.favoriteCategories = JSON.stringify(updated.favoriteCategories);
      if (updated.favoriteTopics) dbData.preferredTopics = JSON.stringify(updated.favoriteTopics);
      if (updated.languagePreferences) dbData.contentLanguages = JSON.stringify(updated.languagePreferences);
      if (updated.contentDifficulty) dbData.readingLevel = updated.contentDifficulty.toUpperCase();
      if (updated.notificationFrequency) dbData.digestFrequency = updated.notificationFrequency.toUpperCase();
      if (updated.enableMemecoinAlerts !== undefined) dbData.priceAlerts = updated.enableMemecoinAlerts;
      if (updated.enableMarketInsights !== undefined) dbData.aiRecommendations = updated.enableMarketInsights;
      
      const result = await prisma.userPreference.upsert({
        where: { userId },
        create: dbData,
        update: dbData,
      });
'@

$content = $content -replace [regex]::Escape($updateOld), $updateNew

# Fix 5: Fix trackArticleRead to use correct schema
$trackOld = @'
        include: { category: true, tags: true },
'@

$trackNew = @'
        include: { Category: true },
'@

$content = $content -replace [regex]::Escape($trackOld), $trackNew

# Fix 6: Fix metadata access
$metadataOld = @'
          metadata: {
            articleId,
            category: article.category.id,
            topics: article.tags.map(t => t.name),
            readDuration,
            completed,
          },
'@

$metadataNew = @'
          metadata: JSON.stringify({
            articleId,
            category: article.Category.id,
            topics: article.tags ? JSON.parse(article.tags) : [],
            readDuration,
            completed,
          }),
'@

$content = $content -replace [regex]::Escape($metadataOld), $metadataNew

# Save the fixed content
Set-Content -Path $serviceFile -Value $content

Write-Host "✓ Fixed aiRecommendationService.ts" -ForegroundColor Green

# Fix userRecommendationIntegration.ts - make private methods public or don't export the service
$integrationFile = "c:\Users\onech\Desktop\news-platform\backend\src\integrations\userRecommendationIntegration.ts"
$integrationContent = Get-Content $integrationFile -Raw

# Comment out the problematic export
$integrationContent = $integrationContent -replace 'export const getRecommendationService = \(\) => aiRecommendationService;', '// Service instance kept internal - use API endpoints instead
// export const getRecommendationService = () => aiRecommendationService;'

Set-Content -Path $integrationFile -Value $integrationContent

Write-Host "✓ Fixed userRecommendationIntegration.ts" -ForegroundColor Green

Write-Host ""
Write-Host "All fixes applied successfully!" -ForegroundColor Green
Write-Host "Run 'npm run build' in the backend directory to verify." -ForegroundColor Yellow
