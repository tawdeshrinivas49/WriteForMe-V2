import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/store/useUser";

// Base links for all authenticated users
const commonLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/emergency", label: "Emergency" },
  { to: "/community", label: "Community" },
  { to: "/hall-of-fame", label: "Hall of Fame" },
  { to: "/sitemap", label: "Sitemap" },
];

// Role‑specific links
const roleLinks = {
  STUDENT: [
    { to: "/request", label: "Request" },
    { to: "/match", label: "My Match" },
  ],
  VOLUNTEER: [
    { to: "/matching", label: "Available Requests" }, // volunteers see open requests
  ],
  CONTRIBUTOR: [
    { to: "/donate", label: "Donate" },
  ],
};

const publicLinks = [
  { to: "/about", label: "About Us" },
  { to: "/community", label: "Community" },
  { to: "/hall-of-fame", label: "Hall of Fame" },
  { to: "/donate", label: "Donate" },
  { to: "/organisations", label: "Organisations" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const isLoggedIn = !!user;
  const role = user?.role;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Build navigation links based on role
  const getNavLinks = () => {
    if (!isLoggedIn) return publicLinks;
    const roleSpecific = roleLinks[role as keyof typeof roleLinks] || [];
    return [...commonLinks, ...roleSpecific];
  };

  const navLinks = getNavLinks();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-background/80 backdrop-blur-sm border-b border-transparent"
      )}
    >
      <nav className="container-full">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          <Link
            to="/"
            className="font-display text-2xl md:text-3xl font-bold text-foreground hover:text-primary transition-colors duration-300"
          >
            Write For Me
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "nav-link",
                  location.pathname === link.to && "text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <AccessibilityToolbar />
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" asChild aria-label="Profile">
                  <Link to="/profile"><User className="w-5 h-5" /></Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <AccessibilityToolbar />
            <button
              className="p-2 hover:bg-accent rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border overflow-hidden"
            >
              <div className="py-6 space-y-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.to}
                      className={cn(
                        "block px-2 py-2.5 text-base font-medium rounded-md hover:bg-accent transition-colors",
                        location.pathname === link.to && "text-primary bg-accent"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 border-t border-border flex flex-col gap-2">
                  {isLoggedIn ? (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/profile">My Profile</Link>
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleLogout}>
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/login">Log In</Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link to="/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};