'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide Navbar on admin routes
  if (pathname?.startsWith('/admin')) return null;


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/#explore' },
    { name: 'Crew', href: '/crew.htm' },
    { name: 'Upload', href: '/#upload' },
    { name: 'Chat', href: '/chat' },
    { name: 'Profile', href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/crew.htm') return pathname === '/crew.htm' || pathname === '/crew';
    if (href.startsWith('/#')) return pathname === '/' && typeof window !== 'undefined' && window.location.hash === href.substring(1);
    return pathname.startsWith(href);
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-[9995] transition-all duration-300 ${isScrolled ? 'bg-[#06080A]/90 backdrop-blur-md py-3 border-b border-[#FF4D1A]/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent py-6'}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center">
        <a href="/" className="group flex items-center gap-2 no-underline">
          <span className="text-2xl font-bebas tracking-tighter text-white transition-transform group-hover:scale-105">
            TAKE <span className="text-[#FF4D1A]">ONE</span>
          </span>
          <div className="w-1 h-5 bg-[#FF4D1A] opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block"></div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className={`relative text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-300 hover:text-[#FF4D1A] no-underline ${isActive(link.href) ? 'text-[#FF4D1A]' : 'text-[#6B7A8D]'}`}
            >
              {link.name}
              {isActive(link.href) && (
                <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-[#FF4D1A] shadow-[0_0_10px_#FF4D1A]"></span>
              )}
            </a>
          ))}
          
          <button 
            onClick={() => window.location.href = '/profile'}
            className="ml-4 px-6 py-2.5 bg-[#FF4D1A] text-white font-bebas text-[11px] tracking-[0.2em] uppercase rounded-sm transition-all hover:bg-[#FF7A1A] hover:shadow-[0_0_20px_rgba(255,77,26,0.5)] active:scale-95 border-none cursor-pointer"
          >
            My Signal
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-[#E8DFC8] p-2 hover:text-[#FF4D1A] transition-colors bg-transparent border-none cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-[#0E1218] border-b border-[#1C2330] overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-[600px] opacity-100 shadow-[0_20px_40px_rgba(0,0,0,0.8)]' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col items-center py-12 gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-lg font-bebas uppercase tracking-[0.3em] transition-colors no-underline ${isActive(link.href) ? 'text-[#FF4D1A]' : 'text-[#E8DFC8]'}`}
            >
              {link.name}
            </a>
          ))}
          <button 
            onClick={() => window.location.href = '/profile'}
            className="mt-6 px-10 py-4 bg-[#FF4D1A] text-white font-bebas text-sm tracking-[0.2em] uppercase rounded-sm border-none cursor-pointer"
          >
            My Signal
          </button>
        </div>
      </div>
    </header>
  );
}
