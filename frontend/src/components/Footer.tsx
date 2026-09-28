import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Community", to: "/community" },
      { label: "Hall of Fame", to: "/hall-of-fame" },
    ],
  },
  {
    title: "Participate",
    links: [
      { label: "Donate", to: "/donate" },
      { label: "Organisations", to: "/organisations" },
      { label: "Sign Up", to: "/signup" },
      { label: "Log In", to: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Sitemap", to: "/sitemap" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "Emergency Support", to: "/emergency" },
      { label: "Contact Us", to: "/about" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="container-wide">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="font-display text-3xl font-bold text-white">
              Write For Me
            </Link>
            <p className="mt-4 text-white/70 max-w-sm leading-relaxed">
              Connecting candidates with disabilities to verified scribes and volunteers. Built for inclusion, accessibility, and trust.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> support@writeforme.org
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> 1800-123-4567
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> New Delhi, India
              </div>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-display font-semibold text-lg mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-white/70 hover:text-white hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Write For Me. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50 hidden md:inline">Accessibility:</span>
            <AccessibilityToolbar />
          </div>
        </div>
      </div>
    </footer>
  );
};
