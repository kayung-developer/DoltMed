import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import ThemeSwitcher from '../components/layout/ThemeSwitcher';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import Button from '../components/common/Button';
import Footer from '../components/layout/Footer';

const PublicLayout = () => {
    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen flex flex-col">
             <header className="fixed top-0 left-0 right-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-dortmed-600 dark:text-dortmed-400"><img src="/header.png" alt="DortMed Logo" className="h-14 w-auto" /></Link>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/about" className="nav-link">About Us</Link>
                        <Link to="/features" className="nav-link">Features</Link>
                        <Link to="/pricing" className="nav-link">Pricing</Link>
                        <Link to="/network" className="nav-link">Global Network</Link>
                        <Link to="/blog" className="nav-link">Health Hub</Link>
                        <Link to="/contact" className="nav-link">Contact </Link>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        <Link to="/login" className="hidden sm:block"><Button variant="ghost">Log In</Button></Link>
                        <Link to="/register"><Button>Sign Up</Button></Link>
                    </div>
                </nav>
            </header>

            <main className="flex-grow pt-16">
                 <Outlet />
            </main>

              <Footer />
        </div>
    );
};

export default PublicLayout;