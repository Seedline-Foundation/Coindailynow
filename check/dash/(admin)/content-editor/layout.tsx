import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Editor | CoinDaily CMS',
  description: 'Advanced drag-and-drop content editor for creating engaging crypto news articles with multimedia support and meme integration.',
  robots: 'noindex, nofollow', // Admin pages should not be indexed
};

export default function ContentEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="content-editor-layout">
      {children}
    </div>
  );
}
