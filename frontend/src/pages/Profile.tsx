import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/store/useUser";
import { toast } from "sonner";
import { Star, ShieldCheck, History, Loader2, AlertCircle, Trophy, Award, Zap, Lock, MessageSquare, Upload, Camera } from "lucide-react";
import apiClient, { submitPlatformFeedback, getVolunteerGamificationProfile, getVolunteerReviews, uploadProfileImage, toggleAvailability } from "@/lib/api";

// Helper component for star rating
function StarPick({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} stars`}>
          <Star className={`w-7 h-7 ${i <= value ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
        </button>
      ))}
    </div>
  );
}

// Type for a session/request history item
interface SessionHistory {
  id: string;
  examName: string;
  examDate: string;
  status: string;
  counterpartName?: string;
}

const Profile = () => {
  const { user, isFullyVerified } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Volunteer Gamification & Reviews states
  const [gamification, setGamification] = useState<any>(null);
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);

  // UPI related states (for volunteers)
  const [upiId, setUpiId] = useState("");
  const [updatingUpi, setUpdatingUpi] = useState(false);

  // Fetch session history & gamification profile
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const endpoint = user?.role === 'STUDENT'
          ? '/users/dashboard/student'
          : '/users/dashboard/volunteer';
        const response = await apiClient.get(endpoint);
        const data = response.data;
        const exams = user?.role === 'STUDENT' ? data.upcomingExams : data.upcomingAssignments;
        if (exams && Array.isArray(exams)) {
          setHistory(exams.map((e: any) => ({
            id: e.id,
            examName: e.examName || e.examTitle,
            examDate: e.examDate || e.date,
            status: e.status,
            counterpartName: e.volunteer?.user?.name || e.student?.name || '—'
          })));
        } else {
          setHistory([]);
        }
        if (user?.role === 'VOLUNTEER') {
          if (data.profile?.upiId) setUpiId(data.profile.upiId);
          setIsAvailable(data.profile?.isAvailable || false);

          const volId = user?.volunteerProfileId || (user as any)?.volunteerProfile?.id || data.profile?.volunteerId;
          if (volId) {
            try {
              const [gRes, rRes] = await Promise.all([
                getVolunteerGamificationProfile(volId),
                getVolunteerReviews(volId),
              ]);
              if (gRes.success) setGamification(gRes.data);
              if (rRes.success) setReviewsReceived(rRes.data);
            } catch (err) {
              console.error('Error fetching gamification/reviews:', err);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile history:', error);
        toast.error('Could not load your session history.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleReviewSubmit = async () => {
    if (!rating || reviewText.trim().length < 5) {
      toast.error('Please provide a rating and at least 5 characters of feedback.');
      return;
    }
    try {
      await submitPlatformFeedback({
        rating,
        feedbackText: reviewText,
        category: 'GENERAL',
        appVersion: '1.0.0',
        deviceInfo: navigator.userAgent,
      });
      toast.success('Thank you for your review!');
      setRating(0);
      setReviewText('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review.');
    }
  };

  const handleUpdateUpi = async () => {
    if (!upiId || !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }
    setUpdatingUpi(true);
    try {
      await apiClient.put('/users/volunteer-profile', { upiId });
      toast.success('UPI updated successfully');
      // Optionally refresh user data
      const profileRes = await apiClient.get('/users/profile');
      // Update store if needed
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update UPI');
    } finally {
      setUpdatingUpi(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await uploadProfileImage(file);
      toast.success('Profile image updated');
      // Update UI (we can reload or let Zustand update if we had a refresh method)
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleToggleAvailability = async () => {
    const newVal = !isAvailable;
    try {
      await toggleAvailability(newVal);
      setIsAvailable(newVal);
      toast.success(`Availability set to ${newVal ? 'Available' : 'Busy'}`);
    } catch (err: any) {
      toast.error('Failed to update availability');
    }
  };

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
      <section className="py-16 md:py-20 container-wide">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
              <img
                src={user?.profileImageUrl ? `http://localhost:5000${user.profileImageUrl}` : `https://i.pravatar.cc/160?u=${encodeURIComponent(user?.name || "user")}`}
                alt="Your profile portrait"
                className="w-24 h-24 rounded-full border object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingImg ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">{user?.name || "Your profile"}</h1>
              <p className="text-muted-foreground capitalize mt-1">{user?.role?.toLowerCase() ?? "guest"}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant={isFullyVerified ? "default" : "secondary"}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {isFullyVerified ? "DigiLocker verified" : "Verification pending"}
                </Badge>
                <Badge variant="secondary">Phone: {user?.phone || '—'}</Badge>
                {user?.role === 'VOLUNTEER' && (
                  <Button size="sm" variant={isAvailable ? "default" : "outline"} onClick={handleToggleAvailability} className="h-6 text-xs px-2 rounded-full">
                    {isAvailable ? "Available for Requests" : "Busy / Offline"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* UPI section for volunteers */}
          {user?.role === 'VOLUNTEER' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Volunteer Payment Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="upi">UPI ID (for receiving payments) *</Label>
                    <Input
                      id="upi"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This UPI will receive your honorarium after each completed exam.
                    </p>
                  </div>
                  <Button onClick={handleUpdateUpi} disabled={updatingUpi}>
                    {updatingUpi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update UPI
                  </Button>
                  {!upiId && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <AlertCircle className="inline mr-2 h-4 w-4" />
                      Please add your UPI ID to receive payments. Without it, you cannot accept assignments.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gamification & Achievements Section for Volunteers */}
          {user?.role === 'VOLUNTEER' && gamification && (
            <Card className="mb-8 border-teal/30 bg-gradient-to-br from-background to-teal/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  Scribe Rank & Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Level & XP Bar */}
                <div className="p-4 rounded-xl bg-card border shadow-sm space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Current Rank</span>
                      <h3 className="text-2xl font-bold text-teal flex items-center gap-2">
                        Level {gamification.levelInfo?.level}: {gamification.levelInfo?.title}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-sm px-3 py-1 bg-amber-100 text-amber-800 border-amber-200">
                      <Zap className="w-4 h-4 mr-1 text-amber-500 fill-amber-500" />
                      {gamification.levelInfo?.currentXp || 0} XP
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-teal h-full rounded-full transition-all duration-500"
                        style={{ width: `${gamification.levelInfo?.progressPercent || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{gamification.levelInfo?.progressPercent || 0}% to next rank</span>
                      <span>
                        {gamification.levelInfo?.xpToNextLevel > 0
                          ? `${gamification.levelInfo.xpToNextLevel} XP needed for next level`
                          : 'Max Tier Achieved!'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges Grid */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                    <Award className="w-4 h-4" /> Earned Badges ({gamification.badges?.filter((b: any) => b.isUnlocked).length || 0}/{gamification.badges?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {gamification.badges?.map((badge: any) => (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${
                          badge.isUnlocked
                            ? 'bg-amber-50/50 border-amber-200 text-amber-900 shadow-sm'
                            : 'bg-muted/40 border-muted text-muted-foreground opacity-60'
                        }`}
                      >
                        <div className="text-2xl p-2 bg-background rounded-md shadow-xs">
                          {badge.isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{badge.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Reviews Received for Volunteers */}
          {user?.role === 'VOLUNTEER' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal" />
                  Student Reviews & Feedback ({reviewsReceived.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsReceived.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No student reviews received yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviewsReceived.map((r: any) => (
                      <div key={r.id} className="p-4 rounded-lg bg-muted/50 border space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-semibold ml-1">{r.rating}/5</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {r.comment && <p className="text-sm italic text-foreground mt-1">"{r.comment}"</p>}
                        {r.request && (
                          <p className="text-xs text-muted-foreground">
                            Exam: {r.request.examName} &bull; Candidate: {r.request.candidate?.user?.name || 'Student'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Session history</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sessions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Counterpart</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{new Date(h.examDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{h.examName}</TableCell>
                        <TableCell>{h.counterpartName}</TableCell>
                        <TableCell>
                          <Badge variant={h.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {h.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Platform Review */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Review the platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StarPick value={rating} onChange={setRating} />
              <div>
                <Label htmlFor="pr">Your experience with Write For Me</Label>
                <Textarea
                  id="pr"
                  maxLength={1000}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us what worked and what we should improve"
                />
              </div>
              <Button
                disabled={!rating || reviewText.trim().length < 5}
                onClick={handleReviewSubmit}
              >
                Submit review
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Profile;