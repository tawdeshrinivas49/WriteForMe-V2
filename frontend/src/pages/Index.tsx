import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  HandHeart,
  GraduationCap,
  Building2,
  Heart,
  Star,
  ArrowRight,
  CheckCircle2,
  Shield,
  Accessibility,
} from "lucide-react";

const kpis = [
  { value: 12500, suffix: "+", label: "Candidates Assisted" },
  { value: 8700, suffix: "+", label: "Verified Volunteers" },
  { value: 98, suffix: "%", label: "Match Satisfaction" },
  { value: 32, suffix: "", label: "States Covered" },
];

const steps = [
  {
    icon: Users,
    title: "Sign Up",
    desc: "Register as a candidate, volunteer, NGO, or contributor in minutes.",
  },
  {
    icon: Shield,
    title: "Verify",
    desc: "Aadhaar and PwD certificate verification via DigiLocker for trust.",
  },
  {
    icon: HandHeart,
    title: "Match",
    desc: "Our smart system pairs candidates with the right scribe or transport.",
  },
  {
    icon: GraduationCap,
    title: "Excel",
    desc: "Focus on your exam while we handle coordination and reminders.",
  },
];

const personas = [
  {
    icon: GraduationCap,
    title: "Candidate",
    desc: "A person with disability who needs a scribe or transport for exams.",
    color: "bg-teal/10 text-teal",
  },
  {
    icon: HandHeart,
    title: "Volunteer",
    desc: "A verified scribe who assists candidates during examinations.",
    color: "bg-coral/10 text-coral",
  },
  {
    icon: Building2,
    title: "NGO",
    desc: "Organisations that bulk-upload data and coordinate community support.",
    color: "bg-lilac/10 text-lilac",
  },
  {
    icon: Heart,
    title: "Contributor",
    desc: "Anyone who donates to support accessible education for all.",
    color: "bg-pastel-orange/10 text-pastel-orange",
  },
];

const stories = [
  {
    name: "Riya Sharma",
    role: "UPSC Aspirant",
    quote: "Write For Me matched me with a scribe who understood my needs. I could finally focus on my answers, not logistics.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
  },
  {
    name: "Amit Patel",
    role: "Volunteer Scribe",
    quote: "Writing for someone else is a responsibility and a privilege. The platform makes the process safe and simple.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  },
  {
    name: "Sneha Reddy",
    role: "Partner Coordinator",
    quote: "We onboarded 200 candidates in one afternoon. The coordination tools save us weeks of work every season.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
  },
  {
    name: "Imran Sheikh",
    role: "NEET Aspirant",
    quote: "The transport funding meant I reached my centre on time for the first time in three attempts.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
  },
];

const reviews = [
  { name: "Vikram K.", rating: 5, text: "Seamless experience from signup to exam day." },
  { name: "Neha R.", rating: 5, text: "The scribe was punctual, patient, and professional." },
  { name: "Rahul M.", rating: 4, text: "Great initiative. Accessibility options are excellent." },
  { name: "Priya S.", rating: 5, text: "The OTP handshake made me feel safe throughout the exam." },
  { name: "Ankit D.", rating: 5, text: "Matched in under a minute, 2 km from my centre." },
  { name: "Fatima A.", rating: 4, text: "High-contrast mode is a real difference-maker for me." },
];

const faqs = [
  {
    q: "Who can register as a candidate?",
    a: "Any person with a disability who requires a scribe or transport assistance for an examination can register and upload their PwD certificate for verification.",
  },
  {
    q: "How does the matching process work?",
    a: "Profiles are anonymised until both candidate and volunteer accept the match. Factors like language, education level, distance, and ratings are considered.",
  },
  {
    q: "Is my identity protected?",
    a: "Yes. Names and contact details are hidden until a match is mutually accepted, ensuring privacy and safety.",
  },
  {
    q: "Can I donate without signing up?",
    a: "Contributors can donate via Razorpay using a simple Google sign-in or guest checkout. Verification is not required.",
  },
  {
    q: "What happens on exam day?",
    a: "Both users complete a two-step OTP handshake—one to start the session and one to end it—ensuring accountability and safety.",
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(10, Math.floor(duration / value));
    const timer = setInterval(() => {
      start += Math.ceil(value / (duration / stepTime));
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
        />
      ))}
    </div>
  );
}

const Index = () => {
  return (
    <Layout>
      {/* Hero — full viewport, new image */}
      <section className="relative h-[100svh] -mt-16 md:-mt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80"
            alt="Diverse group of students and volunteers collaborating in a bright inclusive space"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        <div className="relative container-full h-full flex items-center pt-16 md:pt-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="max-w-2xl text-white"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Accessibility className="w-4 h-4" />
              <span className="text-sm font-medium">Accessible. Inclusive. Trusted.</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] mb-6 uppercase">
              Access, Empower, Equalise
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
              We connect candidates who require assistance with verified volunteers nearby — plus transport and community funding.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="px-8 py-6 text-base font-semibold">
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="px-8 py-6 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPIs — animated counters */}
      <section className="py-16 md:py-24 bg-secondary/30 pattern-dots section-divider">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card border shadow-sm"
              >
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
                  <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                </p>
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                  {kpi.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — graphics/illustrations */}
      <section className="py-24 md:py-32 container-wide section-divider">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-label mb-4">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
            Four simple steps to inclusion
          </h2>
          <p className="text-lg text-muted-foreground">
            From registration to exam day, our platform guides every user with clarity and care.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="bg-card border rounded-2xl p-8 text-center h-full card-hover">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-teal flex items-center justify-center text-white shadow-lg">
                  <step.icon className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who it's for — hover effects */}
      <section className="py-24 md:py-32 bg-secondary/30 section-divider">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="section-label mb-4">Who It's For</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
              Built for every role in the journey
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personas.map((persona, i) => (
              <motion.div
                key={persona.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group"
              >
                <div className="bg-card border rounded-2xl p-6 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:border-primary/30">
                  <div className={`w-14 h-14 rounded-xl ${persona.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                    <persona.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{persona.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {persona.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className="py-24 md:py-32 section-divider overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-16 px-6">
          <span className="section-label mb-4">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
            Our Success Stories
          </h2>
        </div>
        <div className="marquee-track marquee-mask">
          <div className="flex gap-6 w-max animate-marquee">
            {[...stories, ...stories].map((story, i) => (
              <article
                key={`${story.name}-${i}`}
                className="w-[340px] md:w-[400px] flex-shrink-0 bg-card border rounded-2xl overflow-hidden"
              >
                <img
                  src={story.image}
                  alt={`${story.name}, ${story.role}`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-6">
                  <p className="text-base leading-relaxed mb-5">“{story.quote}”</p>
                  <p className="font-bold">{story.name}</p>
                  <p className="text-sm text-muted-foreground">{story.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews with stars */}
      <section className="py-16 md:py-24 bg-secondary/30 section-divider overflow-hidden">
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="section-label mb-4">Reviews</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-4">
              Loved by the community
            </h2>
          </div>
          <div className="marquee-track marquee-mask">
            <div className="flex gap-6 w-max animate-marquee-fast">
              {[...reviews, ...reviews].map((review, i) => (
                <div key={`${review.name}-${i}`} className="w-[300px] flex-shrink-0 bg-card border rounded-xl p-6">
                  <StarRating rating={review.rating} />
                  <p className="mt-4 text-foreground font-medium">{review.text}</p>
                  <p className="mt-4 text-sm text-muted-foreground">— {review.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — teal question, white answer */}
      <section className="py-24 md:py-32 container-wide section-divider">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="section-label mb-4">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6">
              Common Questions
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Everything you need to know about using Write For Me.
            </p>
            <Button asChild>
              <Link to="/sitemap">View Sitemap</Link>
            </Button>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-left font-semibold text-base md:text-lg px-4 py-5 rounded-lg hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground data-[state=open]:rounded-b-none transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 py-5 text-base leading-relaxed bg-card text-foreground rounded-b-lg data-[state=open]:animate-accordion-down">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 gradient-teal text-white section-divider">
        <div className="container-wide text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Be part of the solution
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-10">
              Whether you need assistance or can offer a hand, every connection starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8 py-6 text-base font-semibold !bg-white !text-teal hover:!bg-white/90">
                <Link to="/signup">Sign Up Now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="px-8 py-6 text-base font-semibold !bg-transparent !border-white/30 !text-white hover:!bg-white/10"
              >
                <Link to="/donate">Donate</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
