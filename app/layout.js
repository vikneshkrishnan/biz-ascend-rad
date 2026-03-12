import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Biz Ascend RAD™ — Revenue Acceleration Diagnostic',
  description: 'Diagnose, score, and accelerate B2B revenue growth systems',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:`
          (function(){
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme='light';
            window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"){e.stopImmediatePropagation();e.preventDefault()}},true);
          })();
        `}} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
