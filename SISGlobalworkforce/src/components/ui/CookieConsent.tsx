// components/CookieConsent.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("sis-cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(
      "sis-cookie-consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true })
    );
    setVisible(false);
  };

  const rejectAll = () => {
    localStorage.setItem(
      "sis-cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
    setVisible(false);
  };

  const savePreferences = () => {
    localStorage.setItem("sis-cookie-consent", JSON.stringify(preferences));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[999] w-[420px] max-w-[calc(100vw-3rem)] bg-[#1a1a1a] rounded-lg shadow-2xl overflow-hidden">

      {!showDetails ? (
        /* Simple View — matches screenshot */
        <div className="p-6">
          <h3 className="text-white font-bold text-lg mb-3">
            We value your privacy
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            By clicking "Accept All Cookies", you agree to the storing of
            cookies on your device and to the associated processing of data to
            enhance site navigation, analyze site usage, and assist in our
            marketing and performance efforts. You may withdraw your consent at
            any time via the "Manage Preferences" button in our Cookie Notice.{" "}
            <Link
              href="/cookies"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              Cookie Notice
            </Link>{" "}
            |{" "}
            <button
              onClick={() => setShowDetails(true)}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors bg-transparent border-none cursor-pointer p-0 text-sm"
            >
              Manage Preferences
            </button>
          </p>

          <div className="flex gap-3">
            <button
              onClick={rejectAll}
              className="flex-1 py-3 px-4 bg-[#cc0000] hover:bg-[#aa0000] text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer"
            >
              Reject Cookies
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 py-3 px-4 bg-[#cc0000] hover:bg-[#aa0000] text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer"
            >
              Accept All Cookies
            </button>
          </div>
        </div>
      ) : (
        /* Manage Preferences View */
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">Manage Preferences</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {/* Necessary */}
            <div className="flex items-start justify-between p-3 rounded bg-white/5 border border-white/10">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">Necessary</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#cc0000]/20 text-red-400 border border-red-500/20">
                    Always On
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Required for the website to function. Cannot be disabled.
                </p>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-5 bg-[#cc0000] rounded-full relative opacity-50 cursor-not-allowed">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between p-3 rounded bg-white/5 border border-white/10">
              <div className="flex-1 pr-4">
                <span className="text-white font-semibold text-sm block mb-1">Analytics</span>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Help us understand how visitors interact with our site.
                </p>
              </div>
              <button
                onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                className={`flex-shrink-0 mt-0.5 w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer border-none ${
                  preferences.analytics ? "bg-[#cc0000]" : "bg-white/20"
                }`}
                aria-label="Toggle analytics"
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                  preferences.analytics ? "right-0.5" : "left-0.5"
                }`} />
              </button>
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between p-3 rounded bg-white/5 border border-white/10">
              <div className="flex-1 pr-4">
                <span className="text-white font-semibold text-sm block mb-1">Marketing</span>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Used for personalised ads and campaign tracking.
                </p>
              </div>
              <button
                onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                className={`flex-shrink-0 mt-0.5 w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer border-none ${
                  preferences.marketing ? "bg-[#cc0000]" : "bg-white/20"
                }`}
                aria-label="Toggle marketing"
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                  preferences.marketing ? "right-0.5" : "left-0.5"
                }`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={rejectAll}
              className="flex-1 py-3 px-4 bg-[#cc0000] hover:bg-[#aa0000] text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer"
            >
              Reject All
            </button>
            <button
              onClick={savePreferences}
              className="flex-1 py-3 px-4 bg-[#cc0000] hover:bg-[#aa0000] text-white text-sm font-semibold rounded transition-colors duration-200 cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}