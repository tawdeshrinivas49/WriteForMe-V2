import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle, Upload, FileText, Loader2, Sparkles, ShieldCheck, ArrowRight
} from "lucide-react";
import { uploadAdmitCard } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const steps = [
  "Verify your Aadhaar via DigiLocker",
  "Upload your PwD certificate",
  "Complete the code-of-conduct tutorial",
  "Take the eligibility assessment (if applicable)",
  "Set your preferred language",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-filled fields from OCR
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examCenter, setExamCenter] = useState("");
  const [advtNumber, setAdvtNumber] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }
    setSelectedFile(file);
    setOcrDone(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadAdmitCard(selectedFile);
      const data = result?.data || result;

      // Auto-fill from OCR response
      if (data.examName) setExamName(data.examName);
      if (data.examDate) setExamDate(data.examDate);
      if (data.examCenter || data.examCenterName) setExamCenter(data.examCenter || data.examCenterName);
      if (data.advtNumber || data.advertisementNumber) setAdvtNumber(data.advtNumber || data.advertisementNumber);

      setOcrDone(true);
      toast.success("Admit card scanned! Fields auto-filled.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "OCR failed. Please fill the fields manually.");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    navigate(`/request?examName=${encodeURIComponent(examName)}&examDate=${encodeURIComponent(examDate)}&examCenter=${encodeURIComponent(examCenter)}&advtNumber=${encodeURIComponent(advtNumber)}`);
  };

  return (
    <Layout>
      <section className="py-24 md:py-32 container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-10">
            <span className="section-label mb-4">Verification</span>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-4">
              Complete Your Verification
            </h1>
          </div>

          {/* Steps checklist */}
          <div className="space-y-4 mb-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border"
              >
                <CheckCircle className="w-6 h-6 text-teal flex-shrink-0" />
                <span className="font-medium">{step}</span>
              </motion.div>
            ))}
          </div>

          {/* Admit Card Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Upload Admit Card (Optional)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload your admit card and we'll auto-fill exam details using OCR.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">
                  {selectedFile ? selectedFile.name : "Click to select admit card"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports images and PDF (max 10 MB)
                </p>
              </div>

              {selectedFile && !ocrDone && (
                <Button onClick={handleUpload} disabled={uploading} className="w-full">
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning admit card...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Scan with OCR</>
                  )}
                </Button>
              )}

              {ocrDone && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Auto-filled from admit card
                </Badge>
              )}

              {/* OCR result fields */}
              {(ocrDone || examName) && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label>Exam Name</Label>
                    <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g., UPSC CSE 2026" />
                  </div>
                  <div>
                    <Label>Exam Date</Label>
                    <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Exam Center</Label>
                    <Input value={examCenter} onChange={(e) => setExamCenter(e.target.value)} placeholder="e.g., DPS School, Sector 45" />
                  </div>
                  <div>
                    <Label>Advertisement Number</Label>
                    <Input value={advtNumber} onChange={(e) => setAdvtNumber(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button className="flex-1" size="lg" onClick={() => navigate("/dashboard")}>
              <ShieldCheck className="w-4 h-4 mr-2" /> Start Verification
            </Button>
            {ocrDone && examName && (
              <Button variant="outline" size="lg" onClick={handleContinue}>
                Continue to Request <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Onboarding;
