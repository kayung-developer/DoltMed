import React from 'react';
import { Link } from 'react-router-dom';

// You would typically install a library like `react-icons` for social media icons
// For this implementation, we'll use simple text placeholders.
// Example: import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    const companyLinks = [
        { name: 'About Us', href: '/about' },
        { name: 'Features', href: '/features' },
        { name: 'Careers', href: '/careers' }, // New link
        { name: 'Press', href: '/press' },     // New link
        { name: 'Partners', href: '/network' },
    ];

    const resourcesLinks = [
        { name: 'Health Hub (Blog)', href: '/blog' },
        { name: 'Support Center', href: '/contact' },
        { name: 'FAQs', href: '/contact' },
        { name: 'Physician Resources', href: '/physician-resources' }, // New link
    ];

    const legalLinks = [
        { name: 'Privacy Policy', href: '/privacy' }, // New link
        { name: 'Terms of Service', href: '/terms' },   // New link
        { name: 'HIPAA Notice', href: '/hipaa' },       // New link
    ];

    const socialLinks = [
        { name: 'Facebook', href: '#' },
        { name: 'Twitter', href: '#' },
        { name: 'LinkedIn', href: '#' },
        { name: 'Instagram', href: '#' },
    ];

    return (
        <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

                    {/* Logo and Mission Column */}
                    <div className="col-span-2 lg:col-span-1">
                        <Link to="/" className="text-2xl font-bold text-dortmed-600 dark:text-dortmed-400 flex items-center">
                             <img src="/header.png" alt="DortMed Logo" className="h-14 w-auto mr-2" />

                        </Link>
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                            Revolutionizing healthcare through technology and personalized care.
                        </p>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Company</h3>
                        <ul className="mt-4 space-y-2">
                            {companyLinks.map(link => (
                                <li key={link.name}>
                                    <Link to={link.href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-dortmed-600 dark:hover:text-dortmed-400">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Resources</h3>
                         <ul className="mt-4 space-y-2">
                            {resourcesLinks.map(link => (
                                <li key={link.name}>
                                    <Link to={link.href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-dortmed-600 dark:hover:text-dortmed-400">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Legal</h3>
                         <ul className="mt-4 space-y-2">
                            {legalLinks.map(link => (
                                <li key={link.name}>
                                    <Link to={link.href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-dortmed-600 dark:hover:text-dortmed-400">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} DortMed, Inc. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        {socialLinks.map(link => (
                            <a key={link.name} href={link.href} className="text-gray-500 hover:text-dortmed-600 dark:hover:text-dortmed-400">
                                <span className="sr-only">{link.name}</span>
                                {/* Placeholder for social icon */}
                                <span>{link.name[0]}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;