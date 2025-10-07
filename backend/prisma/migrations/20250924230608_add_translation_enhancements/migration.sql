/*
  Warnings:

  - A unique constraint covering the columns `[articleId,languageCode]` on the table `ArticleTranslation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_articleId_languageCode_key" ON "ArticleTranslation"("articleId", "languageCode");
