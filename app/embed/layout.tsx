import React from 'react';

// Minimal layout for embed pages - no navbar, footer, etc.
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Render only the page content */}
        {children}
      </body>
    </html>
  );
} 