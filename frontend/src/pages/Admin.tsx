import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, MessageSquare, FileText, Download, CheckCircle, XCircle, Star } from "lucide-react";

const users = [
  { name: "Riya Sharma", role: "Candidate", status: "Verified", joined: "2026-01-15" },
  { name: "Amit Patel", role: "Volunteer", status: "Verified", joined: "2025-11-03" },
  { name: "Sneha Foundation", role: "NGO", status: "Pending", joined: "2026-03-22" },
  { name: "Karan Mehta", role: "Volunteer", status: "Verified", joined: "2025-09-18" },
  { name: "Priya Nair", role: "Candidate", status: "Pending", joined: "2026-04-10" },
];

const verifications = [
  { name: "Priya Nair", type: "PwD Certificate", submitted: "2026-04-10", status: "Pending" },
  { name: "Sneha Foundation", type: "NGO Registration", submitted: "2026-03-22", status: "Pending" },
  { name: "Vikram K.", type: "Aadhaar", submitted: "2026-02-05", status: "Approved" },
];

const reviews = [
  { user: "Vikram K.", rating: 5, text: "Seamless experience from signup to exam day.", status: "Published" },
  { user: "Neha R.", rating: 5, text: "The scribe was punctual, patient, and professional.", status: "Published" },
  { user: "Rahul M.", rating: 4, text: "Great initiative. Accessibility options are excellent.", status: "Pending" },
];

const donations = [
  { donor: "Anonymous", amount: "₹5,000", date: "2026-04-28", cause: "General Fund" },
  { donor: "Rohit S.", amount: "₹12,000", date: "2026-04-25", cause: "Transport Support" },
  { donor: "Meera T.", amount: "₹2,500", date: "2026-04-20", cause: "General Fund" },
];

const Admin = () => {
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
              <span className="section-label mb-2">Administration</span>
              <h1 className="text-3xl md:text-4xl font-display font-bold mt-2">
                Admin Panel
              </h1>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Generate Audit Report
            </Button>
          </div>

          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="verification"><FileCheck className="w-4 h-4 mr-2" /> Verification</TabsTrigger>
              <TabsTrigger value="reviews"><MessageSquare className="w-4 h-4 mr-2" /> Reviews</TabsTrigger>
              <TabsTrigger value="contributions"><FileText className="w-4 h-4 mr-2" /> Contributions</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Role</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="p-3">{u.name}</td>
                            <td className="p-3">{u.role}</td>
                            <td className="p-3">
                              <Badge variant={u.status === "Verified" ? "default" : "secondary"}>{u.status}</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{u.joined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Document</th>
                          <th className="text-left p-3 font-medium">Submitted</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifications.map((v, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="p-3">{v.name}</td>
                            <td className="p-3">{v.type}</td>
                            <td className="p-3 text-muted-foreground">{v.submitted}</td>
                            <td className="p-3">
                              <Badge variant={v.status === "Approved" ? "default" : "secondary"}>{v.status}</Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-teal hover:text-teal">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-coral hover:text-coral">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>User Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Rating</th>
                          <th className="text-left p-3 font-medium">Review</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((r, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="p-3">{r.user}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-3 h-3 fill-current" /> {r.rating}
                              </div>
                            </td>
                            <td className="p-3 max-w-xs truncate">{r.text}</td>
                            <td className="p-3">
                              <Badge variant={r.status === "Published" ? "default" : "secondary"}>{r.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contributions">
              <Card>
                <CardHeader>
                  <CardTitle>Donations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Donor</th>
                          <th className="text-left p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Cause</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((d, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="p-3">{d.donor}</td>
                            <td className="p-3 font-semibold">{d.amount}</td>
                            <td className="p-3 text-muted-foreground">{d.date}</td>
                            <td className="p-3">{d.cause}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Admin;
