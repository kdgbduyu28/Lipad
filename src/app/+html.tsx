import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/** The HTML shell for every statically rendered page (web only). */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0369A1" />
        <meta property="og:site_name" content="Lipad" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'body{background:#F1F5F9}@media (prefers-color-scheme: dark){body{background:#0B1220}}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
