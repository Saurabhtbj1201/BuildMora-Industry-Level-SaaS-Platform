import { getTenantFromRequest } from "@/lib/getTenantFromRequest";
import type { Metadata } from "next";
import { MapPin, Globe, Mail, Phone, GraduationCap, Award } from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/icons/social";
import ContactForm from "@/components/public/ContactForm";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  return { title: "About", description: `Learn more about ${tenant.siteName}` };
}

export default async function PublicAboutPage() {
  const tenant = await getTenantFromRequest();

  const profile = tenant.profile as {
    displayName?: string; bio?: string; avatar?: string; headline?: string;
    location?: string; website?: string; email?: string; phone?: string;
    github?: string; linkedin?: string; twitter?: string;
    skills?: string[];
    education?: { institution: string; degree: string; year: string; desc?: string }[];
    experience?: { company: string; role: string; duration: string; desc?: string }[];
    certifications?: { name: string; issuer: string; year: string; url?: string }[];
  } | null;

  const education = profile?.education ?? null;
  const experience = profile?.experience ?? null;
  const certifications = profile?.certifications ?? null;
  const skills = profile?.skills ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Bio */}
      <section className="flex flex-col sm:flex-row gap-8 items-start">
        {profile?.avatar ? (
          <img src={profile.avatar} alt={profile.displayName ?? tenant.siteName}
            className="w-32 h-32 rounded-2xl object-cover ring-4 ring-primary/20 shrink-0" />
        ) : (
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white ring-4 ring-primary/20 shrink-0">
            {(profile?.displayName ?? tenant.siteName)[0]}
          </div>
        )}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold font-display text-foreground">{profile?.displayName ?? tenant.siteName}</h1>
          {profile?.headline && <p className="text-lg text-primary font-medium">{profile.headline}</p>}
          {profile?.bio && <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1">
            {profile?.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>}
            {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors"><Globe className="w-3.5 h-3.5" />Website</a>}
            {profile?.email && <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-primary transition-colors"><Mail className="w-3.5 h-3.5" />{profile.email}</a>}
            {profile?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>}
            {profile?.github && <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors"><GithubIcon className="w-3.5 h-3.5" />GitHub</a>}
            {profile?.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors"><LinkedinIcon className="w-3.5 h-3.5" />LinkedIn</a>}
            {profile?.twitter && <a href={profile.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors"><TwitterIcon className="w-3.5 h-3.5" />Twitter</a>}
          </div>
        </div>
      </section>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-display text-foreground">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">{s}</span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold font-display text-foreground">Work Experience</h2>
          <div className="space-y-5">
            {experience.map((exp, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative mt-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                  {i < experience.length - 1 && <div className="absolute top-3.5 left-[4px] w-[1px] h-full bg-border" />}
                </div>
                <div className="pb-5 space-y-1">
                  <p className="font-semibold text-foreground font-display">{exp.role}</p>
                  <p className="text-sm text-primary">{exp.company} <span className="text-muted-foreground font-normal">· {exp.duration}</span></p>
                  {exp.desc && <p className="text-sm text-muted-foreground leading-relaxed">{exp.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Education
          </h2>
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-1">
                <p className="font-semibold text-foreground font-display">{edu.degree}</p>
                <p className="text-sm text-primary">{edu.institution} <span className="text-muted-foreground font-normal">· {edu.year}</span></p>
                {edu.desc && <p className="text-sm text-muted-foreground">{edu.desc}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Certifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certifications.map((cert, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-1">
                <p className="font-semibold text-foreground font-display">{cert.name}</p>
                <p className="text-sm text-muted-foreground">{cert.issuer} · {cert.year}</p>
                {cert.url && <a href={cert.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View credential →</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="space-y-6 border-t border-border pt-12">
        <h2 className="text-xl font-bold font-display text-foreground">Get in Touch</h2>
        <p className="text-muted-foreground text-sm">Have a project in mind or just want to say hello?</p>
        <ContactForm tenantId={tenant.id} />
      </section>
    </div>
  );
}
