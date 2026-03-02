const Footer = () => {
  return (
    <footer className="relative py-12 px-4 border-t border-border/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold">
              Sims<span className="gradient-text-blue-green">Kut</span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#showcase" className="hover:text-foreground transition-colors">Showcase</a>
            <a href="#news" className="hover:text-foreground transition-colors">Notícias</a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © 2026 SimsKut • Feito com 💎 por <span className="text-foreground">VICCS</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
