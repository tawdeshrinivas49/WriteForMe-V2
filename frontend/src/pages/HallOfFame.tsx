import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/store/useUser";
import { toast } from "sonner";
import { 
  Star, 
  Trophy, 
  Medal, 
  Crown, 
  Award, 
  Users, 
  Calendar, 
  MapPin,
  Loader2,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { submitPlatformFeedback, getLeaderboard } from "@/lib/api";

// Types
interface LeaderboardEntry {
  rank: number;
  volunteerId: string;
  phone: string;
  profileImageUrl: string | null;
  xpPoints: number;
  totalExams: number;
  averageRating: number;
  level: number;
  title: string;
}

// Helper: Get medal emoji by rank
const getMedal = (rank: number) => {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <span className="text-muted-foreground font-mono w-6 text-center">#{rank}</span>;
};

// Helper: Get level color
const getLevelColor = (level: number) => {
  const colors = [
    'bg-gray-100 text-gray-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
  ];
  return colors[Math.min(level - 1, colors.length - 1)] || colors[0];
};

const HallOfFame = () => {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review states
  const [category, setCategory] = useState("GENERAL");
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await getLeaderboard(10);
        if (response.success && Array.isArray(response.data)) {
          setLeaderboard(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboardData();
  }, []);

  // Submit platform feedback
  const handleSubmitReview = async () => {
    if (!rating || feedbackText.trim().length < 5) {
      toast.error('Please provide a rating and at least 5 characters of feedback.');
      return;
    }
    setSubmitting(true);
    try {
      await submitPlatformFeedback({
        rating,
        feedbackText,
        category,
        appVersion: '1.0.0',
        deviceInfo: navigator.userAgent,
      });
      toast.success('Thank you for your feedback!');
      setReviewSubmitted(true);
      setRating(0);
      setFeedbackText('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-16 container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="w-4 h-4 mr-1" /> Community Recognition
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Hall of Fame
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Celebrating our top volunteers who make a difference in the lives of students with disabilities.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Leaderboard */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Volunteers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-teal" />
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No volunteers have earned enough XP yet. Be the first!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry) => (
                        <div
                          key={entry.rank}
                          className={`
                            flex items-center gap-4 p-4 rounded-lg transition-all
                            ${entry.rank === 1 ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-muted'}
                          `}
                        >
                          <div className="flex-shrink-0 w-10 text-center">
                            {getMedal(entry.rank)}
                          </div>
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={entry.profileImageUrl ? `http://localhost:5000${entry.profileImageUrl}` : undefined} />
                            <AvatarFallback className="bg-teal-100 text-teal-800">
                              {entry.phone.slice(-4)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              Volunteer {entry.phone.slice(-6)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Badge variant="secondary" className={getLevelColor(entry.level)}>
                                Level {entry.level} • {entry.title}
                              </Badge>
                              <span className="text-muted-foreground">
                                {entry.totalExams} exams
                              </span>
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500" />
                                {entry.averageRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-teal">{entry.xpPoints}</p>
                            <p className="text-xs text-muted-foreground">XP</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Review Form */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Share your experience
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your review helps others trust the platform and improves our community.
                  </p>
                </CardHeader>
                <CardContent>
                  {reviewSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold">Thank you!</p>
                      <p className="text-sm text-muted-foreground">
                        Your feedback has been recorded.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setReviewSubmitted(false)}
                      >
                        Submit another review
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Your Rating</Label>
                        <div className="flex gap-1.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setRating(i)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  i <= rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {rating > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rating === 5 && "🌟 Excellent! You loved it."}
                            {rating === 4 && "👍 Good! You had a positive experience."}
                            {rating === 3 && "😐 Average. It was okay."}
                            {rating === 2 && "😕 Below expectations."}
                            {rating === 1 && "😞 Needs improvement."}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="feedback" className="text-sm font-medium">
                          Your Experience
                        </Label>
                        <Textarea
                          id="feedback"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Share your story... What worked well? What could be better?"
                          rows={4}
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {feedbackText.length}/1000 characters
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleSubmitReview}
                        disabled={!rating || feedbackText.trim().length < 5 || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-teal mx-auto mb-2" />
                <p className="text-2xl font-bold">250+</p>
                <p className="text-sm text-muted-foreground">Volunteers</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">1,200+</p>
                <p className="text-sm text-muted-foreground">Exams Completed</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">2025</p>
                <p className="text-sm text-muted-foreground">Founded</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default HallOfFame;