import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Atlas Command Center',
  description: 'Real-time dashboard for Noah&apos;s project ecosystem - health monitoring, deploy status, and GitHub activity across all apps.',
  keywords: 'dashboard, monitoring, projects, deployment, health check, GitHub',
  authors: [{ name: 'Atlas' }],
  themeColor: '#B8860B',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#030810] text-white antialiased`}>
        <header className="border-b border-white/10 bg-white/[0.02]">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <h1 className="text-xl font-bold text-white">Atlas Command Center</h1>
              <div className="ml-auto text-sm text-white/40">
                Noah&apos;s Project Ecosystem
              </div>
            </div>
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer className="border-t border-white/10 bg-white/[0.02] mt-12">
          <div className="px-6 py-4 text-center text-white/40 text-sm">
            <p>Built by Atlas • {new Date().getFullYear()} • Real-time project monitoring</p>
          </div>
        </footer>
      </body>
    </html>
  )
}