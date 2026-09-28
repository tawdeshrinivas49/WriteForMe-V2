import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Heart, IndianRupee, Shield, Receipt, Users } from "lucide-react";

const presetAmounts = [100, 500, 1000, 2000, 3000, 4000, 5000];

const Donate = () => {
  const [amount, setAmount] = useState<number | "custom">(500);
  const [customAmount, setCustomAmount] = useState("");

  const displayAmount = amount === "custom" ? (customAmount ? Number(customAmount) : 0) : amount;

  return (
    <Layout>
      <section className="py-24 md:py-32 container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="section-label mb-4">Contribute</span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mt-4 mb-6">
              Make a Difference
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your contribution helps us provide free scribes, transport, and assistive resources to candidates across India.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 bg-card border rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6">Choose an amount</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {presetAmounts.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={amount === amt ? "default" : "outline"}
                    className="h-14 text-lg font-semibold"
                    onClick={() => setAmount(amt)}
                  >
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {amt.toLocaleString("en-IN")}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={amount === "custom" ? "default" : "outline"}
                  className="h-14 text-base font-semibold"
                  onClick={() => setAmount("custom")}
                >
                  Custom
                </Button>
              </div>

              {amount === "custom" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <Label htmlFor="custom">Enter amount (minimum ₹100)</Label>
                  <div className="relative mt-2">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="custom"
                      type="number"
                      min={100}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-10"
                      placeholder="Enter amount"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <Label htmlFor="donor-name">Name</Label>
                  <Input id="donor-name" placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="donor-email">Email</Label>
                  <Input id="donor-email" type="email" placeholder="you@example.com" />
                </div>
              </div>

              <Button size="lg" className="w-full py-6 text-lg">
                <Heart className="w-5 h-5 mr-2" />
                Donate ₹{displayAmount.toLocaleString("en-IN")} via Razorpay
              </Button>
            </div>

            <div className="md:col-span-2 space-y-4">
              {[
                { icon: Shield, title: "Secure Payments", desc: "Razorpay-powered, PCI-compliant transactions." },
                { icon: Receipt, title: "Tax Benefits", desc: "80G receipt available for eligible donations." },
                { icon: Users, title: "100% Impact", desc: "Every rupee supports candidate assistance." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-secondary/30 rounded-2xl p-6"
                >
                  <div className="w-10 h-10 rounded-lg gradient-teal flex items-center justify-center text-white mb-4">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Donate;
