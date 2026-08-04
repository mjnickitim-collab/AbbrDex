import React, { useState } from "react";
import { X, ShieldCheck, FileText, Lock, Mail, Info } from "lucide-react";

export type FooterPageType = "about" | "editorial" | "privacy" | "terms" | "contact" | null;

interface FooterPagesModalProps {
  activePage: FooterPageType;
  onClose: () => void;
}

export default function FooterPagesModal({ activePage, onClose }: FooterPagesModalProps) {
  const [activeTab, setActiveTab] = useState<FooterPageType>(activePage || "about");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", termPage: "", message: "" });

  if (!activePage) return null;

  const currentTab = activeTab || activePage;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: "", email: "", termPage: "", message: "" });
      onClose();
    }, 2500);
  };

  return (
    <div className="overlay z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <div 
        className="modal relative max-w-3xl w-full bg-card my-auto rounded-2xl border border-line shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header & Navigation Bar */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-line p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold text-ink-soft">
            <button
              onClick={() => setActiveTab("about")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === "about" ? "bg-indigo/10 text-indigo font-bold" : "hover:bg-paper"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About Us</span>
            </button>
            <button
              onClick={() => setActiveTab("editorial")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === "editorial" ? "bg-indigo/10 text-indigo font-bold" : "hover:bg-paper"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Editorial Policy</span>
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === "privacy" ? "bg-indigo/10 text-indigo font-bold" : "hover:bg-paper"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === "terms" ? "bg-indigo/10 text-indigo font-bold" : "hover:bg-paper"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                currentTab === "contact" ? "bg-indigo/10 text-indigo font-bold" : "hover:bg-paper"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper transition cursor-pointer ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-ink text-sm leading-relaxed">
          
          {/* ABOUT US TAB */}
          {currentTab === "about" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Info className="w-5 h-5 text-indigo" />
                <h2 className="font-display font-bold text-2xl text-ink">About Us</h2>
              </div>
              <p>
                <strong>Whatsthatmean.com</strong> is an independent digital reference platform dedicated to decoding acronyms, slang, abbreviations, emojis, and modern internet expressions. Our mission is to help readers around the world understand the fast-changing language used across texting, social media, gaming, business communication, military terminology, and online culture.
              </p>
              <p>
                Every entry on our site is written to give readers more than a bare-bones definition. We provide clear explanations, real-world usage examples, cultural context, and background information so visitors can confidently understand — and correctly use — these expressions in everyday communication.
              </p>

              <div className="bg-paper p-5 rounded-xl border border-line space-y-3">
                <h3 className="font-bold text-sm text-ink">What we aim to do:</h3>
                <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-ink-soft">
                  <li>Deliver accurate, easy-to-understand explanations backed by research</li>
                  <li>Provide context and usage examples, not just one-line definitions</li>
                  <li>Continuously update our database as new slang, acronyms, and expressions emerge online</li>
                  <li>Maintain a safe, reliable, and family-friendly resource for a global audience</li>
                  <li>Cite and reference credible sources where relevant, and avoid speculation on sensitive topics</li>
                </ul>
              </div>

              <p className="pt-2 text-ink-soft">
                <strong>Whatsthatmean.com</strong> is more than a dictionary — it's a living guide to modern digital language, maintained by an editorial team that reviews and updates content on an ongoing basis.
              </p>
            </div>
          )}

          {/* EDITORIAL POLICY TAB */}
          {currentTab === "editorial" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <ShieldCheck className="w-5 h-5 text-indigo" />
                <h2 className="font-display font-bold text-2xl text-ink">Editorial Policy</h2>
              </div>
              <p className="text-ink-soft">
                Our editorial standards ensure that all content published on Whatsthatmean.com is accurate, original, and genuinely useful to readers.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="font-bold text-base text-ink">1. Accuracy and Verification</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Every term is researched using credible sources, observed real-world usage, cultural references, and community discussion. Definitions and examples go through an internal review process before publication to check for clarity, correctness, and completeness.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">2. Original, Human-Written Content</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    All explanations, examples, and contextual notes on this site are written and edited by our own editorial team. We do not publish auto-generated bulk content or scrape definitions from other sites.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">3. Neutrality and Sensitivity</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We present information objectively. Terms with sensitive, political, or controversial origins are explained factually and in context, without promoting any particular ideological or political viewpoint. Where a term could be considered offensive in some contexts, we note that clearly for the reader's benefit.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">4. Continuous Updates</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Digital language evolves quickly. Existing entries are periodically reviewed and updated, and new terms are added regularly as they emerge in online communication.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">5. Corrections and User Feedback</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We welcome corrections and suggestions from readers. All user-submitted feedback is reviewed by an editor before any entry is added or changed — nothing is published automatically from user submissions.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">6. Advertising Disclosure</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Whatsthatmean.com displays advertising, including through Google AdSense, to support the cost of running and maintaining this free resource. Advertisements are clearly distinguishable from editorial content and do not influence the definitions or explanations we publish.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY TAB */}
          {currentTab === "privacy" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Lock className="w-5 h-5 text-indigo" />
                <h2 className="font-display font-bold text-2xl text-ink">Privacy Policy</h2>
              </div>
              <p>
                This Privacy Policy explains how Whatsthatmean.com ("we," "us," or "our") collects, uses, and protects information when you visit our website.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="font-bold text-base text-ink">1. Information We Collect</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We may collect the following types of information:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-ink-soft mt-2 pl-2">
                    <li><strong>Technical data:</strong> browser type, device type, general geographic region (derived from IP address), and referral source</li>
                    <li><strong>Cookies and similar technologies:</strong> used for analytics and to support advertising features</li>
                    <li><strong>Voluntarily provided information:</strong> such as your name or email address, if you choose to contact us through our contact form</li>
                  </ul>
                  <p className="text-xs sm:text-sm text-ink-soft mt-2">
                    We do not require account registration to use this site, and we do not knowingly collect personally identifiable information unless you voluntarily provide it.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">2. How We Use Information</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Any information collected may be used to:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-ink-soft mt-2 pl-2">
                    <li>Improve website performance, content, and user experience</li>
                    <li>Understand traffic patterns and how visitors use the site</li>
                    <li>Respond to inquiries, feedback, or correction requests</li>
                    <li>Maintain site security and prevent misuse</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">3. Advertising and Third-Party Services</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We use third-party services to operate and monetize this site, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-ink-soft mt-2 pl-2">
                    <li><strong>Google Analytics</strong>, to understand site traffic and usage</li>
                    <li><strong>Google AdSense</strong>, to display advertising</li>
                  </ul>
                  <p className="text-xs sm:text-sm text-ink-soft mt-2">
                    Google and its partners may use cookies to serve ads based on a user's prior visits to this or other websites. Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-indigo underline font-medium">Google's Ads Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-indigo underline font-medium">www.aboutads.info</a>. Third-party vendors, including Google, may also use cookies to serve ads based on someone's visits to this site and/or other sites on the Internet.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">4. Cookies</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Cookies help us analyze traffic and improve site functionality. You can disable cookies at any time through your browser settings; note that some site features may not function correctly if cookies are disabled.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">5. Children's Privacy</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    This site is not directed at children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can remove it.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">6. Your Rights (GDPR / CCPA)</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Depending on your location, you may have the right to access, correct, or request deletion of personal data we hold about you, and to opt out of certain data processing. To exercise these rights, please contact us using the details below.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">7. Data Protection</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We do not sell or trade your personal information to third parties. We take reasonable technical and organizational measures to protect data from unauthorized access, alteration, or disclosure.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">8. Changes to This Policy</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">9. Contact</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    For privacy-related questions, please contact us using the information in the Contact Us section below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE TAB */}
          {currentTab === "terms" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <FileText className="w-5 h-5 text-indigo" />
                <h2 className="font-display font-bold text-2xl text-ink">Terms of Service</h2>
              </div>
              <p>
                By accessing or using Whatsthatmean.com (the "Site"), you agree to the following terms. If you do not agree, please discontinue use of the Site.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <h3 className="font-bold text-base text-ink">1. Purpose of the Service</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    Whatsthatmean.com provides definitions, explanations, and contextual information about acronyms, slang, and digital expressions for general informational and educational purposes.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">2. No Guarantee of Completeness</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We strive for accuracy and regularly update our content, but we cannot guarantee that all information is complete, current, or error-free. Content is provided "as is" without warranties of any kind, express or implied.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">3. Acceptable Use</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    When using this Site, you agree not to:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-ink-soft mt-2 pl-2">
                    <li>Use the Site for any unlawful purpose</li>
                    <li>Scrape, copy, or mass-extract content through automated means</li>
                    <li>Attempt to disrupt, overload, or interfere with the Site's normal operation</li>
                    <li>Reproduce, republish, or redistribute our content without prior written permission</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">4. Intellectual Property</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    All text, definitions, examples, graphics, and design elements on this Site are the property of Whatsthatmean.com and are protected by copyright and other intellectual property laws. Unauthorized reproduction or distribution is prohibited.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">5. Third-Party Links and Advertising</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    The Site may display third-party advertisements or link to external websites. We are not responsible for the content, accuracy, or practices of third-party sites and do not endorse them.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">6. Limitation of Liability</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    To the fullest extent permitted by law, Whatsthatmean.com and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, this Site.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">7. Service Changes</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    We reserve the right to modify, suspend, or discontinue any part of the Site at any time, without prior notice.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">8. Changes to These Terms</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    These Terms may be updated periodically. Continued use of the Site after changes are posted constitutes acceptance of the revised Terms.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base text-ink">9. Governing Law</h3>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1">
                    These Terms shall be governed by applicable laws in the jurisdiction in which the Site operator resides, without regard to conflict-of-law principles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT US TAB */}
          {currentTab === "contact" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Mail className="w-5 h-5 text-indigo" />
                <h2 className="font-display font-bold text-2xl text-ink">Contact Us</h2>
              </div>
              <p>
                We'd love to hear from you. If you have questions, feedback, corrections, or collaboration inquiries, please reach out.
              </p>

              <div className="bg-paper border border-line rounded-xl p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo shrink-0" />
                <div>
                  <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">Email Us Directly</div>
                  <a href="mailto:contact@whatsthatmean.com" className="text-sm font-bold text-indigo hover:underline">
                    contact@whatsthatmean.com
                  </a>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-2">
                  <div className="text-emerald-700 font-bold text-lg">Message Received!</div>
                  <p className="text-xs text-emerald-800">
                    Thank you for contacting Whatsthatmean.com. We aim to respond to all inquiries as promptly as possible, typically within a few business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-ink">When contacting us, please include:</p>
                    <ul className="list-disc list-inside text-xs text-ink-soft space-y-1 pl-1">
                      <li>Your name (optional)</li>
                      <li>The specific term or page you're referring to</li>
                      <li>A clear description of your question, correction, or request</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Your Name (optional)</label>
                      <input 
                        type="text" 
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo"
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
                        className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Specific Term or Page (optional)</label>
                    <input 
                      type="text" 
                      value={contactForm.termPage}
                      onChange={(e) => setContactForm({ ...contactForm, termPage: e.target.value })}
                      placeholder="e.g. IMO, ASAP, or /term/IMO"
                      className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Clear Description of Question/Request</label>
                    <textarea 
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Enter your inquiry, correction, or feedback here..."
                      className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-ink-soft">Response time: typically a few business days</span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo text-white font-bold rounded-lg hover:bg-indigo-dark transition text-xs cursor-pointer shadow-sm"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
