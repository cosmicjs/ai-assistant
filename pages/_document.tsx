import { Head, Html, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased dark:bg-[#111] dark:text-neutral-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
