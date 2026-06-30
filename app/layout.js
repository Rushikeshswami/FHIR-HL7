import './globals.css'

export const metadata = {
  title: 'FHIR Mastery Accelerator — 7-Day',
  description: 'Private 7-Day HL7 FHIR Mastery Accelerator for US Healthcare Technical Analysts',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
