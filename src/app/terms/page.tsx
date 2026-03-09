import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | KLO",
  description:
    "Terms of Service for the Keith L. Odom App (KLO). Read our terms covering account access, subscriptions, acceptable use, and more.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-klo-accent hover:underline mb-8"
      >
        <span aria-hidden="true">&larr;</span> Back to Home
      </Link>

      <h1 className="text-3xl font-display font-bold text-klo-text mb-4">
        Terms of Service
      </h1>
      <p className="text-klo-muted mb-8">Effective Date: March 1, 2026</p>

      <div className="space-y-8 text-klo-text/90 leading-relaxed">
        {/* 1. Acceptance */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            1. Acceptance of Terms
          </h2>
          <p>
            By downloading, accessing, or using the Keith&nbsp;L.&nbsp;Odom App
            (&quot;KLO,&quot; &quot;the App,&quot; or &quot;the Platform&quot;),
            you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to all of these Terms,
            do not use the App. These Terms constitute a legally binding
            agreement between you and Keith&nbsp;L.&nbsp;Odom
            (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
          </p>
        </section>

        {/* 2. Account & Guest Access */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            2. Account and Guest Access
          </h2>
          <p className="mb-3">
            KLO offers multiple ways to access the Platform:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Registered accounts</strong> &mdash; You may sign in with
              Google, Apple, or owner credentials. You are responsible for
              maintaining the confidentiality of your account and for all
              activity that occurs under it.
            </li>
            <li>
              <strong>Guest access</strong> &mdash; Certain features (such as
              live Q&amp;A and polls) allow participation by entering a display
              name only. No account creation is required for guest access.
            </li>
            <li>
              You must be at least 13&nbsp;years of age to use the App.
            </li>
            <li>
              You agree to provide accurate information when creating an account
              or entering a display name.
            </li>
          </ul>
        </section>

        {/* 3. Description of Service */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            3. Description of Service
          </h2>
          <p>
            KLO provides AI-powered advisory services, leadership assessments,
            an exclusive content vault, strategy rooms, a marketplace, live
            event features (Q&amp;A, polls), booking functionality, and
            downloadable resources. Some features require a paid subscription.
          </p>
        </section>

        {/* 4. Acceptable Use */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            4. Acceptable Use
          </h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the App for any unlawful purpose</li>
            <li>
              Post or submit spam, harassment, hate speech, threats, or
              otherwise objectionable content through Q&amp;A sessions, polls,
              or any interactive feature
            </li>
            <li>
              Upload or distribute illegal, defamatory, or infringing content
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Platform
            </li>
            <li>
              Interfere with or disrupt the App&apos;s infrastructure or
              security
            </li>
            <li>Share your account credentials with others</li>
            <li>
              Scrape, crawl, or use automated means to access the Platform
              without prior written permission
            </li>
            <li>Impersonate another person or entity</li>
          </ul>
          <p className="mt-3">
            We reserve the right to remove any user-submitted content that
            violates these Terms, at our sole discretion and without prior
            notice.
          </p>
        </section>

        {/* 5. Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            5. Intellectual Property
          </h2>
          <p className="mb-3">
            All content on the Platform &mdash; including text, graphics, logos,
            audio, video, assessments, AI-generated insights, and software
            &mdash; is the property of Keith&nbsp;L.&nbsp;Odom or its licensors
            and is protected by applicable intellectual property laws. You may
            not reproduce, distribute, modify, or create derivative works from
            any Platform content without explicit written permission.
          </p>
          <p>
            <strong>Your submissions:</strong> You retain all rights to content
            you submit through the App (such as Q&amp;A responses, poll
            answers, and chat messages). By submitting content, you grant us a
            non-exclusive, royalty-free, worldwide license to display and use
            that content in connection with operating the Platform.
          </p>
        </section>

        {/* 6. Subscriptions & Payments */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            6. Subscriptions and Payments
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Web payments</strong> are processed securely through
              Stripe. Paid subscriptions are billed on a recurring basis
              according to the plan you select.
            </li>
            <li>
              <strong>In-app purchases</strong> made through the Apple App
              Store or Google Play are managed by the respective platform. Their
              terms, refund policies, and billing practices apply to those
              transactions.
            </li>
            <li>
              You may cancel your subscription at any time through your profile
              settings (web) or through the App Store / Google Play (mobile).
              Cancellation takes effect at the end of the current billing
              period.
            </li>
            <li>
              Refunds for web-based purchases are handled on a case-by-case
              basis. For in-app purchase refunds, contact Apple or Google
              directly.
            </li>
            <li>
              Prices may change with at least 30&nbsp;days&apos; prior notice.
              Continued use after a price change constitutes acceptance.
            </li>
          </ul>
        </section>

        {/* 7. AI Advisor Disclaimer */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            7. AI Advisor Disclaimer
          </h2>
          <p>
            The AI Advisor feature provides general guidance and insights based
            on Keith&nbsp;L.&nbsp;Odom&apos;s teachings and expertise. It is
            not a substitute for professional legal, financial, medical, or
            therapeutic advice. You use AI-generated content at your own
            discretion and risk.
          </p>
        </section>

        {/* 8. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            8. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, KLO and
            Keith&nbsp;L.&nbsp;Odom shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising out
            of or related to your use of the App. This includes, without
            limitation, loss of data, loss of profits, or damages resulting from
            reliance on AI-generated content. Our total aggregate liability
            shall not exceed the amount you paid in subscription fees during the
            twelve&nbsp;(12) months immediately preceding the event giving rise
            to the claim.
          </p>
        </section>

        {/* 9. Termination */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            9. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your access to the App
            at any time, with or without cause, for violation of these Terms or
            for any other reason at our sole discretion. Upon termination, your
            right to use the Platform ceases immediately. You may request an
            export of your personal data within 30&nbsp;days of termination by
            contacting us at the email address below.
          </p>
        </section>

        {/* 10. Changes to Terms */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            10. Changes to Terms
          </h2>
          <p>
            We may update these Terms at any time. Material changes will be
            communicated via email or in-app notification at least
            14&nbsp;days before taking effect. The &quot;Effective Date&quot; at
            the top of this page will be updated accordingly. Your continued use
            of the App after changes take effect constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        {/* 11. Governing Law */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            11. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the State of{" "}
            <span className="text-klo-accent font-medium">
              [STATE &mdash; TO BE CONFIGURED]
            </span>
            , without regard to its conflict-of-law provisions. Any disputes
            arising under these Terms shall be resolved through binding
            arbitration in accordance with applicable rules, conducted in the
            State of{" "}
            <span className="text-klo-accent font-medium">
              [STATE &mdash; TO BE CONFIGURED]
            </span>
            .
          </p>
        </section>

        {/* 12. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-klo-text mb-3">
            12. Contact
          </h2>
          <p>
            If you have any questions or concerns about these Terms of Service,
            please contact us at{" "}
            <a
              href="mailto:info@keithlodom.ai"
              className="text-klo-accent hover:underline"
            >
              info@keithlodom.ai
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-[#21262D]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-klo-accent hover:underline"
        >
          <span aria-hidden="true">&larr;</span> Back to Home
        </Link>
      </div>
    </div>
  );
}
