import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "StudyHub DIU - Smart Learning Platform for CSE Students | Daffodil International University",
    template: "%s | StudyHub DIU"
  },
  description: "StudyHub DIU: Your ultimate learning companion for Computer Science & Engineering at Daffodil International University. Access 1000+ video lectures, slides, study materials, notes, and interactive tools. Join thousands of students achieving academic excellence.",
  applicationName: "DIU Learning Platform",
  authors: [{ name: "DIU CSE Department" }],
  keywords: [
    "StudyHub DIU", "DIU Learning Platform", "Daffodil International University", 
    "Computer Science Engineering", "CSE DIU", "DIU CSE", "Bangladesh University",
    "Online Learning Bangladesh", "Video Lectures CSE", "Study Materials DIU",
    "Course Content", "Academic Resources Bangladesh", "DIU Students",
    "Slides Presentation", "Study Tools", "Educational Technology Bangladesh",
    "E-Learning Platform", "Smart Learning", "University Bangladesh",
    "Engineering Education", "Programming Courses", "Data Structures",
    "Algorithms", "Web Development", "Database Management", "Software Engineering",
    "DIU Notes", "DIU Videos", "DIU Study Materials", "CSE Resources"
  ],
  generator: "DIU Learning Platform",
  creator: "DIU CSE Department",
  publisher: "Daffodil International University",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "StudyHub DIU - Smart Learning Platform for CSE Students",
    description: "Access comprehensive learning materials, video lectures, slides, and study tools for Computer Science & Engineering courses at Daffodil International University. Join thousands of students enhancing their academic journey.",
    type: "website",
    siteName: "StudyHub DIU Learning Platform",
    locale: "en_US",
    url: "https://diu-learning.vercel.app",
    images: [
      {
        url: "/images/studyhub_diu_Favicon .png",
        width: 1200,
        height: 630,
        alt: "StudyHub DIU - Computer Science & Engineering Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyHub DIU - Smart Learning Platform",
    description: "Access comprehensive learning materials, video lectures, slides, and study tools for CSE courses at DIU. Join thousands of students enhancing their academic journey.",
    creator: "@DIU_Official",
    images: ["/images/studyhub_diu_Favicon .png"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://diu-learning.vercel.app",
  },
  category: "education",
  classification: "Educational Platform",
  metadataBase: new URL('https://diu-learning.vercel.app'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://drive.google.com" />
        <link rel="preconnect" href="https://youtube.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//drive.google.com" />
        <link rel="dns-prefetch" href="//youtube.com" />

  {/* App icons and manifest */}
  <link rel="icon" href="/images/studyhub_diu_Favicon .png" type="image/png" />
  <link rel="apple-touch-icon" href="/images/studyhub_diu_Favicon .png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Theme colors */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* Mobile app capabilities */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DIU Learning" />
        <meta name="format-detection" content="telephone=no" />

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "StudyHub DIU Learning Platform",
              "alternateName": "DIU CSE Learning Platform",
              "description": "Smart learning platform providing comprehensive educational resources including video lectures, slides, study tools, and course materials for Computer Science & Engineering students at Daffodil International University",
              "url": "https://diu-learning.vercel.app",
              "logo": "https://diu-learning.vercel.app/images/studyhub_diu_Favicon .png",
              "image": "https://diu-learning.vercel.app/images/studyhub_diu_Favicon .png",
              "sameAs": [
                "https://daffodilvarsity.edu.bd",
                "https://facebook.com/daffodilvarsity",
                "https://twitter.com/DIU_Official"
              ],
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "102/1, Shukrabad",
                "addressLocality": "Mirpur Road",
                "addressRegion": "Dhaka",
                "postalCode": "1207",
                "addressCountry": "BD"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+880-2-9138234",
                "contactType": "customer service",
                "availableLanguage": ["en", "bn"]
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Educational Resources",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Course",
                      "name": "Computer Science & Engineering Courses",
                      "description": "Comprehensive CSE course materials, video lectures, and study resources",
                      "provider": {
                        "@type": "EducationalOrganization",
                        "name": "Daffodil International University"
                      }
                    }
                  }
                ]
              },
              "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student"
              },
              "keywords": "DIU, CSE, Computer Science, Engineering, Learning Platform, Video Lectures, Study Materials, Bangladesh University, Online Education, E-Learning"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "StudyHub DIU Learning Platform",
              "url": "https://diu-learning.vercel.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://diu-learning.vercel.app/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "inLanguage": "en",
              "isAccessibleForFree": true
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <div className="relative flex min-h-screen flex-col">{children}</div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
