import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, AlertTriangle, Clock, UserX, Bus, MessageSquare, Loader2, CheckCircle } from "lucide-react";
import { raiseEmergencyTicket } from "@/lib/api";

const situations = [
  { icon: Clock, title: "My partner is running late", desc: "We call both sides and start a 15-minute escalation clock." },
  { icon: UserX, title: "My partner has not arrived", desc: "We instantly search for a standby scribe within 5 km." },
  { icon: Bus, title: "Transport has failed", desc: "We arrange an emergency cab from the community fund." },
  { icon: AlertTriangle, title: "I feel unsafe or harassed", desc: "A supervisor joins the call and the session is frozen." },
];

const Emergency = () => {
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleRaiseTicket = async () => {
    if (!issue || details.trim().length < 5) return;
    setSubmitting(true);
    try {
      const result = await raiseEmergencyTicket({
        examName: `EMERGENCY: ${issue}`,
        examDate: new Date().toISOString(),
        examCenterName: "Emergency Ticket",
        details,
      });
      const id = result?.data?.id || "submitted";
      setTicketId(id);
      toast.success("Emergency ticket raised — a supervisor is being notified now.");
      setDetails("");
      setIssue("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to raise emergency ticket. Please call the helpline.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-24 container-wide">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="max-w-3xl mb-10">
            <span className="section-label mb-4">Emergency Support</span>
            <h1 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4">We are here, right now</h1>
            <p className="text-lg text-muted-foreground">
              Exam-day problems need answers in minutes, not days. Pick what happened or call the 24x7 helpline.
            </p>
          </div>

          <div className="rounded-2xl gradient-coral text-white p-6 md:p-8 mb-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="text-sm uppercase tracking-wide font-semibold opacity-90">24x7 Helpline</p>
              <p className="text-3xl md:text-4xl font-display font-bold mt-1">1800-123-4567</p>
              <p className="opacity-90 mt-2">Average pick-up time: 38 seconds</p>
            </div>
            <Button size="lg" asChild className="!bg-white !text-foreground hover:!bg-white/90">
              <a href="tel:18001234567"><Phone className="w-5 h-5 mr-2" /> Call now</a>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {situations.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => { setIssue(s.title); setTicketId(null); }}
                className={`text-left rounded-2xl border p-5 transition-all ${
                  issue === s.title ? "border-primary bg-secondary" : "bg-card hover:-translate-y-0.5 hover:shadow"
                }`}
              >
                <s.icon className="w-6 h-6 text-coral mb-3" />
                <p className="font-bold mb-1">{s.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Raise a support ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticketId ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-lg">Ticket Raised Successfully</p>
                  <p className="text-sm text-muted-foreground">
                    Ticket ID: <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{ticketId}</code>
                  </p>
                  <p className="text-sm text-muted-foreground">A supervisor is calling you now.</p>
                  <Button variant="outline" size="sm" onClick={() => setTicketId(null)}>
                    Raise another ticket
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="issue">Selected issue</Label>
                    <p className="text-sm text-muted-foreground mt-1">{issue || "None selected yet"}</p>
                  </div>
                  <div>
                    <Label htmlFor="details">What is happening?</Label>
                    <Textarea id="details" value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} placeholder="Describe the situation in a few lines" />
                  </div>
                  <Button
                    disabled={!issue || details.trim().length < 5 || submitting}
                    onClick={handleRaiseTicket}
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Raising ticket...</> : "Raise ticket"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Emergency;
