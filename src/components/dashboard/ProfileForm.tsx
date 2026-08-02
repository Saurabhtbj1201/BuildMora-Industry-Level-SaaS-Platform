"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Briefcase, MapPin, Globe, Code2,
  Loader2, Check, Plus, Trash2, GraduationCap, Award,
} from "lucide-react";

interface ExperienceItem {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

interface EducationItem {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

interface ProfileFormProps {
  initialProfile?: {
    fullName?: string;
    headline?: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    skills?: string[];
    experience?: ExperienceItem[];
    education?: EducationItem[];
  };
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState(initialProfile?.fullName ?? "");
  const [headline, setHeadline] = useState(initialProfile?.headline ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [location, setLocation] = useState(initialProfile?.location ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile?.websiteUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(initialProfile?.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile?.linkedinUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(initialProfile?.twitterUrl ?? "");
  const [avatarUrl] = useState(initialProfile?.avatarUrl ?? "");

  // Skills
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills ?? []);

  // Experience
  const [experience, setExperience] = useState<ExperienceItem[]>(
    initialProfile?.experience ?? []
  );

  // Education
  const [education, setEducation] = useState<EducationItem[]>(
    initialProfile?.education ?? []
  );

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addExperience = () => {
    setExperience([
      ...experience,
      { company: "", role: "", startDate: new Date().toISOString().slice(0, 7) },
    ]);
  };

  const updateExperience = (index: number, key: keyof ExperienceItem, value: any) => {
    const copy = [...experience];
    copy[index] = { ...copy[index], [key]: value };
    setExperience(copy);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducation([
      ...education,
      { institution: "", degree: "", startYear: new Date().getFullYear() },
    ]);
  };

  const updateEducation = (index: number, key: keyof EducationItem, value: any) => {
    const copy = [...education];
    copy[index] = { ...copy[index], [key]: value };
    setEducation(copy);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      fullName,
      headline,
      bio,
      avatarUrl,
      location,
      websiteUrl,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      skills,
      experience,
      education,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      setMessage("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Personal Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your public bio, skills, experience, and social links.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Profile
        </Button>
      </div>

      {message && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Basic Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-foreground border-b border-border pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Basic Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Saurabh Kumar"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, India"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
            Professional Headline
          </label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Full Stack Architect & Open Source Enthusiast"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
            About Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Brief introduction about your passion, background, and goals..."
            className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Skills Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Skills &amp; Technologies
        </h2>

        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="e.g. React, Next.js, Python, PostgreSQL"
          />
          <Button type="button" variant="secondary" onClick={addSkill}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:text-destructive transition-colors ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Social Links Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold font-display text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Social &amp; Web Links
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Personal Website
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              GitHub Profile
            </label>
            <div className="relative">
              <Code2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              LinkedIn Profile
            </label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Twitter / X Profile
            </label>
            <Input
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/username"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Work Experience */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Work Experience
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addExperience} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Role
          </Button>
        </div>

        {experience.map((exp, idx) => (
          <div key={idx} className="p-4 bg-muted/20 border border-border rounded-xl space-y-3 relative">
            <button
              type="button"
              onClick={() => removeExperience(idx)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid sm:grid-cols-2 gap-3 pr-8">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Company</label>
                <Input
                  value={exp.company || ""}
                  onChange={(e) => updateExperience(idx, "company", e.target.value)}
                  placeholder="e.g. Google"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Role Title</label>
                <Input
                  value={exp.role || ""}
                  onChange={(e) => updateExperience(idx, "role", e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Education
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addEducation} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Education
          </Button>
        </div>

        {education.map((edu, idx) => (
          <div key={idx} className="p-4 bg-muted/20 border border-border rounded-xl space-y-3 relative">
            <button
              type="button"
              onClick={() => removeEducation(idx)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid sm:grid-cols-2 gap-3 pr-8">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Institution</label>
                <Input
                  value={edu.institution || ""}
                  onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                  placeholder="e.g. IIT Bombay"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Degree / Field</label>
                <Input
                  value={edu.degree || ""}
                  onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
