import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "Main",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Community", to: "/community" },
      { label: "Hall of Fame", to: "/hall-of-fame" },
      { label: "Donate", to: "/donate" },
      { label: "Organisations", to: "/organisations" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log In", to: "/login" },
      { label: "Sign Up", to: "/signup" },
      { label: "Welcome & Orientation", to: "/welcome" },
      { label: "Onboarding", to: "/onboarding" },
      { label: "My Profile", to: "/profile" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Exam Support",
    links: [
      { label: "Request a Scribe", to: "/request" },
      { label: "Finding a Match", to: "/waiting" },
      { label: "My Match", to: "/match" },
      { label: "Emergency Support", to: "/emergency" },
      { label: "Sitemap", to: "/sitemap" },
    ],
  },
];

const Sitemap = () => {
  return (
    <Layout>
      <section className="py-24 md:py-32 container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <span className="section-label mb-4">Navigation</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mt-4">Sitemap</h1>
            <p className="text-muted-foreground mt-4">Jump to any page quickly.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Sitemap;
