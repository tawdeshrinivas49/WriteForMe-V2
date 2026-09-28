import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useUser } from "@/store/useUser";
import { fetchStudentDashboard, fetchVolunteerDashboard } from "@/lib/api";
import { 
  CalendarDays, Clock, History, Star, Bell, FileCheck, 
  MapPin, Briefcase, Droplets, Award, CheckCircle, 
  TrendingUp, AlertCircle, Loader2, UserCheck, CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ---------- Helper Components ----------
const StatCard = ({ icon: Icon, label, value }: any) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const EventItem = ({ title, date, status, paymentStatus, role, requestId, onPay }: any) => {
  // Determine badge color based on payment status
  let paymentBadgeVariant: any = "secondary";
  let paymentLabel = paymentStatus || "UNPAID";
  let extraClass = "";
  if (paymentStatus === "PAID") paymentBadgeVariant = "default";
  else if (paymentStatus === "PENDING") {
    paymentBadgeVariant = "outline";
    extraClass = "text-amber-600 border-amber-500 bg-amber-50";
  }
  else if (paymentStatus === "REFUNDED") paymentBadgeVariant = "destructive";
  else if (paymentStatus === "FAILED") paymentBadgeVariant = "destructive";

  // Show "Pay Now" button only for students with PENDING_PAYMENT status
  const showPayButton = role === "STUDENT" && status === "PENDING_PAYMENT";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">{status}</Badge>
        {/* Show payment status only for STUDENT */}
        {role === "STUDENT" && (
          <Badge variant={paymentBadgeVariant} className={`text-xs ${extraClass}`}>
            {paymentLabel}
          </Badge>
        )}
        {showPayButton && (
          <Button 
            size="sm" 
            variant="default" 
            className="gap-1"
            onClick={() => onPay(requestId)}
          >
            <CreditCard className="w-4 h-4" /> Pay Now
          </Button>
        )}
      </div>
    </div>
  );
};

// ---------- Main Dashboard ----------
const Dashboard = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        setError(null);
        let result;
        if (role === 'STUDENT') {
          result = await fetchStudentDashboard();
        } else if (role === 'VOLUNTEER') {
          result = await fetchVolunteerDashboard();
        } else {
          toast.error('Unknown user role');
          return;
        }
        setData(result);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        const msg = err.response?.data?.error || err.message || 'Failed to load dashboard';
        setError(msg);
        if (!isBackground) toast.error(msg);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchData(false);
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [role, token, navigate]);

  // Check if volunteer has UPI (redirect to profile if missing)
  useEffect(() => {
    if (role === 'VOLUNTEER' && data && !data?.stats?.hasUpi) {
      toast.warning('Please set your UPI ID to receive payments.', {
        action: {
          label: 'Go to Profile',
          onClick: () => navigate('/profile'),
        },
        duration: 10000,
      });
    }
  }, [data, role, navigate]);

  const handlePayNow = (requestId: string) => {
    navigate(`/payment/${requestId}`);
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

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold">Error loading dashboard</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No dashboard data available.</p>
        </div>
      </Layout>
    );
  }

  // ---------- Student View ----------
  if (role === 'STUDENT') {
    const studentData = data;
    const profile = studentData?.profile || { name: 'Student', gender: '—' };
    const upcoming = studentData?.upcomingExams || [];
    const stats = studentData?.stats || { averageRating: 0, completedSessions: 0 };

    return (
      <Layout>
        <section className="py-8 md:py-12 container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <span className="section-label mb-2">Dashboard</span>
                <h1 className="text-3xl md:text-4xl font-display font-bold mt-2">
                  Welcome back, {profile.name}
                </h1>
                <p className="text-muted-foreground">Candidate • {profile.gender}</p>
              </div>
              <Button onClick={() => navigate('/request')}>Request a Scribe</Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={Clock} label="Upcoming Exams" value={upcoming.length} />
              <StatCard icon={Star} label="Trust Score" value={stats.averageRating.toFixed(1)} />
              <StatCard icon={History} label="Sessions Completed" value={stats.completedSessions || 0} />
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Upcoming Exams</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {upcoming.length > 0 ? (
                  upcoming.map((exam: any) => (
                    <EventItem
                      key={exam.id}
                      title={exam.examName}
                      date={new Date(exam.examDate).toLocaleDateString()}
                      status={exam.status}
                      paymentStatus={exam.paymentStatus}
                      role={role}
                      requestId={exam.id}
                      onPay={handlePayNow}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No upcoming exams.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </Layout>
    );
  }

  // ---------- Volunteer View ----------
  if (role === 'VOLUNTEER') {
    const volunteerData = data;
    const profile = volunteerData?.profile || { name: 'Volunteer', gender: '—' };
    const allAssignments = volunteerData?.upcomingAssignments || [];
    const activeAssignments = allAssignments.filter(
      (exam: any) => ['MATCHED', 'IN_PERSON_VERIFIED', 'IN_PROGRESS'].includes(exam.status)
    );
    const completedCount = volunteerData?.stats?.completedExams || 0;
    const xpPoints = volunteerData?.stats?.xpPoints || 0;

    return (
      <Layout>
        <section className="py-8 md:py-12 container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <span className="section-label mb-2">Dashboard</span>
                <h1 className="text-3xl md:text-4xl font-display font-bold mt-2">
                  Welcome back, {profile.name}
                </h1>
                <p className="text-muted-foreground">Volunteer • {profile.gender}</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                <UserCheck className="w-4 h-4 mr-2" /> Manage Availability
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={TrendingUp} label="Active Assignments" value={activeAssignments.length} />
              <StatCard icon={Award} label="XP Points" value={xpPoints} />
              <StatCard icon={CheckCircle} label="Completed" value={completedCount} />
            </div>

            {/* Gamification Quick Card */}
            <Card className="mb-6 bg-gradient-to-r from-teal/10 via-background to-amber-500/10 border-teal/30">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 text-amber-600 rounded-full">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Scribe Leaderboard & Achievements</h3>
                    <p className="text-sm text-muted-foreground">
                      You have earned <strong className="text-foreground">{xpPoints} XP</strong>. Climb the ranks on the Hall of Fame!
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/hall-of-fame')} className="whitespace-nowrap">
                  View Hall of Fame
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Your Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No assignments yet.</p>
                ) : (
                  allAssignments.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/match?requestId=${exam.id}`)}
                    >
                      <div>
                        <p className="font-semibold">{exam.examName}</p>
                        <p className="text-sm text-muted-foreground">{new Date(exam.examDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={exam.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {exam.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </Layout>
    );
  }

  return null;
};

export default Dashboard;