import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { UL } from '@/components/legal/LegalComponents';

export const metadata = {
  title: 'Terms of Service — TedOS',
  description: 'End User License Agreement for TedOS by Ted McGrath Brands',
};

const sections = [
  {
    id: 'acceptance',
    number: 1,
    title: 'Acceptance of This EULA',
    content: (
      <>
        <p>By scrolling through and clicking "I Accept," and by accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by this EULA. Acceptance of this EULA is a condition precedent to accessing login credentials or using the Platform.</p>
        <p className="mt-3">If you do not agree to this EULA, you may not access or use the Platform.</p>
      </>
    ),
  },
  {
    id: 'subscription-agreement',
    number: 2,
    title: 'Relationship to Subscription Agreement',
    content: (
      <>
        <p>This EULA governs how the Platform may be accessed and used.</p>
        <p className="mt-3">All commercial, financial, and contractual terms, including subscription fees, billing, refunds, termination, limitation of liability, governing law, venue, and dispute resolution, are governed exclusively by the applicable TedOS™ Software Subscription Agreement entered into between the Company and the Customer (the "Subscription Agreement").</p>
        <p className="mt-3">In the event of any conflict between this EULA and the Subscription Agreement, the Subscription Agreement shall control.</p>
      </>
    ),
  },
  {
    id: 'license-grant',
    number: 3,
    title: 'License Grant (Operational Scope)',
    content: (
      <>
        <p>Subject to compliance with this EULA and the Subscription Agreement, the Company grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform solely for internal business purposes on behalf of the Customer.</p>
        <p className="mt-3">This license grants access only, not ownership. All rights not expressly granted are reserved by the Company.</p>
        <p className="mt-3">The license may be suspended, limited, or revoked as described in this EULA.</p>
      </>
    ),
  },
  {
    id: 'account-access',
    number: 4,
    title: 'Account Access, Credentials, and Security',
    content: (
      <>
        <p>You are responsible for:</p>
        <UL items={[
          'Maintaining the confidentiality of login credentials',
          'All activity that occurs under your account',
          "Ensuring that access is limited to authorized users within the Customer's organization",
        ]} />
        <p className="mt-3">You may not share credentials with unauthorized users or third parties.</p>
        <p className="mt-3">The Company may suspend or restrict access if it reasonably believes that account security has been compromised or misuse is occurring.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    number: 5,
    title: 'Acceptable Use Restrictions',
    content: (
      <>
        <p>You may not, directly or indirectly:</p>
        <UL items={[
          'Use bots, scripts, crawlers, scrapers, or automated tools to access the Platform',
          'Reverse engineer, decompile, disassemble, or attempt to derive source code or system architecture',
          'Conduct load testing, stress testing, or performance testing without written authorization',
          'Interfere with or disrupt the integrity or performance of the Platform',
          'Circumvent access controls, rate limits, or technical safeguards',
          'Use the Platform to build, support, or enhance a competing product or service',
        ]} />
        <p className="mt-3">Any such activity constitutes a material violation of this EULA.</p>
      </>
    ),
  },
  {
    id: 'ai-restrictions',
    number: 6,
    title: 'AI-Specific Use Restrictions',
    content: (
      <>
        <p>The Platform may include artificial intelligence or machine-learning components. You may not:</p>
        <UL items={[
          'Train, fine-tune, or develop competing AI models using Platform outputs',
          'Systematically extract, harvest, or compile AI responses or prompts',
          'Represent AI outputs as professional, legal, medical, financial, or other regulated advice',
          'Rely on AI outputs as a substitute for independent professional judgment',
        ]} />
        <p className="mt-3">AI outputs are probabilistic in nature and may be inaccurate, incomplete, or inconsistent.</p>
      </>
    ),
  },
  {
    id: 'monitoring',
    number: 7,
    title: 'Monitoring, Enforcement, and Technical Remedies',
    content: (
      <>
        <p>The Company may monitor Platform usage for security, compliance, abuse prevention, and system optimization.</p>
        <p className="mt-3">If the Company reasonably determines that this EULA has been violated or that usage poses a risk to the Platform or other users, it may take technical action, including:</p>
        <UL items={[
          'Throttling usage',
          'Limiting features',
          'Suspending access',
          'Locking accounts',
        ]} />
        <p className="mt-3">Such actions are technical remedies, not contractual termination, and may be taken without prior notice where appropriate.</p>
      </>
    ),
  },
  {
    id: 'modifications',
    number: 8,
    title: 'Modifications to the Platform',
    content: (
      <>
        <p>The Company may modify, update, enhance, remove, or discontinue features, workflows, interfaces, or AI behavior at any time.</p>
        <p className="mt-3">The Company does not guarantee the continued availability of any specific feature or functionality.</p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    number: 9,
    title: 'Intellectual Property Protection',
    content: (
      <>
        <p>The Platform, including all software, models, algorithms, systems, interfaces, and underlying technology, is and remains the exclusive intellectual property of the Company.</p>
        <p className="mt-3">You may not copy, reproduce, distribute, create derivative works from, or otherwise exploit the Platform except as expressly permitted under this EULA and the Subscription Agreement.</p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    number: 10,
    title: 'Software and AI Disclaimers',
    content: (
      <>
        <p>The Platform is provided "as is" and "as available."</p>
        <p className="mt-3">The Company makes no warranties regarding uptime, accuracy, completeness, reliability, or fitness for a particular purpose.</p>
        <p className="mt-3">You acknowledge that decisions made using the Platform or its outputs are made at your own risk.</p>
      </>
    ),
  },
  {
    id: 'suspension-termination',
    number: 11,
    title: 'Suspension vs. Termination',
    content: (
      <>
        <p>Suspension of access under this EULA is a technical control mechanism and does not constitute termination of the Subscription Agreement.</p>
        <p className="mt-3">Termination rights and consequences are governed solely by the Subscription Agreement.</p>
        <p className="mt-3">Suspension does not relieve payment obligations already incurred.</p>
      </>
    ),
  },
  {
    id: 'eula-updates',
    number: 12,
    title: 'Updates to This EULA',
    content: (
      <>
        <p>The Company may update this EULA from time to time. Updated versions will be posted within the Platform or otherwise made available prior to access.</p>
        <p className="mt-3">Continued use of the Platform after an update constitutes acceptance of the revised EULA.</p>
      </>
    ),
  },
  {
    id: 'contact',
    number: 13,
    title: 'Contact Information',
    content: (
      <>
        <p>Questions regarding this EULA may be directed to the Company through the support channels designated within the Platform or on the Company's website.</p>
        <div className="mt-4 pl-4 border-l-2 border-[#00E5FF]/20 space-y-1">
          <p className="text-[#9CB3C5] font-medium">TedOS Inc.</p>
          <p>Email: <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">support@tedmcgrathbrands.com</a></p>
        </div>
      </>
    ),
  },
  {
    id: 'severability',
    number: 14,
    title: 'Severability and Survival',
    content: (
      <>
        <p>If any provision of this EULA is held unenforceable, the remaining provisions shall remain in full force and effect.</p>
        <p className="mt-3">Sections relating to intellectual property, disclaimers, enforcement, and limitations shall survive suspension or termination of access.</p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="End User License Agreement"
      subtitle="This EULA governs access to and use of the TedOS™ software platform and related services. By accessing the Platform, you agree to be bound by these terms."
      effectiveDate="January 1, 2026"
      lastUpdated="January 1, 2026"
      sections={sections}
    />
  );
}
