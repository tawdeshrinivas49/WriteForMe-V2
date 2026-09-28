import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getRequestById } from "@/lib/api";
import { Search, MapPin, ShieldCheck, Sparkles, Loader2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const statusMessages = {
  PENDING: "Request submitted – waiting for matching",
  MATCHED: "Match found! Please verify PIN to start",
  IN_PROGRESS: "Exam in progress",
  COMPLETED: "Exam completed – thank you!",
  CANCELLED: "Request cancelled",
};

const Waiting = () => {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      navigate("/dashboard");
      return;
    }

    let interval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await getRequestById(requestId);
        const data = response.data;
        setStatus(data.status);
        setExamName(data.examName);
        setLoading(false);

        // Auto-redirect if MATCHED
        if (data.status === "MATCHED") {
          clearInterval(interval);
          toast.success("Match found! Auto-redirecting...");
          navigate(`/match?requestId=${requestId}`);
          return;
        }

        // If completed or cancelled, stop polling
        if (data.status === "COMPLETED" || data.status === "CANCELLED") {
          clearInterval(interval);
          if (data.status === "COMPLETED") {
            toast.success("Exam completed! Thank you for using Write For Me.");
          }
        }
      } catch (err: any) {
        console.error("Error fetching request status:", err);
        setError(err.message || "Failed to fetch status");
        clearInterval(interval);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 8000); // poll every 8 sec

    return () => clearInterval(interval);
  }, [requestId, navigate]);

  if (error) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">Go to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20 md:py-28 container-narrow min-h-[70vh] flex items-center">
        <div className="w-full max-w-2xl mx-auto text-center">
          <div className="relative mx-auto mb-12 h-56 w-56">
            {status === "PENDING" && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-primary/40"
                  animate={{ scale: [0.6, 1.4], opacity: [0.7, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full gradient-teal flex items-center justify-center text-white shadow-xl"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Search className="w-14 h-14" />
                </motion.div>
              </>
            )}
            {status === "MATCHED" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
            )}
            {status === "IN_PROGRESS" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-16 w-16 text-yellow-600" />
                </div>
              </div>
            )}
            {status === "COMPLETED" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-teal-100 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-teal" />
                </div>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            {statusMessages[status as keyof typeof statusMessages] || "Processing..."}
          </h1>
          <p className="text-muted-foreground mb-10">
            {examName ? `Exam: ${examName}` : "Your request is being processed."}
          </p>

          <div className="space-y-3 text-left max-w-md mx-auto mb-10">
            <div className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 ${status === "PENDING" ? "border-teal" : ""}`}>
              <Search className={`w-5 h-5 ${status === "PENDING" ? "text-teal" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Searching for nearby volunteers</span>
              {status === "PENDING" && (
                <motion.span
                  className="ml-auto h-2 w-2 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              {status !== "PENDING" && <CheckCircle className="ml-auto w-4 h-4 text-green-500" />}
            </div>
            <div className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 ${status === "MATCHED" ? "border-teal" : ""}`}>
              <ShieldCheck className={`w-5 h-5 ${status === "MATCHED" ? "text-teal" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Match found – waiting for PIN verification</span>
              {status === "MATCHED" && (
                <motion.span
                  className="ml-auto h-2 w-2 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              {status === "MATCHED" && <CheckCircle className="ml-auto w-4 h-4 text-green-500" />}
            </div>
            <div className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 ${status === "IN_PROGRESS" ? "border-teal" : ""}`}>
              <Clock className={`w-5 h-5 ${status === "IN_PROGRESS" ? "text-teal" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Exam is in progress</span>
              {status === "IN_PROGRESS" && (
                <motion.span
                  className="ml-auto h-2 w-2 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              {status === "IN_PROGRESS" && <CheckCircle className="ml-auto w-4 h-4 text-green-500" />}
            </div>
            <div className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 ${status === "COMPLETED" ? "border-green-500" : ""}`}>
              <Sparkles className={`w-5 h-5 ${status === "COMPLETED" ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Completed</span>
              {status === "COMPLETED" && <CheckCircle className="ml-auto w-4 h-4 text-green-500" />}
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild variant="outline">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            {(status === "MATCHED" || status === "IN_PROGRESS") && (
              <Button asChild>
                <Link to={`/match?requestId=${requestId}`}>View Match Details</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Waiting;