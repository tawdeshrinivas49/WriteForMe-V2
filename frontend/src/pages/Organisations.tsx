import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Users, Bus, HeartHandshake, FileSpreadsheet } from "lucide-react";

const features = [
  { icon: FileSpreadsheet, title: "Bulk Upload", desc: "Upload candidate or volunteer records via CSV/Excel." },
  { icon: Bus, title: "Transport Coordination", desc: "Arrange and track transport for exam days." },
  { icon: HeartHandshake, title: "Community Contributions", desc: "Report needs, donations, and local impact." },
];

const Organisations = () => {
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
            <span className="section-label mb-4">Partners</span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mt-4 mb-6">
              For Organisations
            </h1>
            <p className="text-lg text-muted-foreground">
              NGOs and institutions can upload data in bulk, coordinate transport, and manage community contributions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border rounded-2xl p-6 card-hover text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-xl gradient-teal flex items-center justify-center text-white mb-4">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" /> Bulk Upload</TabsTrigger>
              <TabsTrigger value="transport"><Bus className="w-4 h-4 mr-2" /> Transport</TabsTrigger>
              <TabsTrigger value="contributions"><HeartHandshake className="w-4 h-4 mr-2" /> Contributions</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Candidate / Volunteer Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="type">Data Type</Label>
                    <select id="type" className="w-full mt-2 h-10 rounded-md border px-3">
                      <option>Candidates</option>
                      <option>Volunteers</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Drag and drop your CSV or Excel file</p>
                    <Button variant="outline">Browse Files</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transport">
              <Card>
                <CardHeader>
                  <CardTitle>Coordinate Transport</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Schedule and track vehicles for exam-day transport. Coming soon with full logistics integration.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="contributions">
              <Card>
                <CardHeader>
                  <CardTitle>Community Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Log local donations, volunteer hours, and impact stories for your region.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Organisations;
