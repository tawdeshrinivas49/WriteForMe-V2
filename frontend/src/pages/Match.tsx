import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"; // ✅ added for review
import { useUser } from "@/store/useUser";
import { toast } from "sonner";
import {
  getRequestById,
  getRequests,
  verifyStartPin,
  verifyCompletionPin,
  submitScribeReview, // ✅ added
} from "@/lib/api";
import {
  Phone,
  MapPin,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  LifeBuoy,
  CheckCircle2,
  Loader2,
  Clock,
  Star, // ✅ added
} from "lucide-react";

const Match = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdFromUrl = searchParams.get("requestId");
  const { user, token } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [startPinInput, setStartPinInput] = useState("");
  const [endPinInput, setEndPinInput] = useState("");
  const [verifyingStart, setVerifyingStart] = useState(false);
  const [verifyingEnd, setVerifyingEnd] = useState(false);
  const [fetchingId, setFetchingId] = useState(false);

  // ----- Review states (only for student) -----
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch the active request ID if none in URL
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const findActiveRequest = async () => {
      if (requestIdFromUrl) {
        fetchRequest(requestIdFromUrl);
        return;
      }

      try {
        setFetchingId(true);
        const response = await getRequests();
        const requests = response.data || [];

        if (requests.length === 0) {
          toast.info("You haven't created any requests yet.");
          navigate("/request");
          return;
        }

        // Find the first request that is not CANCELLED or COMPLETED
        let active = requests.find(
          (r: any) => !["CANCELLED", "COMPLETED"].includes(r.status)
        );
        if (!active) {
          active = requests[0];
        }

        setSearchParams({ requestId: active.id });
        setFetchingId(false);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Could not find your requests.");
        navigate("/dashboard");
      } finally {
        setFetchingId(false);
      }
    };

    findActiveRequest();
  }, [requestIdFromUrl, token, navigate, setSearchParams]);

  const fetchRequest = async (id: string) => {
    try {
      setLoading(true);
      const response = await getRequestById(id);
      setRequest(response.data);
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load match details.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestIdFromUrl) {
      fetchRequest(requestIdFromUrl);
    }
  }, [requestIdFromUrl]);

  const handleStartPinVerify = async () => {
    if (!startPinInput || startPinInput.length < 4) {
      toast.error("Please enter a valid start PIN");
      return;
    }
    setVerifyingStart(true);
    try {
      const result = await verifyStartPin(requestIdFromUrl!, startPinInput);
      if (result.success) {
        toast.success("Session started successfully!");
        const updated = await getRequestById(requestIdFromUrl!);
        setRequest(updated.data);
        setStartPinInput("");
      } else {
        toast.error(result.error || "Invalid start PIN");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify start PIN");
    } finally {
      setVerifyingStart(false);
    }
  };

  const handleEndPinVerify = async () => {
    if (!endPinInput || endPinInput.length < 4) {
      toast.error("Please enter a valid end PIN");
      return;
    }
    setVerifyingEnd(true);
    try {
      const result = await verifyCompletionPin(requestIdFromUrl!, endPinInput);
      if (result.success) {
        toast.success("Exam completed successfully!");
        const updated = await getRequestById(requestIdFromUrl!);
        setRequest(updated.data);
        setEndPinInput("");
      } else {
        toast.error(result.error || "Invalid end PIN");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify end PIN");
    } finally {
      setVerifyingEnd(false);
    }
  };

  // ----- Submit Scribe Review -----
  const handleSubmitReview = async () => {
    if (!reviewRating) {
      toast.error("Please select a rating.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await submitScribeReview({
        requestId: requestIdFromUrl!,
        rating: reviewRating,
        comment: reviewComment,
        tags: [], // optional
      });
      const gUpdate = res?.data?.gamificationUpdate;
      const xpEarned = gUpdate?.xpAwarded?.totalEarnedXp || 100;
      
      toast.success(`Review submitted! Awarded +${xpEarned} XP to your scribe! 🌟`);

      if (gUpdate?.unlockedBadges && gUpdate.unlockedBadges.length > 0) {
        gUpdate.unlockedBadges.forEach((badge: any) => {
          toast.info(`🎉 Scribe Unlocked Badge: ${badge.title}!`);
        });
      }

      setReviewRating(0);
      setReviewComment("");
      // Refresh request to hide review form
      const updated = await getRequestById(requestIdFromUrl!);
      setRequest(updated.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (fetchingId || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No request found.</p>
          <Button onClick={() => navigate("/request")} className="mt-4">
            Create a Request
          </Button>
        </div>
      </Layout>
    );
  }

  const isVolunteer = user?.role === "VOLUNTEER";
  const isCandidate = user?.role === "STUDENT";
  const status = request.status;
  const isMatched =
    status === "MATCHED" ||
    status === "IN_PERSON_VERIFIED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED";

  const counterpart = isMatched
    ? isVolunteer
      ? request.candidate?.user
      : request.volunteer?.user
    : null;
  const counterpartName =
    counterpart?.name || (isMatched ? "Unknown" : "Not yet matched");
  const counterpartPhone = counterpart?.phone || "—";
  const counterpartGender = counterpart?.gender || "—";

  // Only the VOLUNTEER types a PIN to verify — student never enters a PIN
  const showPinEntry =
    isVolunteer && (status === "MATCHED" || status === "IN_PROGRESS");
  // Show the actual PIN codes only to the candidate (student) so they can share them
  const showPins =
    isCandidate && status !== "COMPLETED" && status !== "CANCELLED";

  // Show review form only for student, when COMPLETED, and no review exists yet
  const showReviewForm =
    isCandidate &&
    status === "COMPLETED" &&
    !request.review;

  return (
    <Layout>
      <section className="py-16 md:py-20 container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <span className="section-label mb-4">My Request</span>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-4">
              {isMatched
                ? `Matched with ${counterpartName}`
                : "Waiting for a match"}
            </h1>
            <p className="text-muted-foreground mt-3">
              Status:{" "}
              <Badge variant={status === "COMPLETED" ? "default" : "secondary"}>
                {status}
              </Badge>
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                  {isMatched
                    ? isVolunteer
                      ? "Candidate"
                      : "Scribe"
                    : "Request"}{" "}
                  details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {isMatched ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://i.pravatar.cc/120?u=${encodeURIComponent(
                        counterpartName
                      )}`}
                      alt={`Portrait of ${counterpartName}`}
                      className="w-20 h-20 rounded-full object-cover border"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-xl font-bold">{counterpartName}</p>
                      <p className="text-sm text-muted-foreground">
                        {isVolunteer ? "Candidate" : "Volunteer"} •{" "}
                        {counterpartGender}
                      </p>
                      <Badge className="mt-2">Verified via DigiLocker</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">Matching in progress</p>
                      <p className="text-sm text-muted-foreground">
                        We are finding a suitable volunteer for you.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => navigate("/matching")}
                      >
                        View matching status
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <p className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-teal" />{" "}
                    {request.examName}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal" />{" "}
                    {request.examCenterName || "Exam centre"}
                  </p>
                  {isMatched && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal" />{" "}
                      {counterpartPhone}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {isMatched && counterpartPhone !== "—" && (
                    <Button asChild>
                      <a href={`tel:${counterpartPhone.replace(/\s/g, "")}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to="/emergency">
                      <LifeBuoy className="w-4 h-4 mr-2" />
                      Emergency support
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" /> Session PINs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                {showPins && (
                  <div className="rounded-xl bg-secondary p-4">
                    <p className="font-medium mb-2">Your PINs to share</p>
                    <p>
                      Start:{" "}
                      <span className="font-mono text-lg tracking-widest">
                        {request.invigilatorPin}
                      </span>
                    </p>
                    <p>
                      End:{" "}
                      <span className="font-mono text-lg tracking-widest">
                        {request.completionPin}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share the start PIN before the exam and the end PIN once
                      you finish.
                    </p>
                  </div>
                )}

                {/* Student: waiting for volunteer to start */}
                {isCandidate && status === "MATCHED" && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Waiting for session to start
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Share your <strong>Start PIN</strong> above with your scribe. They will enter it to begin the session.
                    </p>
                  </div>
                )}

                {/* Student: session in progress */}
                {isCandidate && status === "IN_PROGRESS" && (
                  <div className="rounded-xl border border-teal/40 bg-teal/5 p-4 text-sm">
                    <p className="font-medium text-teal flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Session in progress
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Share your <strong>End PIN</strong> above with your scribe once the exam is over.
                    </p>
                  </div>
                )}

                {showPinEntry && (
                  <>
                    {status === "MATCHED" && (
                      <div className="space-y-2">
                        <Label htmlFor="sotp">Enter start PIN</Label>
                        <Input
                          id="sotp"
                          value={startPinInput}
                          onChange={(e) => setStartPinInput(e.target.value)}
                          placeholder="4‑digit PIN"
                          maxLength={6}
                        />
                        <Button
                          className="w-full"
                          onClick={handleStartPinVerify}
                          disabled={verifyingStart || !startPinInput}
                        >
                          {verifyingStart ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Start Session
                        </Button>
                      </div>
                    )}

                    {status === "IN_PROGRESS" && (
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-teal font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Session in
                          progress
                        </p>
                        <Label htmlFor="eotp">Enter end PIN</Label>
                        <Input
                          id="eotp"
                          value={endPinInput}
                          onChange={(e) => setEndPinInput(e.target.value)}
                          placeholder="4‑digit PIN"
                          maxLength={6}
                        />
                        <Button
                          className="w-full"
                          onClick={handleEndPinVerify}
                          disabled={verifyingEnd || !endPinInput}
                        >
                          {verifyingEnd ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          End Session
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {status === "COMPLETED" && (
                  <div className="rounded-xl border border-teal/40 bg-teal/5 p-4">
                    <p className="font-semibold text-teal flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Exam completed
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Thank you for using Write For Me.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---------- REVIEW SECTION (only for student, after COMPLETED) ---------- */}
          {showReviewForm && (
            <div className="mt-8 max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rate your scribe</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    How was your experience with {counterpartName}?
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Your rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewRating(i)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              i <= reviewRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reviewComment">Comment (optional)</Label>
                    <Textarea
                      id="reviewComment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this scribe..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!reviewRating || submittingReview}
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </section>
    </Layout>
  );
};

export default Match;