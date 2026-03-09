import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Keith L. Odom App",
  description:
    "Privacy Policy for the Keith L. Odom (KLO) App. Learn how we collect, use, and protect your personal information.",
  alternates: {
    canonical: "https://klo-app.vercel.app/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#E6EDF3] mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-[#8B949E] leading-relaxed text-sm sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#0D1117] py-12 sm:py-16">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[#D4A853] hover:text-[#e4bb6f] transition-colors text-sm mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Home
      </Link>

      {/* Header */}
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#E6EDF3] mb-2">
        Privacy Policy
      </h1>
      <p className="text-[#8B949E] text-sm mb-10">
        Effective Date: March 1, 2026 &middot; Last Updated: March 8, 2026
      </p>

      <div className="border-t border-[#21262D] pt-10">
        <Section title="1. Introduction">
          <p>
            Welcome to the Keith L. Odom App (also referred to as
            &ldquo;KLO&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;our&rdquo;). This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our
            mobile application and website (collectively, the
            &ldquo;Service&rdquo;). Please read this policy carefully. By
            accessing or using the Service, you agree to the terms of this
            Privacy Policy.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We may collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-[#E6EDF3]">Display Name</strong> &mdash;
              Provided during conference guest sign-in to identify participants
              during live events.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Email Address</strong> &mdash;
              Used for organizer communications, account identification, and
              subscription management.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Poll Votes</strong> &mdash;
              Responses submitted during live event polls.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Q&amp;A Submissions</strong>{" "}
              &mdash; Questions or comments submitted during live events or
              through the app.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Assessment Results</strong>{" "}
              &mdash; Scores and responses from leadership and AI-readiness
              assessments.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Booking Inquiries</strong>{" "}
              &mdash; Information submitted through the booking and contact
              forms, including name, email, event details, and messages.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Payment Information</strong>{" "}
              &mdash; Processed securely by Stripe. We do not store credit card
              numbers or full payment details on our servers.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Usage Analytics</strong>{" "}
              &mdash; Basic analytics data such as pages visited, feature usage,
              device type, and session duration to improve the Service.
            </li>
          </ul>
        </Section>

        <Section title="3. Authentication">
          <p>
            Conference guests sign in with a display name only. No passwords are
            stored for guest users; authentication is handled via secure,
            time-limited tokens.
          </p>
          <p>
            Administrative and organizer access is authenticated through Google
            OAuth or Apple OAuth. We do not store OAuth passwords. We receive
            only the profile information (name, email, profile image) authorized
            by the OAuth provider.
          </p>
        </Section>

        <Section title="4. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Facilitate conference participation and live event features.</li>
            <li>
              Provide personalized assessment results and recommendations.
            </li>
            <li>Process booking inquiries and subscription payments.</li>
            <li>Send relevant communications about events and services.</li>
            <li>Improve and optimize the Service based on usage patterns.</li>
            <li>Ensure the security and integrity of the Service.</li>
          </ul>
        </Section>

        <Section title="5. Third-Party Services">
          <p>
            We use the following third-party services to operate the Service.
            Each has its own privacy policy governing use of your information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-[#E6EDF3]">Supabase</strong> &mdash;
              Database hosting and backend services.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Stripe</strong> &mdash;
              Payment processing for subscriptions and purchases.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Google OAuth</strong> &mdash;
              Authentication for authorized users.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Apple OAuth</strong> &mdash;
              Authentication for authorized users.
            </li>
            <li>
              <strong className="text-[#E6EDF3]">Vercel</strong> &mdash;
              Application hosting and deployment.
            </li>
          </ul>
          <p>
            We do not sell, trade, or rent your personal information to third
            parties.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your personal information only for as long as necessary to
            fulfill the purposes outlined in this Privacy Policy, unless a
            longer retention period is required or permitted by law. Guest
            sign-in data associated with specific conferences may be retained
            for the duration of the event and a reasonable period afterward for
            follow-up communications.
          </p>
          <p>
            Assessment results are retained as long as your account is active to
            allow you to review historical results and track progress.
          </p>
        </Section>

        <Section title="7. Your Rights and Data Deletion">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Request access to the personal information we hold about you.
            </li>
            <li>
              Request correction of inaccurate or incomplete personal
              information.
            </li>
            <li>
              Request deletion of your personal information from our systems.
            </li>
            <li>
              Withdraw consent for data processing where consent was the basis
              for processing.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a
              href="mailto:info@keithlodom.ai"
              className="text-[#D4A853] hover:underline"
            >
              info@keithlodom.ai
            </a>
            . We will respond to your request within 30 days.
          </p>
        </Section>

        <Section title="8. Data Security">
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. This includes encrypted data
            transmission (TLS/SSL), secure token-based authentication, and
            access controls on our database systems.
          </p>
          <p>
            However, no method of transmission over the Internet or electronic
            storage is 100% secure. While we strive to protect your personal
            information, we cannot guarantee its absolute security.
          </p>
        </Section>

        <Section title="9. Cookies and Tracking">
          <p>
            We use essential cookies for authentication and session management.
            We do not use third-party advertising cookies. Analytics data is
            collected in an anonymized form to improve the Service.
          </p>
        </Section>

        <Section title="10. Children&rsquo;s Privacy">
          <p>
            The Service is not directed to children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If we become aware that we have collected personal information from
            a child under 13, we will take steps to delete that information
            promptly. If you believe we have inadvertently collected information
            from a child under 13, please contact us at{" "}
            <a
              href="mailto:info@keithlodom.ai"
              className="text-[#D4A853] hover:underline"
            >
              info@keithlodom.ai
            </a>
            .
          </p>
        </Section>

        <Section title="11. App Store and Google Play Distribution">
          <p>
            The Service is available for download through the Apple App Store
            and Google Play Store. Your use of the Service is also subject to
            the terms and privacy policies of Apple Inc. and Google LLC,
            respectively. We are not responsible for the data collection
            practices of these platform providers.
          </p>
        </Section>

        <Section title="12. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. When we make
            changes, we will update the &ldquo;Last Updated&rdquo; date at the
            top of this page. We encourage you to review this Privacy Policy
            periodically for any changes. Your continued use of the Service
            after any modifications indicates your acceptance of the updated
            Privacy Policy.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            If you have any questions or concerns about this Privacy Policy or
            our data practices, please contact us at:
          </p>
          <div className="mt-3 p-4 rounded-lg border border-[#21262D] bg-[#161B22]">
            <p className="text-[#E6EDF3] font-semibold">Keith L. Odom</p>
            <p>
              Email:{" "}
              <a
                href="mailto:info@keithlodom.ai"
                className="text-[#D4A853] hover:underline"
              >
                info@keithlodom.ai
              </a>
            </p>
            <p>
              Website:{" "}
              <a
                href="https://klo-app.vercel.app"
                className="text-[#D4A853] hover:underline"
              >
                klo-app.vercel.app
              </a>
            </p>
          </div>
        </Section>
      </div>

      {/* Bottom back link */}
      <div className="border-t border-[#21262D] pt-8 mt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#D4A853] hover:text-[#e4bb6f] transition-colors text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
