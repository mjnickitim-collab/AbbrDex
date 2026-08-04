import React, { useState, useEffect } from "react";
import { Info, ShieldCheck, Lock, FileText, ArrowLeft, Mail, CheckCircle2, Send } from "lucide-react";
import AdPlaceholder from "./AdPlaceholder";
import { AdSlot } from "../types";

export type PolicyPageType = "about" | "editorial" | "privacy" | "terms" | "contact";

interface PolicyPagesViewProps {
  currentPage: PolicyPageType;
  adSlots?: AdSlot[];
  isDbLoaded?: boolean;
  onNavigate: (view: string) => void;
}

export default function PolicyPagesView({
  currentPage,
  adSlots = [],
  isDbLoaded = true,
  onNavigate
}: PolicyPagesViewProps) {
  const [activeTab, setActiveTab] = useState<PolicyPageType>(
    ["about", "editorial", "privacy", "terms", "contact"].includes(currentPage)
      ? currentPage
      : "about"
  );

  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", termPage: "", message: "" });

  useEffect(() => {
    if (["about", "editorial", "privacy", "terms", "contact"].includes(currentPage)) {
      setActiveTab(currentPage);
    } else {
      setActiveTab("about");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleTabChange = (page: PolicyPageType) => {
    setActiveTab(page);
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: "", email: "", termPage: "", message: "" });
    }, 4000);
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "about": return "About Us";
      case "editorial": return "Editorial Policy";
      case "privacy": return "Privacy Policy";
      case "terms": return "Terms of Service";
      case "contact": return "Contact Us";
      default: return "Page";
    }
  };

  return (
    <article className="max-w-[1080px] mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-line/60">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-soft font-medium truncate">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate("home"); }}
            className="hover:text-indigo transition shrink-0"
          >
            Home
          </a>
          <span className="text-line">/</span>
          <span className="text-ink font-bold truncate">{getBreadcrumbTitle()}</span>
        </nav>

        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-paper border border-line text-xs text-indigo font-bold hover:bg-line/40 transition cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      {/* Page Navigation Tabs - Responsive Grid on Mobile, Row on Desktop */}
      <div className="bg-card border border-line rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          <button
            onClick={() => handleTabChange("about")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              activeTab === "about"
                ? "bg-indigo text-white shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">About Us</span>
          </button>

          <button
            onClick={() => handleTabChange("editorial")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              activeTab === "editorial"
                ? "bg-indigo text-white shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Editorial</span>
          </button>

          <button
            onClick={() => handleTabChange("privacy")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              activeTab === "privacy"
                ? "bg-indigo text-white shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Privacy</span>
          </button>

          <button
            onClick={() => handleTabChange("terms")}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              activeTab === "terms"
                ? "bg-indigo text-white shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Terms</span>
          </button>

          <button
            onClick={() => handleTabChange("contact")}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              activeTab === "contact"
                ? "bg-indigo text-white shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Contact Us</span>
          </button>
        </div>
      </div>

      {/* Main Page Card Content */}
      <div className="bg-card border border-line rounded-xl sm:rounded-2xl p-4 sm:p-8 md:p-10 shadow-xs text-ink text-xs sm:text-sm md:text-base leading-relaxed space-y-5 sm:space-y-6">
        
        {/* ABOUT US TAB */}
        {activeTab === "about" && (
          <section className="space-y-4 sm:space-y-6">
            <div className="border-b border-line pb-3 sm:pb-4 space-y-1">
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">About Us</h1>
              <p className="text-xs text-ink-soft font-medium">Independent Digital Reference Platform</p>
            </div>

            <p className="text-ink leading-relaxed">
              <strong>Whatsthatmean.com</strong> is an independent digital reference platform dedicated to decoding acronyms, slang, abbreviations, emojis, and modern internet expressions. Our mission is to help readers around the world understand the fast-changing language used across texting, social media, gaming, business communication, military terminology, and online culture.
            </p>

            <p className="text-ink leading-relaxed">
              Every entry on our site is written to give readers more than a bare-bones definition. We provide clear explanations, real-world usage examples, cultural context, and background information so visitors can confidently understand — and correctly use — these expressions in everyday communication.
            </p>

            <div className="bg-paper p-4 sm:p-6 rounded-xl border border-line space-y-3">
              <h2 className="font-display font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">What we aim to do:</h2>
              <ul className="space-y-2 text-xs sm:text-sm text-ink-soft pt-1">
                {[
                  "Deliver accurate, easy-to-understand explanations backed by lexicographical research",
                  "Provide context and real-world usage examples, not just one-line definitions",
                  "Continuously update our database as new slang, acronyms, and expressions emerge online",
                  "Maintain a safe, reliable, and family-friendly resource for a global audience",
                  "Cite and reference credible sources where relevant, avoiding speculation on sensitive topics"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo mt-1.5 shrink-0" />
                    <span className="leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-ink-soft text-xs sm:text-sm leading-relaxed">
              <strong>Whatsthatmean.com</strong> is more than a dictionary — it's a living guide to modern digital language, maintained by an editorial team that reviews and updates content on an ongoing basis.
            </p>
          </section>
        )}

        {/* EDITORIAL POLICY TAB */}
        {activeTab === "editorial" && (
          <section className="space-y-4 sm:space-y-6">
            <div className="border-b border-line pb-3 sm:pb-4 space-y-1">
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">Editorial Policy</h1>
              <p className="text-xs text-ink-soft font-medium">Our Standards of Accuracy & Content Quality</p>
            </div>

            <p className="text-ink-soft text-xs sm:text-sm leading-relaxed">
              Our editorial standards ensure that all content published on Whatsthatmean.com is accurate, original, and genuinely useful to readers.
            </p>

            <div className="space-y-4 sm:space-y-5 pt-1">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">1. Accuracy and Verification</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Every term is researched using credible sources, observed real-world usage, cultural references, and community discussion. Definitions and examples go through an internal review process before publication to check for clarity, correctness, and completeness.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">2. Original, Human-Written Content</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  All explanations, examples, and contextual notes on this site are written and edited by our own editorial team. We do not publish auto-generated bulk content or scrape definitions from other sites.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">3. Neutrality and Sensitivity</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We present information objectively. Terms with sensitive, political, or controversial origins are explained factually and in context, without promoting any particular ideological or political viewpoint. Where a term could be considered offensive in some contexts, we note that clearly for the reader's benefit.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">4. Continuous Updates</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Digital language evolves quickly. Existing entries are periodically reviewed and updated, and new terms are added regularly as they emerge in online communication.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">5. Corrections and User Feedback</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We welcome corrections and suggestions from readers. All user-submitted feedback is reviewed by an editor before any entry is added or changed — nothing is published automatically from user submissions.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">6. Advertising Disclosure</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Whatsthatmean.com displays advertising, including through Google AdSense, to support the cost of running and maintaining this free resource. Advertisements are clearly distinguishable from editorial content and do not influence the definitions or explanations we publish.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PRIVACY POLICY TAB */}
        {activeTab === "privacy" && (
          <section className="space-y-4 sm:space-y-6">
            <div className="border-b border-line pb-3 sm:pb-4 space-y-1">
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-ink-soft font-medium">How We Collect, Use, and Protect Your Data</p>
            </div>

            <p className="text-ink leading-relaxed">
              This Privacy Policy explains how Whatsthatmean.com ("we," "us," or "our") collects, uses, and protects information when you visit our website.
            </p>

            <div className="space-y-4 sm:space-y-5 pt-1">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">1. Information We Collect</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5">We may collect the following types of information:</p>
                <ul className="space-y-2 text-xs sm:text-sm text-ink-soft mt-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo mt-1.5 shrink-0" />
                    <span><strong>Technical data:</strong> browser type, device type, general geographic region (derived from IP address), and referral source</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo mt-1.5 shrink-0" />
                    <span><strong>Cookies and similar technologies:</strong> used for analytics and performance optimization</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo mt-1.5 shrink-0" />
                    <span><strong>Voluntarily provided information:</strong> such as your name or email address, if you choose to reach out to us</span>
                  </li>
                </ul>
                <p className="text-xs sm:text-sm text-ink-soft mt-2.5 leading-relaxed">
                  We do not require account registration to use this site, and we do not knowingly collect personally identifiable information unless you voluntarily provide it.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">2. How We Use Information</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5">Any information collected may be used to:</p>
                <ul className="space-y-2 text-xs sm:text-sm text-ink-soft mt-2.5">
                  {[
                    "Improve website performance, content accuracy, and user experience",
                    "Understand traffic patterns and how visitors use the site",
                    "Respond to inquiries, feedback, or correction requests",
                    "Maintain site security and prevent misuse"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">3. Cookies</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Cookies help us analyze traffic and improve site functionality. You can disable cookies at any time through your browser settings; note that some site features may not function correctly if cookies are disabled.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">4. Children's Privacy</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  This site is not directed at children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can remove it.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">5. Your Rights (GDPR / CCPA)</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Depending on your location, you may have the right to access, correct, or request deletion of personal data we hold about you, and to opt out of certain data processing.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">6. Data Protection</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We do not sell or trade your personal information to third parties. We take reasonable technical and organizational measures to protect data from unauthorized access, alteration, or disclosure.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">7. Changes to This Policy</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">8. Contact</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  For privacy-related questions, please contact us at <a href="mailto:contact@whatsthatmean.com" className="text-indigo font-bold hover:underline">contact@whatsthatmean.com</a> or use the Contact Us tab.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TERMS OF SERVICE TAB */}
        {activeTab === "terms" && (
          <section className="space-y-4 sm:space-y-6">
            <div className="border-b border-line pb-3 sm:pb-4 space-y-1">
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">Terms of Service</h1>
              <p className="text-xs text-ink-soft font-medium">Conditions for Using Whatsthatmean.com</p>
            </div>

            <p className="text-ink leading-relaxed">
              By accessing or using Whatsthatmean.com (the "Site"), you agree to the following terms. If you do not agree, please discontinue use of the Site.
            </p>

            <div className="space-y-4 sm:space-y-5 pt-1">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">1. Purpose of the Service</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Whatsthatmean.com provides definitions, explanations, and contextual information about acronyms, slang, and digital expressions for general informational and educational purposes.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">2. No Guarantee of Completeness</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We strive for accuracy and regularly update our content, but we cannot guarantee that all information is complete, current, or error-free. Content is provided "as is" without warranties of any kind, express or implied.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">3. Acceptable Use</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5">When using this Site, you agree not to:</p>
                <ul className="space-y-2 text-xs sm:text-sm text-ink-soft mt-2.5">
                  {[
                    "Use the Site for any unlawful purpose",
                    "Scrape, copy, or mass-extract content through automated means",
                    "Attempt to disrupt, overload, or interfere with the Site's normal operation",
                    "Reproduce, republish, or redistribute our content without prior written permission"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">4. Intellectual Property</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  All text, definitions, examples, graphics, and design elements on this Site are the property of Whatsthatmean.com and are protected by copyright and other intellectual property laws.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">5. Third-Party Links and Advertising</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  The Site may display third-party advertisements or link to external websites. We are not responsible for the content, accuracy, or practices of third-party sites and do not endorse them.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">6. Limitation of Liability</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  To the fullest extent permitted by law, Whatsthatmean.com and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, this Site.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">7. Service Changes</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We reserve the right to modify, suspend, or discontinue any part of the Site at any time, without prior notice.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-sm sm:text-base text-ink border-l-3 border-indigo pl-2.5">8. Changes to These Terms</h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
                  These Terms may be updated periodically. Continued use of the Site after changes are posted constitutes acceptance of the revised Terms.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT US TAB */}
        {activeTab === "contact" && (
          <section className="space-y-4 sm:space-y-6">
            <div className="border-b border-line pb-3 sm:pb-4 space-y-1">
              <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">Contact Us</h1>
              <p className="text-xs text-ink-soft font-medium">Get in Touch with Our Editorial Team</p>
            </div>

            <p className="text-ink leading-relaxed">
              We'd love to hear from you! If you have questions, feedback, corrections, or collaboration inquiries regarding any term or definition on Whatsthatmean.com, please reach out.
            </p>

            <div className="bg-paper border border-line rounded-xl p-3.5 sm:p-5 flex items-center gap-3">
              <div className="p-2.5 bg-indigo/10 text-indigo rounded-xl shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-xs font-bold text-ink-soft uppercase tracking-wider">Email Us Directly</div>
                <a href="mailto:contact@whatsthatmean.com" className="text-xs sm:text-sm font-bold text-indigo hover:underline block truncate">
                  contact@whatsthatmean.com
                </a>
              </div>
            </div>

            {contactSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-5 sm:p-6 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-emerald-800 font-bold text-base sm:text-lg">Message Received!</div>
                <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                  Thank you for contacting Whatsthatmean.com. We aim to respond to all inquiries as promptly as possible, typically within 1-2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3.5 sm:space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Your Name (optional)</label>
                    <input 
                      type="text" 
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Your Email</label>
                    <input 
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Specific Term or Page (optional)</label>
                  <input 
                    type="text" 
                    value={contactForm.termPage}
                    onChange={(e) => setContactForm({ ...contactForm, termPage: e.target.value })}
                    placeholder="e.g. FYI, ASAP, or /term/FYI"
                    className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Description of Question / Feedback</label>
                  <textarea 
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Enter your inquiry, term correction, or feedback here..."
                    className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-indigo resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-ink-soft">Response time: typically 1-2 business days</span>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo text-white font-bold rounded-lg hover:bg-indigo-dark transition text-xs cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

      </div>

      {/* Ad placement at the bottom of Policy pages */}
      <AdPlaceholder slotName="Header banner" adSlots={adSlots} isDbLoaded={isDbLoaded} />
    </article>
  );
}

