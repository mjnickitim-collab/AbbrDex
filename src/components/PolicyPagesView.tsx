import React, { useState, useEffect } from "react";
import { Info, ShieldCheck, Lock, FileText, ArrowLeft } from "lucide-react";
import AdPlaceholder from "./AdPlaceholder";
import { AdSlot } from "../types";

export type PolicyPageType = "about" | "editorial" | "privacy" | "terms";

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
    currentPage === "about" || currentPage === "editorial" || currentPage === "privacy" || currentPage === "terms"
      ? currentPage
      : "about"
  );

  useEffect(() => {
    if (currentPage === "about" || currentPage === "editorial" || currentPage === "privacy" || currentPage === "terms") {
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

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "about": return "About Us";
      case "editorial": return "Editorial Policy";
      case "privacy": return "Privacy Policy";
      case "terms": return "Terms of Service";
      default: return "Page";
    }
  };

  return (
    <article className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-soft font-medium">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate("home"); }}
            className="hover:text-indigo transition"
          >
            Home
          </a>
          <span>/</span>
          <span className="text-ink font-bold">{getBreadcrumbTitle()}</span>
        </nav>

        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-1.5 text-xs text-indigo font-bold hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Page Navigation Tabs */}
      <div className="bg-card border border-line rounded-2xl p-2 sm:p-3 shadow-sm flex items-center justify-start overflow-x-auto gap-2">
        <button
          onClick={() => handleTabChange("about")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "about"
              ? "bg-indigo text-white shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>About Us</span>
        </button>

        <button
          onClick={() => handleTabChange("editorial")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "editorial"
              ? "bg-indigo text-white shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Editorial Policy</span>
        </button>

        <button
          onClick={() => handleTabChange("privacy")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "privacy"
              ? "bg-indigo text-white shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => handleTabChange("terms")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "terms"
              ? "bg-indigo text-white shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>
      </div>

      {/* Main Page Card Content */}
      <div className="bg-card border border-line rounded-2xl p-6 sm:p-10 shadow-sm text-ink text-sm sm:text-base leading-relaxed space-y-6">
        
        {/* ABOUT US TAB */}
        {activeTab === "about" && (
          <section className="space-y-6">
            <div className="border-b border-line pb-4 space-y-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">About Us</h1>
              <p className="text-xs text-ink-soft">Independent Digital Reference Platform</p>
            </div>

            <p>
              <strong>Whatsthatmean.com</strong> is an independent digital reference platform dedicated to decoding acronyms, slang, abbreviations, emojis, and modern internet expressions. Our mission is to help readers around the world understand the fast-changing language used across texting, social media, gaming, business communication, military terminology, and online culture.
            </p>

            <p>
              Every entry on our site is written to give readers more than a bare-bones definition. We provide clear explanations, real-world usage examples, cultural context, and background information so visitors can confidently understand — and correctly use — these expressions in everyday communication.
            </p>

            <div className="bg-paper p-6 rounded-2xl border border-line space-y-4">
              <h2 className="font-display font-bold text-lg text-ink">What we aim to do:</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-ink-soft pl-1">
                <li>Deliver accurate, easy-to-understand explanations backed by research</li>
                <li>Provide context and usage examples, not just one-line definitions</li>
                <li>Continuously update our database as new slang, acronyms, and expressions emerge online</li>
                <li>Maintain a safe, reliable, and family-friendly resource for a global audience</li>
                <li>Cite and reference credible sources where relevant, and avoid speculation on sensitive topics</li>
              </ul>
            </div>

            <p className="text-ink-soft">
              <strong>Whatsthatmean.com</strong> is more than a dictionary — it's a living guide to modern digital language, maintained by an editorial team that reviews and updates content on an ongoing basis.
            </p>
          </section>
        )}

        {/* EDITORIAL POLICY TAB */}
        {activeTab === "editorial" && (
          <section className="space-y-6">
            <div className="border-b border-line pb-4 space-y-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">Editorial Policy</h1>
              <p className="text-xs text-ink-soft">Our Standards of Accuracy & Content Quality</p>
            </div>

            <p className="text-ink-soft">
              Our editorial standards ensure that all content published on Whatsthatmean.com is accurate, original, and genuinely useful to readers.
            </p>

            <div className="space-y-6 pt-2">
              <div>
                <h2 className="font-bold text-lg text-ink">1. Accuracy and Verification</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Every term is researched using credible sources, observed real-world usage, cultural references, and community discussion. Definitions and examples go through an internal review process before publication to check for clarity, correctness, and completeness.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">2. Original, Human-Written Content</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  All explanations, examples, and contextual notes on this site are written and edited by our own editorial team. We do not publish auto-generated bulk content or scrape definitions from other sites.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">3. Neutrality and Sensitivity</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We present information objectively. Terms with sensitive, political, or controversial origins are explained factually and in context, without promoting any particular ideological or political viewpoint. Where a term could be considered offensive in some contexts, we note that clearly for the reader's benefit.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">4. Continuous Updates</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Digital language evolves quickly. Existing entries are periodically reviewed and updated, and new terms are added regularly as they emerge in online communication.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">5. Corrections and User Feedback</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We welcome corrections and suggestions from readers. All user-submitted feedback is reviewed by an editor before any entry is added or changed — nothing is published automatically from user submissions.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">6. Advertising Disclosure</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Whatsthatmean.com displays advertising, including through Google AdSense, to support the cost of running and maintaining this free resource. Advertisements are clearly distinguishable from editorial content and do not influence the definitions or explanations we publish.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PRIVACY POLICY TAB */}
        {activeTab === "privacy" && (
          <section className="space-y-6">
            <div className="border-b border-line pb-4 space-y-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">Privacy Policy</h1>
              <p className="text-xs text-ink-soft">How We Collect, Use, and Protect Your Data</p>
            </div>

            <p>
              This Privacy Policy explains how Whatsthatmean.com ("we," "us," or "our") collects, uses, and protects information when you visit our website.
            </p>

            <div className="space-y-6 pt-2">
              <div>
                <h2 className="font-bold text-lg text-ink">1. Information We Collect</h2>
                <p className="text-sm text-ink-soft mt-1">We may collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-ink-soft mt-2 pl-2">
                  <li><strong>Technical data:</strong> browser type, device type, general geographic region (derived from IP address), and referral source</li>
                  <li><strong>Cookies and similar technologies:</strong> used for analytics and performance</li>
                  <li><strong>Voluntarily provided information:</strong> such as your name or email address, if you choose to reach out to us via email</li>
                </ul>
                <p className="text-sm text-ink-soft mt-2">
                  We do not require account registration to use this site, and we do not knowingly collect personally identifiable information unless you voluntarily provide it.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">2. How We Use Information</h2>
                <p className="text-sm text-ink-soft mt-1">Any information collected may be used to:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-ink-soft mt-2 pl-2">
                  <li>Improve website performance, content, and user experience</li>
                  <li>Understand traffic patterns and how visitors use the site</li>
                  <li>Respond to inquiries, feedback, or correction requests</li>
                  <li>Maintain site security and prevent misuse</li>
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">3. Cookies</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Cookies help us analyze traffic and improve site functionality. You can disable cookies at any time through your browser settings; note that some site features may not function correctly if cookies are disabled.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">4. Children's Privacy</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  This site is not directed at children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can remove it.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">5. Your Rights (GDPR / CCPA)</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Depending on your location, you may have the right to access, correct, or request deletion of personal data we hold about you, and to opt out of certain data processing.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">6. Data Protection</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We do not sell or trade your personal information to third parties. We take reasonable technical and organizational measures to protect data from unauthorized access, alteration, or disclosure.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">7. Changes to This Policy</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">8. Contact</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  For privacy-related questions, please contact us at contact@whatsthatmean.com.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TERMS OF SERVICE TAB */}
        {activeTab === "terms" && (
          <section className="space-y-6">
            <div className="border-b border-line pb-4 space-y-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">Terms of Service</h1>
              <p className="text-xs text-ink-soft">Conditions for Using Whatsthatmean.com</p>
            </div>

            <p>
              By accessing or using Whatsthatmean.com (the "Site"), you agree to the following terms. If you do not agree, please discontinue use of the Site.
            </p>

            <div className="space-y-6 pt-2">
              <div>
                <h2 className="font-bold text-lg text-ink">1. Purpose of the Service</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Whatsthatmean.com provides definitions, explanations, and contextual information about acronyms, slang, and digital expressions for general informational and educational purposes.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">2. No Guarantee of Completeness</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We strive for accuracy and regularly update our content, but we cannot guarantee that all information is complete, current, or error-free. Content is provided "as is" without warranties of any kind, express or implied.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">3. Acceptable Use</h2>
                <p className="text-sm text-ink-soft mt-1">When using this Site, you agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-ink-soft mt-2 pl-2">
                  <li>Use the Site for any unlawful purpose</li>
                  <li>Scrape, copy, or mass-extract content through automated means</li>
                  <li>Attempt to disrupt, overload, or interfere with the Site's normal operation</li>
                  <li>Reproduce, republish, or redistribute our content without prior written permission</li>
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">4. Intellectual Property</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  All text, definitions, examples, graphics, and design elements on this Site are the property of Whatsthatmean.com and are protected by copyright and other intellectual property laws. Unauthorized reproduction or distribution is prohibited.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">5. Third-Party Links and Advertising</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  The Site may display third-party advertisements or link to external websites. We are not responsible for the content, accuracy, or practices of third-party sites and do not endorse them.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">6. Limitation of Liability</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  To the fullest extent permitted by law, Whatsthatmean.com and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, this Site.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">7. Service Changes</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We reserve the right to modify, suspend, or discontinue any part of the Site at any time, without prior notice.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">8. Changes to These Terms</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  These Terms may be updated periodically. Continued use of the Site after changes are posted constitutes acceptance of the revised Terms.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">9. Governing Law</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  These Terms shall be governed by applicable laws in the jurisdiction in which the Site operator resides, without regard to conflict-of-law principles.
                </p>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Ad placement at the bottom of Policy pages */}
      <AdPlaceholder slotName="Header banner" adSlots={adSlots} isDbLoaded={isDbLoaded} />
    </article>
  );
}
