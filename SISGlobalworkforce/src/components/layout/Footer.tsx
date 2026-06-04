import Link from "next/link";

const footerLinks = {
  "For Job Seekers": [
    { label: "Browse Jobs", href: "/jobs" },
    { label: "Browse Companies", href: "/companies" },
    { label: "Candidate Dashboard", href: "/dashboard" },
    { label: "Career Advice", href: "/career-advice" },
    { label: "Salary Explorer", href: "/salary" },
  ],
  "For Employers": [
    { label: "Post a Job", href: "/post-job" },
    { label: "Browse Candidates", href: "/candidates" },
    { label: "Pricing Plans", href: "/pricing" },
    { label: "Employer FAQ", href: "/faq" },
    { label: "Enterprise", href: "/enterprise" },
  ],
  Company: [
    { label: "About Us", href: "/sis-global" },
    { label: "Blog", href: "/blog" },
    { label: "Shop", href: "/shop" },
    { label: "Press Kit", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  Support: [
    { label: "Help Center", href: "/help" },
    { label: "FAQ's", href: "/faq" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-brand-grey-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              
              <div>
                <Link href="/" className="flex items-center gap-3">
                <img src="/assets/LOGO-2-gray colour.png" alt="SIS Global"  style={{
      height: '200px',
      // background:"#fff",
      
      width: 'auto',
      objectFit: 'contain'
    }} />

    </Link>
              </div>
            </div>
            <p className="text-brand-grey-400 text-sm leading-relaxed mb-6">
              The world&apos;s leading job board connecting talented professionals with world-class companies.
            </p>
            <div className="flex items-center gap-3">
              {["T", "L", "F", "I"].map((s) => (
                <a key={s} href="#" className="w-8 h-8 rounded-full bg-brand-grey-700 flex items-center justify-center text-xs text-brand-grey-300 hover:bg-brand-red hover:text-white transition-all font-bold">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-brand-grey-300 uppercase tracking-widest mb-4">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-grey-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-brand-grey-500 text-sm">
            © 2024 SIS Global Workforce Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Use", "Cookie Policy"].map((label) => (
              <Link key={label} href="#" className="footer-link text-xs">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
