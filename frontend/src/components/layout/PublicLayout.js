import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { ReactComponent as CloudNodeLogo } from '@/assets/CloudNode.svg';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features', comingSoon: true },
    { path: '/pricing', label: 'Pricing', comingSoon: true },
    { path: '/about', label: 'About', comingSoon: true },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <AppCloudLogo className="h-10 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.comingSoon ? '#' : link.path}
                  className={`text-sm font-medium transition-colors relative ${
                    isActivePath(link.path)
                      ? 'text-white'
                      : link.comingSoon
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={(e) => link.comingSoon && e.preventDefault()}
                >
                  {link.label}
                  {link.comingSoon && (
                    <span className="absolute -top-2 -right-4 text-[8px] text-cyan-400 bg-cyan-500/20 px-1 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-[#0B0F1A] border-b border-white/5"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.comingSoon ? '#' : link.path}
                  className={`block py-2 text-sm font-medium ${
                    isActivePath(link.path)
                      ? 'text-white'
                      : link.comingSoon
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}
                  onClick={(e) => {
                    if (link.comingSoon) e.preventDefault();
                    else setMobileMenuOpen(false);
                  }}
                >
                  {link.label}
                  {link.comingSoon && <span className="ml-2 text-xs text-cyan-400">(Coming Soon)</span>}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#070A12] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <AppCloudLogo className="h-10 w-auto" />
              </div>
              <p className="text-slate-500 text-sm max-w-md">
                Decentralized cloud infrastructure powered by independent node operators. 
                Join the future of cloud computing.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/" className="hover:text-white transition-colors">CloudNode</Link></li>
                <li><span className="cursor-not-allowed">Features (Coming Soon)</span></li>
                <li><span className="cursor-not-allowed">Pricing (Coming Soon)</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><span className="cursor-not-allowed">About (Coming Soon)</span></li>
                <li><span className="cursor-not-allowed">Blog (Coming Soon)</span></li>
                <li><span className="cursor-not-allowed">Careers (Coming Soon)</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()} Optio Cloud. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span className="cursor-not-allowed hover:text-slate-400 transition-colors">Privacy</span>
              <span className="cursor-not-allowed hover:text-slate-400 transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
