import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/store/useUser";
import { getEligibleRequestsForVolunteer, assignVolunteer, getRequests, findVolunteers } from "@/lib/api";
import { toast } from "sonner";
import { 
  Star, MapPin, Languages, GraduationCap, Shield, Smartphone, 
  Loader2, User, CalendarDays, Clock, CheckCircle 
} from "lucide-react";

// ---- Updated Interface with genderPref ----
interface Request {
  id: string;
  examName: string;
  examDate: string;
  examCenterName: string;
  status: string;
  distanceKm: number;
  candidateName: string;
  candidatePhone: string;
  genderPref?: string;  // ✅ Added to fix TS error
  // ... other fields
}

const Matching = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const role = user?.role;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        if (role === 'VOLUNTEER') {
          // Volunteer: fetch eligible requests using the matching service
          const result = await getEligibleRequestsForVolunteer(20); // radius 20km
          if (result.success) {
            setRequests(result.data);
          } else {
            toast.error(result.error || 'Failed to load requests');
          }
        } else if (role === 'STUDENT') {
          // Student: existing logic (find volunteers for their active request)
          const requestsRes = await getRequests();
          const allRequests = requestsRes.data || [];
          const active = allRequests.find(
            (r: any) => r.status === 'CREATED' || r.status === 'MATCHED'
          );
          if (!active) {
            toast.info('No active request. Please create one first.');
            navigate('/request');
            return;
          }
          setRequestId(active.id);
          if (active.status === 'MATCHED') {
            navigate(`/match?requestId=${active.id}`);
            return;
          }
          const result = await findVolunteers(active.id, 20);
          if (result.success) {
            setVolunteers(result.data);
          } else {
            toast.error(result.error || 'Failed to find volunteers');
          }
        } else {
          toast.error('Unknown user role');
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Matching error:', error);
        toast.error(error.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, token, navigate]);

const handleAccept = async (requestId: string) => {
  if (!user?.id) {
    toast.error('User not logged in.');
    return;
  }
  setAssigning(requestId);
  try {
    // Pass userId; backend will find the volunteer profile
    const result = await assignVolunteer(requestId, undefined, user.id);
    if (result.message) {
      toast.success('Request accepted successfully!');
      setRequests(prev => prev.filter(r => r.id !== requestId));
      navigate(`/match?requestId=${requestId}`);
    } else {
      toast.error(result.error || 'Failed to accept');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    if (errorMsg === 'UPI_MISSING') {
      toast.error('You must set up your UPI ID first before accepting requests.', { duration: 5000 });
      navigate('/profile');
    } else {
      toast.error(errorMsg || 'Error accepting request');
    }
  } finally {
    setAssigning(null);
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

  // ---- Volunteer View: Available Requests (eligible) ----
  if (role === 'VOLUNTEER') {
    return (
      <Layout>
        <section className="py-12 md:py-20 container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="section-label mb-4">Available Requests</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Requests Matching Your Profile
              </h1>
              <p className="text-muted-foreground">
                {requests.length > 0 
                  ? `${requests.length} request${requests.length > 1 ? 's' : ''} are eligible for you.`
                  : 'No eligible requests at the moment. Check back later or increase your search radius.'}
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No eligible requests available.</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {requests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="card-hover overflow-hidden border-2 border-transparent hover:border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl">{req.examName}</h3>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <p><CalendarDays className="inline w-4 h-4 mr-1" />
                                {new Date(req.examDate).toLocaleDateString()}
                              </p>
                              <p><MapPin className="inline w-4 h-4 mr-1" />
                                {req.examCenterName || 'Location not specified'}
                              </p>
                              <p><User className="inline w-4 h-4 mr-1" />
                                Candidate: {req.candidateName}
                              </p>
                              <p><Clock className="inline w-4 h-4 mr-1" />
                                {req.distanceKm.toFixed(1)} km away
                              </p>
                            </div>
                            <div className="mt-3">
                              <Badge variant="outline">{req.status}</Badge>
                              <Badge variant="secondary" className="ml-2">
                                Gender: {req.genderPref || 'ANY'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAccept(req.id)}
                            disabled={assigning === req.id}
                            className="ml-4 shrink-0"
                          >
                            {assigning === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Accept'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      </Layout>
    );
  }

  // ---- Student View: Show matching volunteers ----
  if (role === 'STUDENT') {
    return (
      <Layout>
        <section className="py-12 md:py-20 container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="section-label mb-4">Matching</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Find Your Match
              </h1>
              <p className="text-muted-foreground">
                {volunteers.length > 0 
                  ? `${volunteers.length} eligible volunteer${volunteers.length > 1 ? 's' : ''} found.`
                  : 'No volunteers found nearby. Try increasing the search radius or check back later.'}
              </p>
            </div>

            {volunteers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No volunteers available.</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {volunteers.map((v) => (
                  <motion.div
                    key={v.volunteerId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="card-hover overflow-hidden border-2 border-transparent hover:border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full gradient-teal flex items-center justify-center text-white text-2xl font-bold">
                            {v.volunteerName?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl">{v.volunteerName}</h3>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{v.averageRating?.toFixed(1) || '0.0'}</span>
                              <span className="text-muted-foreground text-xs ml-1">({v.gender})</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> {v.highestEducation || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {v.distanceKm?.toFixed(1) || '0'} km away · ~{v.etaMinutes || '?'} min
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> {v.hasVehicle ? `Has ${v.vehicleType}` : 'No vehicle'}
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            // Student: assign this volunteer to their request
                            if (requestId) {
                              assignVolunteer(requestId, v.volunteerId);
                              toast.success('Volunteer assigned!');
                              navigate(`/match?requestId=${requestId}`);
                            } else {
                              toast.error('No active request found.');
                            }
                          }}
                          disabled={!requestId}
                        >
                          Request Match
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      </Layout>
    );
  }

  return null;
};

export default Matching;