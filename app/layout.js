import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

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
            try{var t=localStorage.getItem('rad-theme');
            if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}
            else{document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}
            }catch(e){}
            window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"){e.stopImmediatePropagation();e.preventDefault()}},true);
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
