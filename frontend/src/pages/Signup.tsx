import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/store/useUser";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

type Role = "STUDENT" | "VOLUNTEER" | "CONTRIBUTOR";

const disabilityTypes = [
  "Visual Impairment",
  "Hearing Impairment",
  "Locomotor Disability",
  "Intellectual Disability",
  "Multiple Disabilities",
  "Other",
];

const languages = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu",
  "Marathi", "Gujarati", "Malayalam", "Kannada", "Punjabi",
];

const educationLevels = [
  "10th Pass", "12th Pass", "Graduate", "Post Graduate", "Doctorate",
];

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useUser();

  // Step tracking
  const [step, setStep] = useState(1); // 1 = details, 2 = verifying (waiting)

  // Form fields
  const [role, setRole] = useState<Role>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [disabilityType, setDisabilityType] = useState("");
  const [education, setEducation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      toast.error("Please fill all required fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!agree) {
      toast.error("You must agree to the terms");
      return;
    }
    // For students and volunteers, additional fields might be required, but we'll let them be optional for now.

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role,
        gender,
        address,
        disabilityType,
        education,
        preferredLanguage,
        // Note: DigiLocker verification will be triggered separately.
      };
      // Call signup – if DigiLocker required, it will redirect
      await signup(payload);
      // If we reach here, it means no redirect (contributor or already verified)
      // The signup function will handle the redirect or auto-login.
      // But we need to handle the wait state.
      setStep(2); // Show "verifying" state
    } catch (error) {
      // error already handled in store
    } finally {
      setLoading(false);
    }
  };

  // For DigiLocker callback, we already have the logic in AuthCallback.

  return (
    <Layout>
      <section className="py-24 md:py-32 container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto bg-card p-8 md:p-10 rounded-2xl shadow-sm border"
        >
          <div className="text-center mb-8">
            <span className="section-label mb-4">Get Started</span>
            <h1 className="text-3xl font-display font-bold mt-4">Create Account</h1>
            <p className="text-muted-foreground mt-2">
              {step === 1 ? "Fill in your details to get started." : "Verifying your identity..."}
            </p>
          </div>

          {step === 1 ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Role */}
              <div>
                <Label htmlFor="role">I am a</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Candidate (Student)</SelectItem>
                    <SelectItem value="VOLUNTEER">Volunteer / Scribe</SelectItem>
                    <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name & Email */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirm Password *</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Phone & Gender */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city, state, pincode"
                  rows={2}
                />
              </div>

              {/* Conditional fields based on role */}
              {role === "STUDENT" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disability">Type of Disability</Label>
                    <Select value={disabilityType} onValueChange={setDisabilityType}>
                      <SelectTrigger id="disability">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {disabilityTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edu-student">Education</Label>
                    <Select value={education} onValueChange={setEducation}>
                      <SelectTrigger id="edu-student">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationLevels.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {role === "VOLUNTEER" && (
                <div>
                  <Label htmlFor="edu-volunteer">Highest Education</Label>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger id="edu-volunteer">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Language (for all) */}
              <div>
                <Label htmlFor="lang">Preferred Language</Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger id="lang">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={agree} onCheckedChange={(c) => setAgree(!!c)} />
                <Label htmlFor="terms" className="font-normal text-sm leading-snug">
                  I agree to the code of conduct and understand that my information will be verified.
                </Label>
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue
              </Button>
            </form>
          ) : (
            // Step 2: Waiting for verification (DigiLocker)
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-teal mx-auto" />
              <p className="mt-4 text-muted-foreground">
                Redirecting to DigiLocker for verification...
              </p>
              <p className="text-sm text-muted-foreground">
                If you are not redirected, <Button variant="link" onClick={() => window.location.reload()}>click here</Button>.
              </p>
            </div>
          )}

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Signup;