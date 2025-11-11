import './globals.css';
import NavBar from './ui/NavBar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <NavBar />
        </header>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}