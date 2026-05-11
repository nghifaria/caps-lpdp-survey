import { useState } from "react";
import { NavLink } from "react-router-dom";

import logo from "../../assets/logo_lpdp.png";

const RespNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const navLinkClass = ({ isActive }) =>
        `
        transition-colors duration-300 font-medium
        hover:text-[#ED722E]
        ${isActive ? "text-[#ED722E]" : "text-black"}
    `;

    return (
        <nav className="sticky top-0 z-50 bg-[#E7E4DC] shadow-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

                {/* Logo */}
                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="LPDP Logo"
                        className="h-[50px] w-auto object-contain"
                    />
                </div>

                {/* Hamburger Button */}
                <button
                    onClick={toggleMenu}
                    className="text-3xl md:hidden"
                    aria-label="Toggle Menu"
                >
                    ☰
                </button>

                {/* Desktop Menu */}
                <div className="hidden items-center gap-8 md:flex">
                    <NavLink
                        to="/"
                        className={navLinkClass}
                        onClick={closeMenu}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/faq"
                        className={navLinkClass}
                        onClick={closeMenu}
                    >
                        FAQ
                    </NavLink>

                    <NavLink
                        to="/guideline"
                        className={navLinkClass}
                        onClick={closeMenu}
                    >
                        Guideline
                    </NavLink>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="flex flex-col bg-[#E7E4DC] px-4 pb-4 md:hidden">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `py-3 font-medium transition-colors duration-300 hover:text-[#ED722E]
                            ${isActive ? "text-[#ED722E]" : "text-black"}`
                        }
                        onClick={closeMenu}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/faq"
                        className={({ isActive }) =>
                            `py-3 font-medium transition-colors duration-300 hover:text-[#ED722E]
                            ${isActive ? "text-[#ED722E]" : "text-black"}`
                        }
                        onClick={closeMenu}
                    >
                        FAQ
                    </NavLink>

                    <NavLink
                        to="/guideline"
                        className={({ isActive }) =>
                            `py-3 font-medium transition-colors duration-300 hover:text-[#ED722E]
                            ${isActive ? "text-[#ED722E]" : "text-black"}`
                        }
                        onClick={closeMenu}
                    >
                        Guideline
                    </NavLink>
                </div>
            )}
        </nav>
    );
};

export default RespNavbar;