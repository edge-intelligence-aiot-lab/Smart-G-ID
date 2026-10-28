"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { saveFarmerProfile } from "@/actions/marketplace";
import { Navbar } from "@/components/Navbar";
import { Farmer } from "@/types/database";

type RegisterStep = "FORM" | "OTP" | "SUCCESS";

export default function FarmerRegistrationPage() {
  const [step, setStep] = useState<RegisterStep>("FORM");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [farmLocation, setFarmLocation] = useState("");

  // OTP Verification Fields
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [registeredFarmer, setRegisteredFarmer] = useState<Farmer | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Clean up reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  /**
   * Normalizes local/international phone numbers into E.164 format.
   * e.g., "0917 555 0192" -> "+639175550192"
   * e.g., "9175550192" -> "+639175550192"
   * e.g., "+639175550192" -> "+639175550192"
   */
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("09") && cleaned.length === 11) {
      return `+63${cleaned.slice(1)}`;
    }
    if (cleaned.startsWith("9") && cleaned.length === 10) {
      return `+63${cleaned}`;
    }
    if (cleaned.startsWith("63") && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return cleaned;
  };

  /**
   * Client-side field validation before requesting OTP.
   */
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = "Please enter the farmer's full name (at least 2 characters).";
    }

    const formatted = formatPhoneNumber(contactNumber);
    if (!formatted.startsWith("+") || formatted.length < 11) {
      errs.contactNumber = "Please enter a valid mobile number (e.g. 0917 555 0192 or +63 917 555 0192).";
    }

    if (!farmLocation.trim() || farmLocation.trim().length < 3) {
      errs.farmLocation = "Please provide the farm's location (municipality, province, or region).";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Initializes Firebase invisible reCAPTCHA on the client.
   */
  const initRecaptcha = (): RecaptchaVerifier | null => {
    if (typeof window === "undefined") return null;

    try {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
      }

      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          setErrors({ general: "reCAPTCHA expired. Please try submitting again." });
        },
      });

      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (err: any) {
      console.error("Recaptcha initialization error:", err);
      setErrors({ general: "Failed to initialize verification system. Please reload the page." });
      return null;
    }
  };

  /**
   * Step 1: Send SMS OTP
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const verifier = initRecaptcha();
      if (!verifier) {
        setLoading(false);
        return;
      }

      const formatted = formatPhoneNumber(contactNumber);
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier);

      setConfirmationResult(confirmation);
      setStep("OTP");
      setResendTimer(30);
    } catch (err: any) {
      console.error("Firebase Phone Auth error:", err);
      let message = "Failed to send verification SMS. Please check the number and try again.";

      if (err?.code === "auth/invalid-phone-number") {
        message = "Invalid phone number format. Please ensure country code and digits are correct.";
      } else if (err?.code === "auth/quota-exceeded") {
        message = "SMS quota exceeded for this Firebase project. Contact system administrator or test with pre-configured phone numbers.";
      } else if (err?.code === "auth/too-many-requests") {
        message = "Too many verification requests. Please wait a moment before trying again.";
      } else if (err?.code === "auth/captcha-check-failed") {
        message = "reCAPTCHA verification failed. Please refresh the page.";
      }

      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend SMS code
   */
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setErrors({});

    try {
      const verifier = initRecaptcha();
      if (!verifier) return;

      const formatted = formatPhoneNumber(contactNumber);
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmationResult(confirmation);
      setResendTimer(30);
    } catch (err: any) {
      console.error("Error resending OTP:", err);
      setErrors({ general: "Unable to resend SMS code right now. Please wait a moment." });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP and save Farmer document to Firestore
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrors({ otp: "Please enter the 6-digit SMS verification code." });
      return;
    }

    if (!confirmationResult) {
      setErrors({ general: "Session expired. Please request a new verification code." });
      setStep("FORM");
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // 1. Authenticate user with Firebase Phone Auth
      const userCredential = await confirmationResult.confirm(otpCode.trim());
      const user = userCredential.user;

      if (!user || !user.uid) {
        throw new Error("Phone verification succeeded but no user UID returned.");
      }

      const formatted = formatPhoneNumber(contactNumber);

      const farmerData: Farmer = {
        FarmerID: user.uid,
        FullName: fullName.trim(),
        ContactNumber: formatted,
        FarmLocation: farmLocation.trim(),
        CreatedAt: new Date().toISOString(),
      };

      // 2. Persist to Firestore:
      // Try Server Action with Firebase Admin SDK first (bypasses security rules securely)
      const serverResult = await saveFarmerProfile(farmerData);

      if (!serverResult.success) {
        // Fallback: Also try direct client SDK write
        await setDoc(doc(db, "Farmers", user.uid), farmerData, { merge: true });
      }

      // 3. Move to Success State
      setRegisteredFarmer(farmerData);
      setStep("SUCCESS");
    } catch (err: any) {
      console.error("Error verifying OTP or writing profile:", err);
      let message = "Invalid or expired verification code. Please check and try again.";

      if (err?.code === "auth/invalid-verification-code") {
        message = "Incorrect 6-digit code. Please check the SMS and re-enter.";
      } else if (err?.code === "auth/code-expired") {
        message = "This verification code has expired. Please click Resend Code.";
      }

      setErrors({ otp: message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form for registering another farmer
   */
  const handleReset = () => {
    setFullName("");
    setContactNumber("");
    setFarmLocation("");
    setOtpCode("");
    setConfirmationResult(null);
    setRegisteredFarmer(null);
    setErrors({});
    setStep("FORM");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* reCAPTCHA Invisible Anchor */}
      <div id="recaptcha-container" />

      <div>
        <Navbar />

        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-4 py-4">
          <nav className="text-xs text-gray-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Home
            </Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">Farmer Onboarding</span>
          </nav>
        </div>

        {/* Main Form Container */}
        <main className="max-w-xl mx-auto px-4 py-4 sm:py-8">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            {/* Header Badge & Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {step === "SUCCESS"
                  ? "Registration Complete"
                  : step === "OTP"
                    ? "Verify Phone Number"
                    : "Register as a Verified Farmer"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                {step === "SUCCESS"
                  ? "Your farmer profile has been securely saved and linked to Firebase Authentication."
                  : step === "OTP"
                    ? "We sent a 6-digit SMS verification code to verify your contact number."
                    : "Onboard your farm into the Smart G-ID livestock directory. Your contact number will be verified via SMS."}
              </p>
            </div>

            {/* General Error Banner */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs sm:text-sm">
                <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 leading-relaxed">{errors.general}</div>
              </div>
            )}

            {/* STEP 1: Main Farmer Details Form */}
            {step === "FORM" && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Full Name <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mateo Alvarez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-4 py-3 text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.fullName ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Contact Number (Mobile / SMS) <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0917 555 0192 or +63 917 555 0192"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className={`w-full px-4 py-3 text-sm bg-gray-50/50 border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.contactNumber ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                        }`}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    This phone number is your primary Auth ID and will be published for direct buyer inquiries.
                  </p>
                  {errors.contactNumber && (
                    <p className="text-xs text-red-600 mt-1">{errors.contactNumber}</p>
                  )}
                </div>

                {/* Farm Location */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Farm Location <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batangas Highland Pastures, PH"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    className={`w-full px-4 py-3 text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.farmLocation ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Province, municipality, or farm name where livestock is located.
                  </p>
                  {errors.farmLocation && (
                    <p className="text-xs text-red-600 mt-1">{errors.farmLocation}</p>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending Verification SMS...
                    </>
                  ) : (
                    <>
                      <span>Continue & Verify via SMS</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: SMS OTP Verification */}
            {step === "OTP" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 text-center">
                  <span className="text-xs text-gray-500 block mb-1">Verification code sent to</span>
                  <span className="font-mono text-base font-bold text-gray-900 block">
                    {formatPhoneNumber(contactNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep("FORM")}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold underline mt-1"
                  >
                    Change Number
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 text-center">
                    Enter 6-Digit SMS Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    className={`w-full px-4 py-3.5 text-center tracking-[0.5em] text-2xl font-mono bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${errors.otp ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                  />
                  {errors.otp && (
                    <p className="text-xs text-red-600 mt-2 text-center">{errors.otp}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Didn't receive the SMS?</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleResendOtp}
                    className="font-semibold text-teal-700 hover:text-teal-800 disabled:text-gray-400"
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying & Creating Profile...
                    </>
                  ) : (
                    <>
                      <span>Verify & Complete Registration</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: Success Confirmation State */}
            {step === "SUCCESS" && registeredFarmer && (
              <div className="space-y-6 text-center animate-fadeIn">
                {/* Checkmark Icon */}
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    Welcome, {registeredFarmer.FullName}!
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Your farmer profile has been securely recorded in the Smart G-ID database.
                  </p>
                </div>

                {/* Profile Details Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left text-xs sm:text-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
                    <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Farmer ID (UID)</span>
                    <span className="font-mono text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {registeredFarmer.FarmerID}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Contact Number</span>
                    <span className="font-mono font-bold text-gray-900">
                      {registeredFarmer.ContactNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Farm Location</span>
                    <span className="text-gray-900 font-semibold text-right max-w-[200px] truncate">
                      📍 {registeredFarmer.FarmLocation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      ✓ Active Verified Farmer
                    </span>
                  </div>
                </div>

                {/* Informative Guidance */}
                <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-3.5 text-xs text-teal-900 text-left space-y-1">
                  <span className="font-bold text-teal-950 block">📱 What happens next?</span>
                  <p className="text-teal-800 leading-relaxed">
                    When your livestock are weighed and scanned using our digital scale edge devices, this profile will automatically be linked to your goat listings. Prospective buyers can now contact you directly via call or text.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Link
                    href="/"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all shadow-xs"
                  >
                    <span>Return to Livestock Directory</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Register another farmer
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>© 2026 Smart G-ID. Dedicated farmer onboarding portal with Firebase Phone Authentication.</p>
        </div>
      </footer>
    </div>
  );
}
