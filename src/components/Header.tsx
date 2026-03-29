import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            E
          </div>
          <span className="text-xl font-bold tracking-tight">ElectionPortal</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link href="/elections" className="text-sm font-medium hover:text-primary transition-colors">Elections</Link>
          <Link href="/candidates" className="text-sm font-medium hover:text-primary transition-colors">Candidates</Link>
          <Link href="/results" className="text-sm font-medium hover:text-primary transition-colors">Results</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden sm:inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            Sign In
          </button>
          <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}
