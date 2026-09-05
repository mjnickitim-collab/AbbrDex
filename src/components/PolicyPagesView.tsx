import React, { useState, useEffect } from "react";
import { Info, ShieldCheck, Lock, FileText, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
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

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "Editorial Feedback & Term Suggestion",
    message: ""
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

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
    window.history.pushState(null, "", `/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
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

        <button
          onClick={() => handleTabChange("contact")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "contact"
              ? "bg-indigo text-white shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-paper"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Contact Us</span>
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
              <p className="text-xs text-ink-soft">Last Updated: September 2026 • Legal & Advertising Disclosure</p>
            </div>

            <p className="text-ink leading-relaxed">
              This Privacy Policy explains how <strong>Whatsthatmean.com</strong> ("we," "us," or "our") collects, uses, stores, and protects your information when you visit our website. By using our site, you consent to the practices described in this policy.
            </p>

            <div className="space-y-6 pt-2">
              <div>
                <h2 className="font-bold text-lg text-ink">1. Information We Collect & Log Files</h2>
                <p className="text-sm text-ink-soft mt-1 leading-relaxed">
                  Like most modern websites, Whatsthatmean.com follows standard procedures using log files. The information collected automatically includes:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-ink-soft mt-2 pl-2">
                  <li>Internet Protocol (IP) addresses and general geographic region</li>
                  <li>Browser type, operating system, and device screen specifications</li>
                  <li>Internet Service Provider (ISP), date and time stamps, and referring/exit pages</li>
                  <li>Number of clicks and page views to analyze trends and administer the site</li>
                </ul>
                <p className="text-sm text-ink-soft mt-2">
                  None of this technical data is linked to personally identifiable information. We do not require account registration or collect personal contact details unless you voluntarily send us an inquiry via our contact form or email.
                </p>
              </div>

              {/* Google AdSense & Third-Party Advertising Disclosures - Essential for AdSense Approval */}
              <div className="bg-paper p-5 rounded-2xl border border-line space-y-3">
                <h2 className="font-bold text-lg text-ink flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo" />
                  <span>2. Google AdSense, DoubleClick Cookies & Third-Party Advertising</span>
                </h2>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Whatsthatmean.com is monetized through third-party advertising partners, primarily <strong>Google AdSense</strong>, to help finance free open access to our linguistic research and acronym database.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-ink-soft pl-2">
                  <li>
                    <strong>Third-party vendors, including Google, use cookies</strong> to serve ads based on a user's prior visits to your website or other websites on the Internet.
                  </li>
                  <li>
                    <strong>Google's use of advertising cookies (including the DoubleClick DART cookie)</strong> enables it and its partners to serve ads to our users based on their visits to our site and/or other sites across the World Wide Web.
                  </li>
                  <li>
                    These third-party ad servers or ad networks use technology in their respective advertisements and links that appear on Whatsthatmean.com, which are sent directly to users' browsers. They automatically receive your IP address when this occurs. Other technologies (such as cookies, JavaScript, or Web Beacons) may also be used by third-party ad networks to measure advertising effectiveness and personalize ad content.
                  </li>
                  <li>
                    <strong>Whatsthatmean.com has no access to or control over these cookies</strong> that are used by third-party advertisers.
                  </li>
                </ul>

                <div className="pt-2 border-t border-line/60">
                  <h3 className="font-bold text-sm text-ink mb-1.5">How You Can Opt Out of Personalized Advertising:</h3>
                  <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                    Users may opt out of personalized advertising by visiting:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo hover:underline bg-indigo/10 px-3 py-1.5 rounded-lg"
                    >
                      Google Ads Settings (adssettings.google.com) ↗
                    </a>
                    <a
                      href="https://www.aboutads.info/choices"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo hover:underline bg-indigo/10 px-3 py-1.5 rounded-lg"
                    >
                      AboutAds.info Choices Portal ↗
                    </a>
                    <a
                      href="https://optout.networkadvertising.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo hover:underline bg-indigo/10 px-3 py-1.5 rounded-lg"
                    >
                      Network Advertising Initiative Opt-Out ↗
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">3. Cookie Management in Your Browser</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  You can choose to disable or selectively turn off cookies in your browser settings. However, this may affect how you interact with our site and other websites. For detailed instructions on managing cookies in popular browsers, visit the official support pages of Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">4. California Consumer Privacy Act (CCPA) Privacy Rights</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Under the CCPA, California consumers have specific rights, including the right to request disclosure of personal data collected, the right to request deletion of personal information, and the right to opt-out of the sale of personal data. <strong>We do not sell, rent, or trade your personal information</strong> to third parties. If you wish to exercise any of these CCPA rights, please contact us at <code>privacy@whatsthatmean.com</code>.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">5. GDPR & European Data Protection Rights</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Every user residing in the European Economic Area (EEA) and United Kingdom is entitled to the following rights:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-ink-soft mt-2 pl-2">
                  <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                  <li><strong>The right to rectification:</strong> You have the right to request corrections of any information you believe is inaccurate.</li>
                  <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data under certain conditions.</li>
                  <li><strong>The right to restrict or object to processing:</strong> You have the right to object to our processing of your personal data.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">6. Children's Online Privacy Protection Act (COPPA)</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  Protecting children's privacy online is paramount. Whatsthatmean.com is not directed at children under 13 years of age, and we do not knowingly collect personal identifiable information from children under 13. If you believe your child provided this kind of information on our website, please contact us immediately and we will promptly remove such information from our records.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">7. Updates to This Privacy Policy</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  We may update our Privacy Policy periodically to reflect changes in legal requirements, browser standards, or advertising guidelines. We advise you to review this page periodically for any changes. Changes are effective immediately upon posting on this page.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-lg text-ink">8. Contact Information</h2>
                <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                  If you have any questions, suggestions, or concerns regarding our Privacy Policy or data protection practices, please contact our Data Protection Officer at:
                </p>
                <div className="mt-2 text-sm font-semibold text-indigo">
                  Email: <a href="mailto:contact@whatsthatmean.com" className="underline">contact@whatsthatmean.com</a>
                </div>
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

        {/* CONTACT US TAB */}
        {activeTab === "contact" && (
          <section className="space-y-6">
            <div className="border-b border-line pb-4 space-y-1">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">Contact Us</h1>
              <p className="text-xs text-ink-soft">Editorial Office, Term Corrections & Publisher Inquiries</p>
            </div>

            <p className="text-ink leading-relaxed">
              We welcome questions, suggestions, corrections, and general feedback from our readers and partners. Whatsthatmean.com is managed by a dedicated editorial team passionate about linguistic clarity and internet culture.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Official Contact Details Box */}
              <div className="space-y-4">
                <div className="bg-paper p-5 rounded-2xl border border-line space-y-4">
                  <h2 className="font-bold text-lg text-ink flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo" />
                    <span>Direct Communication</span>
                  </h2>
                  <div className="space-y-2 text-sm text-ink-soft">
                    <p>
                      <strong>General & Editorial Desk:</strong><br />
                      <a href="mailto:contact@whatsthatmean.com" className="text-indigo font-semibold underline">contact@whatsthatmean.com</a>
                    </p>
                    <p>
                      <strong>Privacy & Legal Compliance:</strong><br />
                      <a href="mailto:privacy@whatsthatmean.com" className="text-indigo font-semibold underline">privacy@whatsthatmean.com</a>
                    </p>
                    <p>
                      <strong>Advertising & Partnerships:</strong><br />
                      <a href="mailto:ads@whatsthatmean.com" className="text-indigo font-semibold underline">ads@whatsthatmean.com</a>
                    </p>
                  </div>
                </div>

                <div className="bg-paper p-5 rounded-2xl border border-line space-y-3">
                  <h3 className="font-bold text-base text-ink flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo" />
                    <span>Editorial Standards & Response SLA</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-ink-soft">
                    <li><strong>Guaranteed Response:</strong> Our editorial desk reviews all inquiries within 24 to 48 business hours.</li>
                    <li><strong>Factual Corrections:</strong> If you spot an error or outdated definition in our 4,400+ entries, please specify the exact term and reference sources.</li>
                    <li><strong>Term Submissions:</strong> New slang suggestions are vetted by human lexicographers prior to indexing.</li>
                    <li><strong>DMCA & Copyright:</strong> We promptly address legitimate copyright notices provided in accordance with 17 U.S.C. § 512(c).</li>
                  </ul>
                </div>
              </div>

              {/* Interactive Contact Form */}
              <div className="bg-card border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                {contactSubmitted ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="font-display font-bold text-xl text-ink">Thank You for Reaching Out!</h3>
                    <p className="text-xs sm:text-sm text-ink-soft max-w-sm mx-auto">
                      Your inquiry has been received by the Whatsthatmean editorial desk. We will review your message and reply to <strong>{contactForm.email}</strong> within 24-48 hours.
                    </p>
                    <button
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactForm({ name: "", email: "", subject: "Editorial Feedback & Term Suggestion", message: "" });
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo/10 text-indigo text-xs font-bold hover:bg-indigo/20 transition cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <h2 className="font-bold text-base text-ink">Send an Editorial Message</h2>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper text-sm text-ink focus:border-indigo focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="yourname@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper text-sm text-ink focus:border-indigo focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">Inquiry Category</label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper text-sm text-ink focus:border-indigo focus:outline-none"
                      >
                        <option value="Editorial Feedback & Term Suggestion">Editorial Feedback & Term Suggestion</option>
                        <option value="Definition Correction / Error Report">Definition Correction / Error Report</option>
                        <option value="Privacy / GDPR / CCPA Request">Privacy / GDPR / CCPA Request</option>
                        <option value="Advertising & Sponsorship Query">Advertising & Sponsorship Query</option>
                        <option value="DMCA & Copyright Notice">DMCA & Copyright Notice</option>
                        <option value="General Question">General Question</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">Your Message</label>
                      <textarea
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Provide details about the term, definition, or inquiry..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-paper text-sm text-ink focus:border-indigo focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-bold text-sm shadow-sm transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry to Editorial Team</span>
                    </button>
                  </form>
                )}
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
