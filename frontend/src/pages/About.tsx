import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Accessibility, Shield, Heart, Globe } from "lucide-react";

const values = [
  {
    icon: Accessibility,
    title: "Accessibility First",
    desc: "Every feature is designed with screen-reader support, keyboard navigation, and visual contrast in mind.",
  },
  {
    icon: Shield,
    title: "Verified Trust",
    desc: "Aadhaar and PwD certificate verification via DigiLocker ensures every match is safe and accountable.",
  },
  {
    icon: Heart,
    title: "Community Driven",
    desc: "We bring together candidates, volunteers, NGOs, and contributors in one inclusive ecosystem.",
  },
  {
    icon: Globe,
    title: "Nationwide Reach",
    desc: "From metro cities to remote towns, our network is built to serve candidates across India.",
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 md:py-32 bg-secondary/30 overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-50" />
        <div className="container-wide relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="section-label mb-4">About Us</span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-8 leading-tight">
              Removing barriers, one match at a time.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Write For Me is a national platform that connects persons with disabilities to verified scribes, volunteers, and transport support for examinations and beyond.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 md:py-32 container-wide">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80"
              alt="Volunteer helping a student in a bright library"
              className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3]"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-label mb-4">Our Mission</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-4 mb-6">
              Fair opportunity is not a privilege. It is a right.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We believe that every candidate deserves equal access to examinations and opportunities. Write For Me coordinates the people, processes, and technology needed to make that happen.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From verification to match-making, reminders to reviews, our platform handles the logistics so users can focus on what matters most.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="section-label mb-4">Our Values</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4">
              What guides us
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border rounded-2xl p-8 card-hover"
              >
                <div className="w-14 h-14 rounded-xl gradient-teal flex items-center justify-center text-white mb-6">
                  <value.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 md:py-32 container-wide">
        <div className="max-w-3xl mx-auto text-center">
          <span className="section-label mb-4">Contact</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
            Get in touch
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Have questions or want to partner with us? Reach out anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <p className="text-lg font-medium">support@sahayak.org</p>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <p className="text-lg font-medium">1800-123-4567</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
