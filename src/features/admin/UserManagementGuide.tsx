"use client";

import { motion } from "framer-motion";
import {
  UserX,
  UserCheck,
  Shield,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Users,
  Eye,
  Filter,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

// ------------------------------------------------------------
// Visual mockup components for the training illustrations
// ------------------------------------------------------------

/** Simulated table row showing action buttons */
function MockUserRow({
  name,
  org,
  tier,
  role,
  disabled,
  highlight,
}: {
  name: string;
  org: string;
  tier: "free" | "pro" | "executive";
  role: string;
  disabled?: boolean;
  highlight?: "disable" | "role" | "delete";
}) {
  const tierColors = {
    free: "bg-white/10 text-gray-400",
    pro: "bg-blue-500/20 text-blue-400",
    executive: "bg-amber-500/20 text-amber-400",
  };

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
        disabled ? "opacity-50 border-white/5" : "border-white/10"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{name}</span>
          {disabled && (
            <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
              Disabled
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{org}</span>
      </div>
      <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${tierColors[tier]}`}>
        {tier}
      </span>
      <span className="shrink-0 text-xs text-gray-500 capitalize w-16">{role}</span>
      <div className="shrink-0 flex items-center gap-1">
        <div
          className={`p-1.5 rounded-lg transition-all ${
            highlight === "disable"
              ? "bg-klo-gold/20 ring-2 ring-klo-gold/50 scale-110"
              : "bg-white/5"
          }`}
        >
          {disabled ? (
            <UserCheck className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <UserX className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
        <div
          className={`p-1.5 rounded-lg transition-all ${
            highlight === "role"
              ? "bg-klo-gold/20 ring-2 ring-klo-gold/50 scale-110"
              : "bg-white/5"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div
          className={`p-1.5 rounded-lg transition-all ${
            highlight === "delete"
              ? "bg-red-500/20 ring-2 ring-red-500/50 scale-110"
              : "bg-white/5"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

/** Annotation arrow pointing to a highlighted element */
function Callout({ children, color = "gold" }: { children: React.ReactNode; color?: "gold" | "red" | "green" }) {
  const colors = {
    gold: "bg-klo-gold/10 border-klo-gold/30 text-klo-gold",
    red: "bg-red-500/10 border-red-500/30 text-red-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
  };
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${colors[color]}`}>
      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

/** Step card with number, icon, and description */
function StepCard({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-klo-gold/20 flex items-center justify-center text-klo-gold text-sm font-bold">
          {step}
        </div>
        <div className="w-px flex-1 bg-white/10 mt-2" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-klo-gold" />
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        </div>
        <div className="text-sm text-gray-400 space-y-3">{children}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Main Guide Component
// ------------------------------------------------------------

export default function UserManagementGuide({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-klo-gold/10">
              <Users className="w-6 h-6 text-klo-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">User Management Guide</h2>
              <p className="text-sm text-gray-500">How to manage users from your admin dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Section 1: Finding Users */}
      <motion.div variants={fadeUp} custom={1} className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-klo-gold" />
          Finding Users
        </h3>

        <StepCard step={1} icon={Search} title="Search by name or organization">
          <p>Type in the search bar at the top of the Users tab. Results filter as you type.</p>
          {/* Visual: Search bar mockup */}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <div className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400">
                Search by name or organization...
              </div>
            </div>
            <Callout>Type any part of a name or organization to find users instantly</Callout>
          </div>
        </StepCard>

        <StepCard step={2} icon={Filter} title="Filter by subscription tier">
          <p>Use the dropdown to show only Free, Pro, or Executive users.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                All Tiers
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600" />
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded-full text-[10px] bg-white/10 text-gray-400">Free</span>
                <span className="px-2 py-1 rounded-full text-[10px] bg-blue-500/20 text-blue-400">Pro</span>
                <span className="px-2 py-1 rounded-full text-[10px] bg-amber-500/20 text-amber-400">Executive</span>
              </div>
            </div>
          </div>
        </StepCard>
      </motion.div>

      {/* Section 2: Action Buttons Explained */}
      <motion.div variants={fadeUp} custom={2} className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-klo-gold" />
          Understanding the Action Buttons
        </h3>

        <p className="text-sm text-gray-400 mb-4">
          Each user row has three action buttons on the right side. Here&apos;s what each one does:
        </p>

        {/* Visual: Annotated row */}
        <div className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-3">
          <MockUserRow name="Jane Smith" org="Acme Corp" tier="pro" role="user" highlight="disable" />
          <Callout>
            <strong>Disable/Enable</strong> (person with X icon) — Temporarily blocks the user from signing in.
            You can re-enable them anytime. Their data stays intact.
          </Callout>

          <MockUserRow name="Jane Smith" org="Acme Corp" tier="pro" role="user" highlight="role" />
          <Callout>
            <strong>Change Role</strong> (shield icon) — Assign the user a new role: User, Moderator, or Admin.
            This controls what they can access in the app.
          </Callout>

          <MockUserRow name="Jane Smith" org="Acme Corp" tier="pro" role="user" highlight="delete" />
          <Callout color="red">
            <strong>Delete</strong> (trash icon) — Permanently disables the account and removes their personal data.
            This cannot be undone.
          </Callout>
        </div>
      </motion.div>

      {/* Section 3: Disabling a User */}
      <motion.div variants={fadeUp} custom={3} className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserX className="w-5 h-5 text-klo-gold" />
          How to Disable a User
        </h3>

        <StepCard step={1} icon={UserX} title="Click the disable button">
          <p>Find the user in the list and click the person-with-X icon on their row.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 mt-2">
            <MockUserRow name="John Doe" org="Example Inc" tier="free" role="user" highlight="disable" />
          </div>
        </StepCard>

        <StepCard step={2} icon={AlertTriangle} title="Confirm in the popup">
          <p>A confirmation dialog will appear. Click &quot;Disable&quot; to proceed.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-4 mt-2 max-w-sm">
            <p className="text-xs font-semibold text-white mb-2">Disable User</p>
            <p className="text-xs text-gray-500 mb-3">
              Disable <span className="text-white">John Doe</span>? They will not be able to sign in until re-enabled.
            </p>
            <div className="flex justify-end gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs text-gray-500">Cancel</span>
              <span className="px-3 py-1.5 rounded-lg text-xs bg-klo-gold/20 text-klo-gold font-medium">Disable</span>
            </div>
          </div>
        </StepCard>

        <StepCard step={3} icon={CheckCircle2} title="User is now disabled">
          <p>The user&apos;s row will appear dimmed with a red &quot;Disabled&quot; badge. They cannot sign in.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 mt-2">
            <MockUserRow name="John Doe" org="Example Inc" tier="free" role="user" disabled />
          </div>
          <Callout color="green">
            To re-enable: click the checkmark icon on the disabled user&apos;s row. They&apos;ll be able to sign in again immediately.
          </Callout>
        </StepCard>
      </motion.div>

      {/* Section 4: Changing a Role */}
      <motion.div variants={fadeUp} custom={4} className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-klo-gold" />
          How to Change a User&apos;s Role
        </h3>

        <StepCard step={1} icon={Shield} title="Click the shield icon">
          <p>Find the user and click the shield button on their row.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 mt-2">
            <MockUserRow name="Sarah Wilson" org="Wilson Group" tier="executive" role="user" highlight="role" />
          </div>
        </StepCard>

        <StepCard step={2} icon={Users} title="Select the new role">
          <p>Choose from the dropdown and click &quot;Update Role.&quot;</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-4 mt-2 max-w-sm">
            <p className="text-xs font-semibold text-white mb-2">Change Role</p>
            <p className="text-xs text-gray-500 mb-3">
              Change role for <span className="text-white">Sarah Wilson</span>
            </p>
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-klo-gold/30 text-xs text-white mb-3 flex items-center justify-between">
              <span>Moderator</span>
              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div className="flex justify-end gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs text-gray-500">Cancel</span>
              <span className="px-3 py-1.5 rounded-lg text-xs bg-klo-gold/20 text-klo-gold font-medium">Update Role</span>
            </div>
          </div>
        </StepCard>

        {/* Role descriptions */}
        <div className="mt-2 rounded-xl bg-black/30 border border-white/10 p-4">
          <p className="text-xs font-semibold text-white mb-3">Role Permissions</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-20 text-xs text-gray-500 font-medium">User</span>
              <span className="text-xs text-gray-400">Standard access. Can use assessments, AI advisor, vault content based on their subscription tier.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-20 text-xs text-klo-gold font-medium">Moderator</span>
              <span className="text-xs text-gray-400">Can manage conference sessions, events, and content. Cannot manage other users.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-20 text-xs text-blue-400 font-medium">Admin</span>
              <span className="text-xs text-gray-400">Full dashboard access. Can manage users, content, events, and all settings.</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 5: Deleting a User */}
      <motion.div variants={fadeUp} custom={5} className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-400" />
          How to Delete a User
        </h3>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>Warning:</strong> Deleting a user is permanent. Their account is disabled and their personal data is removed. Use Disable instead if you might want to restore access later.</span>
        </div>

        <StepCard step={1} icon={Trash2} title="Click the trash icon">
          <p>Find the user and click the red trash button.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 mt-2">
            <MockUserRow name="Bad Actor" org="Spam Co" tier="free" role="user" highlight="delete" />
          </div>
        </StepCard>

        <StepCard step={2} icon={AlertTriangle} title="Read the warning and confirm">
          <p>The confirmation dialog warns that this cannot be undone. Click &quot;Delete&quot; only if you&apos;re sure.</p>
          <div className="rounded-xl bg-black/30 border border-white/10 p-4 mt-2 max-w-sm">
            <p className="text-xs font-semibold text-white mb-2">Delete User</p>
            <div className="flex items-center gap-1.5 text-red-400 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">This action cannot be undone</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              This will permanently disable <span className="text-white">Bad Actor</span>&apos;s account and anonymize their data.
            </p>
            <div className="flex justify-end gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs text-gray-500">Cancel</span>
              <span className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 font-medium">Delete</span>
            </div>
          </div>
        </StepCard>
      </motion.div>

      {/* Section 6: What's Protected */}
      <motion.div variants={fadeUp} custom={6} className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Safety Protections
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-green-400">Owner account is always protected</p>
              <p className="text-xs text-gray-500 mt-0.5">Keith&apos;s owner account cannot be disabled, deleted, or have its role changed by anyone.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-green-400">You can&apos;t modify yourself</p>
              <p className="text-xs text-gray-500 mt-0.5">Admins cannot disable, delete, or change their own role. This prevents accidental lockout.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-green-400">Every action requires confirmation</p>
              <p className="text-xs text-gray-500 mt-0.5">A popup always asks you to confirm before any change is made. Nothing happens by accident.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-400">Disable vs. Delete</p>
              <p className="text-xs text-gray-500 mt-0.5">
                <strong className="text-gray-400">Disable</strong> is reversible — the user&apos;s data stays, they just can&apos;t sign in. Use this first.<br />
                <strong className="text-gray-400">Delete</strong> is permanent — their data is anonymized and cannot be recovered.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Back to Users button */}
      <motion.div variants={fadeUp} custom={7} className="flex justify-center pb-4">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-klo-gold/20 text-klo-gold text-sm font-medium hover:bg-klo-gold/30 transition-colors"
        >
          Back to Users
        </button>
      </motion.div>
    </motion.div>
  );
}
