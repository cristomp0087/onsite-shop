import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OnSite Shop | Wear What You Do',
  description: 'Official merch for construction workers. Premium quality apparel by OnSite Club.',
  keywords: ['construction', 'workwear', 'merch', 'apparel', 'onsite', 'canada'],
  openGraph: {
    title: 'OnSite Shop | Wear What You Do',
    description: 'Official merch for construction workers.',
    url: 'https://shop.onsiteclub.ca',
    siteName: 'OnSite Shop',
    locale: 'en_CA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
