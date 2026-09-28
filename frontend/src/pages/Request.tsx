import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/store/useUser";
import { toast } from "sonner";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { createRequest, uploadAdmitCard } from "@/lib/api";

const Request = () => {
  const navigate = useNavigate();
  const { user, isFullyVerified } = useUser();
  const isVolunteer = user?.role === "VOLUNTEER";

  const [examName, setExamName] = useState("");
  const [advtNumber, setAdvtNumber] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examCenterName, setExamCenterName] = useState("");
  const [examCenterLat, setExamCenterLat] = useState("");
  const [examCenterLng, setExamCenterLng] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [genderPref, setGenderPref] = useState("ANY");
  const [isEmergency, setIsEmergency] = useState(false);
  const [admitCardFile, setAdmitCardFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle OCR
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdmitCardFile(file);
    try {
      setOcrLoading(true);
      const result = await uploadAdmitCard(file);
      const data = result.data.extractedData;
      if (data.examName) setExamName(data.examName);
      if (data.advtNumber) setAdvtNumber(data.advtNumber);
      if (data.examDate) setExamDate(new Date(data.examDate).toISOString().split('T')[0]);
      if (data.examCenterName) setExamCenterName(data.examCenterName);
      if (data.durationMinutes) setDurationMinutes(data.durationMinutes);
      toast.success("Admit card parsed! Fields auto‑filled.");
    } catch (error) {
      toast.error("Failed to parse admit card. Please fill manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!examName || !examDate || !examCenterName) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (!agree) {
      toast.error("Please agree to the terms.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        examName,
        advtNumber: advtNumber || null,
        examDate: new Date(examDate).toISOString(),
        durationMinutes,
        genderPref,
        examCenterName,
        examCenterLat: parseFloat(examCenterLat) || 0,
        examCenterLng: parseFloat(examCenterLng) || 0,
        isEmergency,
      };
      const response = await createRequest(payload);
      const requestId = response.data.id;
      toast.success("Request created!");
      navigate(`/payment/${requestId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-24 container-narrow">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-10">
            <span className="section-label mb-4">{isVolunteer ? "Volunteer" : "Candidate"}</span>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-4">
              {isVolunteer ? "Offer to be a scribe" : "Request a scribe"}
            </h1>
            <p className="text-muted-foreground mt-3">
              Fill in your exam details. We’ll match you with a verified scribe nearby.
            </p>
          </div>

          {/* Optional verification banner (non‑blocking) */}
          {!isFullyVerified && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Verification pending</p>
                <p className="text-yellow-700">You can still submit a request, but you’ll be asked to complete your profile later.</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Exam details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Admit card upload */}
              <div>
                <Label htmlFor="admit">Upload Admit Card (optional – auto‑fill)</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="admit"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={ocrLoading}
                  />
                  {ocrLoading && <Loader2 className="h-5 w-5 animate-spin text-teal" />}
                </div>
                {admitCardFile && (
                  <p className="text-sm text-teal mt-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> {admitCardFile.name} uploaded
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examName">Exam name *</Label>
                  <Input
                    id="examName"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. SSC CGL Tier I"
                  />
                </div>
                <div>
                  <Label htmlFor="advtNumber">Advertisement number</Label>
                  <Input
                    id="advtNumber"
                    value={advtNumber}
                    onChange={(e) => setAdvtNumber(e.target.value)}
                    placeholder="e.g. ADVT-2026-001"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examDate">Exam date *</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 120)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="centerName">Exam center name *</Label>
                <Input
                  id="centerName"
                  value={examCenterName}
                  onChange={(e) => setExamCenterName(e.target.value)}
                  placeholder="e.g. Govt. Polytechnic, Mumbai"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude (optional)</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={examCenterLat}
                    onChange={(e) => setExamCenterLat(e.target.value)}
                    placeholder="e.g. 28.6139"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude (optional)</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={examCenterLng}
                    onChange={(e) => setExamCenterLng(e.target.value)}
                    placeholder="e.g. 77.2090"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="genderPref">Preferred scribe gender</Label>
                <select
                  id="genderPref"
                  value={genderPref}
                  onChange={(e) => setGenderPref(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="ANY">Any</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="emergency"
                  checked={isEmergency}
                  onCheckedChange={(checked) => setIsEmergency(!!checked)}
                />
                <Label htmlFor="emergency" className="font-normal text-sm">
                  Mark as emergency (fast‑track matching)
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="agree"
                  checked={agree}
                  onCheckedChange={(checked) => setAgree(!!checked)}
                />
                <Label htmlFor="agree" className="font-normal text-sm leading-snug">
                  I confirm these details match my admit card and I will follow the code of conduct.
                </Label>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={submitting || !agree || !examName || !examDate || !examCenterName}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  isVolunteer ? "Publish availability" : "Find me a match"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Request;