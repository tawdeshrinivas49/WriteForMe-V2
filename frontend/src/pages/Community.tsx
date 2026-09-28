import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";

const Community = () => {
  return (
    <Layout>
      <section className="py-24 md:py-32 container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="section-label mb-4">Community</span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Join the Movement
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with volunteers, NGOs, and contributors making inclusive education a reality.
          </p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Community;
