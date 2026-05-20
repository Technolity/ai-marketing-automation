import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { UL, SubSection } from '@/components/legal/LegalComponents';

export const metadata = {
  title: 'Privacy Policy — TedOS',
  description: 'Privacy Policy for TedOS by Ted McGrath Brands',
};

const sections = [
  {
    id: 'about-tedos',
    number: 1,
    title: 'About TedOS',
    content: (
      <>
        <p>TedOS is a software platform designed to help customers generate and manage marketing assets, funnels, lead communications, CRM workflows, appointment booking, automation, and related business operations.</p>
        <p className="mt-3">The Platform may help customers create or manage materials such as:</p>
        <UL items={[
          'Ideal client profiles', 'Marketing messages', 'Brand stories', 'Offers',
          'Video sales letter scripts', 'Free gift outlines or blueprints',
          'Facebook and Instagram ad copy', 'Email nurture sequences', 'Funnel page copy',
          'Appointment booking page copy', 'Calendar page copy', 'Thank-you page copy',
          'Email and SMS show-up confirmation sequences', 'Brand color recommendations',
          'CRM records', 'Lead records', 'Sales pipeline activity', 'Automations',
          'Funnels', 'Calendar bookings', 'Payment-related workflows',
          'Calls, emails, texts, and related prospect communications',
        ]} />
        <p className="mt-3">The TedOS End User License Agreement confirms that the Platform may include artificial intelligence or machine-learning components, and that Platform usage may be monitored for security, compliance, abuse prevention, and system optimization.</p>
      </>
    ),
  },
  {
    id: 'scope',
    number: 2,
    title: 'Scope of This Privacy Policy',
    content: (
      <>
        <p>This is an overall Privacy Policy for TedOS. It applies to both our public-facing websites and the logged-in Platform, including CRM, funnel, AI, communication, payment, tracking, automation, and support-related features.</p>
        <p className="mt-3">This Privacy Policy does not replace any applicable Subscription Agreement, End User License Agreement, Data Processing Addendum, customer agreement, payment processor agreement, or third-party platform terms. If there is a conflict between this Privacy Policy and a written agreement between TedOS and a customer, the written agreement may control to the extent stated in that agreement.</p>
      </>
    ),
  },
  {
    id: 'customer-data',
    number: 3,
    title: 'Relationship to Customer Data',
    content: (
      <>
        <p>TedOS is primarily a business-to-business software platform. In many cases, our customer is a business, and individual users access the Platform on that customer's behalf.</p>
        <p className="mt-3">Some information entered into the Platform may relate to the customer's own leads, prospects, clients, contacts, or business operations ("Customer Data"). As between TedOS and the customer, Customer Data is generally controlled by the customer, subject to the applicable Subscription Agreement, EULA, and any other written agreement between TedOS and the customer.</p>
        <p className="mt-3">Customers are responsible for ensuring they have the necessary rights, permissions, notices, and consents to submit Customer Data to the Platform and to use the Platform to contact, market to, advertise to, process payments from, or otherwise communicate with their leads, prospects, clients, or contacts.</p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    number: 4,
    title: 'Information We Collect',
    content: (
      <>
        <p>We may collect the following categories of information.</p>

        <SubSection label="A. Account and Profile Information">
          <p>We may collect information used to create, manage, and support user accounts, including:</p>
          <UL items={[
            'Name', 'Email address', 'Phone number', 'Company name', 'Role or title',
            'Login credentials', 'Account settings', 'Subscription or customer account information',
            'User permissions and access settings',
          ]} />
        </SubSection>

        <SubSection label="B. Business and Questionnaire Information">
          <p>The Platform collects information submitted through onboarding forms, questionnaires, prompts, workflows, surveys, or similar inputs. This may include information about:</p>
          <UL items={[
            "The customer's business", 'Target audience or ideal client', 'Products or services',
            'Offers', 'Brand positioning', 'Marketing goals', 'Customer stories', 'Sales process',
            'Funnel strategy', 'Advertising strategy', 'Communication preferences',
            'Brand colors or visual preferences', 'Market, niche, or audience information',
          ]} />
          <p className="mt-2">This information may be used to generate marketing content, scripts, funnel copy, emails, SMS sequences, ads, CRM workflows, or other Platform outputs.</p>
        </SubSection>

        <SubSection label="C. AI Inputs and Outputs">
          <p>The Platform may collect and process:</p>
          <UL items={[
            'Prompts', 'Questionnaire responses', 'Instructions',
            'Uploaded or entered business information', 'Generated marketing content',
            'Generated scripts', 'Generated email or SMS copy', 'Generated ad copy',
            'Generated funnel copy', 'Generated brand recommendations',
            'AI-generated recommendations, summaries, or outputs',
          ]} />
          <p className="mt-2">We refer to these collectively as "AI Content."</p>
        </SubSection>

        <SubSection label="D. CRM, Lead, and Contact Information">
          <p>Because TedOS includes access to CRM functionality, customers and users may enter, upload, generate, or manage information such as:</p>
          <UL items={[
            'Lead and prospect names', 'Email addresses', 'Phone numbers', 'Company names',
            'Tags, notes, tasks, and pipeline stages', 'Appointment and calendar information',
            'Call, email, and SMS history', 'Form submissions', 'Funnel activity',
            'Payment status or transaction-related information', 'Automation and workflow activity',
            'Customer relationship records', 'Lead source and attribution data',
            'Marketing campaign data',
          ]} />
          <p className="mt-2">Customers are responsible for ensuring that their collection and use of this information complies with applicable laws.</p>
        </SubSection>

        <SubSection label="E. Communications Information">
          <p>We may collect information when you communicate with us or through the Platform, including:</p>
          <UL items={[
            'Support requests', 'Emails', 'Chat messages', 'SMS messages',
            'Call logs or call metadata', 'Voicemails', 'Calendar confirmations',
            'Feedback', 'Survey responses', 'Communications with our team',
            'Communications sent through the Platform',
          ]} />
        </SubSection>

        <SubSection label="F. Payment and Billing Information">
          <p>TedOS uses NMI for payment processing and payment gateway functionality. Customers may also have the ability to use or connect other payment processors, gateways, or payment-related services supported by the Platform.</p>
          <p className="mt-2">Depending on how payments are configured, we or our payment processors may collect billing-related information such as:</p>
          <UL items={[
            'Billing name', 'Billing address', 'Payment method details', 'Subscription plan',
            'Transaction records', 'Invoices', 'Payment status', 'Payment gateway identifiers',
            'Refund, chargeback, or dispute-related information',
          ]} />
          <p className="mt-2">Payment card information is generally processed by third-party payment processors or gateways. TedOS does not intend to store full payment card numbers unless expressly stated otherwise.</p>
        </SubSection>

        <SubSection label="G. Technical, Usage, and Device Information">
          <p>We may automatically collect information about how users access and use the Platform, including:</p>
          <UL items={[
            'IP address', 'Device type', 'Browser type', 'Operating system', 'Login data',
            'Date and time of access', 'Pages, features, or workflows used', 'Session activity',
            'Error logs', 'Performance data', 'Referring URLs',
            'Approximate location based on IP address', 'Security and authentication events',
            'Usage volume', 'Feature activity', 'Automation activity',
          ]} />
        </SubSection>

        <SubSection label="H. Cookies, Pixels, and Tracking Technologies">
          <p>TedOS uses Meta Pixel and may use cookies, pixels, tags, scripts, analytics tools, and similar technologies to support advertising, analytics, retargeting, website functionality, Platform performance, and marketing measurement.</p>
          <p className="mt-2">Customers may also have the ability to use other tracking tools supported by the Platform, including tracking tools, pixels, scripts, or analytics providers available through GHL-supported functionality.</p>
          <p className="mt-2">These technologies may collect information such as:</p>
          <UL items={[
            'Website visits', 'Page views', 'Form submissions', 'Funnel activity',
            'Ad campaign attribution', 'Device and browser information', 'IP address',
            'Referral source', 'Conversion activity', 'Interactions with pages or ads',
          ]} />
          <p className="mt-2">Meta states that advertisers, app developers, publishers, and other partners can send Meta information through Meta Business Tools, including Meta Pixel.</p>
        </SubSection>
      </>
    ),
  },
  {
    id: 'how-we-use',
    number: 5,
    title: 'How We Use Information',
    content: (
      <>
        <p>We may use information for the following purposes:</p>
        <UL items={[
          'To provide, operate, maintain, and improve the Platform',
          'To create and manage user accounts',
          'To generate AI-powered marketing content and recommendations',
          'To provide CRM, funnel, calendar, automation, communication, and payment-related functionality',
          'To process questionnaire responses and Platform inputs',
          'To deliver customer support',
          'To send administrative, transactional, security, billing, and service-related communications',
          'To send email or SMS communications at the direction of customers or users',
          'To analyze Platform usage and improve user experience',
          'To monitor security, prevent abuse, and enforce our agreements',
          'To troubleshoot technical issues',
          'To personalize Platform workflows and outputs',
          'To process billing and payments',
          'To support advertising, analytics, attribution, and marketing',
          'To develop, test, improve, and optimize our products, systems, workflows, automations, prompts, models, and services',
          'To create aggregated, anonymized, or de-identified data',
          'To comply with legal obligations',
          'To protect the rights, safety, property, and security of TedOS, users, customers, and others',
          'To market TedOS products or services, where permitted by law',
        ]} />
      </>
    ),
  },
  {
    id: 'ai-features',
    number: 6,
    title: 'AI Features, Internal Improvement, and Model Training',
    content: (
      <>
        <p>TedOS uses artificial intelligence technology, including OpenAI and other service providers, to help generate marketing content, recommendations, scripts, funnel copy, email copy, SMS copy, ad copy, brand recommendations, CRM-related content, and other business outputs.</p>
        <p className="mt-3">When you submit information into AI-powered parts of the Platform, that information may be processed by TedOS and may be transmitted to third-party AI providers, infrastructure providers, CRM providers, or other service providers as necessary to provide, maintain, secure, support, test, and improve the Platform.</p>
        <p className="mt-3">Use of third-party AI services may be subject to the applicable provider's terms, policies, account settings, and data-processing commitments. TedOS may configure or use third-party AI services in a manner intended to support the Platform, but TedOS does not control all independent practices of third-party providers.</p>
        <p className="mt-3">TedOS may use, analyze, process, retain, transform, and derive insights from information submitted to, generated by, or collected through the Platform — including Customer Data, AI Content, prompts, questionnaire responses, CRM activity, communications metadata, funnel activity, usage data, and generated outputs — for purposes including:</p>
        <UL items={[
          'Operating and providing the Platform',
          'Generating, improving, and personalizing Platform outputs',
          'Developing, testing, maintaining, and improving TedOS products, services, prompts, workflows, automations, recommendations, quality-control systems, and internal models',
          'Improving accuracy, relevance, performance, reliability, safety, abuse prevention, and user experience',
          'Debugging, troubleshooting, security monitoring, fraud prevention, and compliance enforcement',
          'Creating aggregated, anonymized, de-identified, or derived data',
          'Analytics, benchmarking, research, reporting, and business intelligence',
          'Developing new features, products, services, systems, or commercial offerings',
        ]} />
        <p className="mt-3">TedOS may use aggregated, anonymized, de-identified, or derived data without restriction, provided such data does not identify a specific individual or customer in a manner prohibited by applicable law or a written agreement between TedOS and the customer.</p>
        <p className="mt-3">Customer Data and AI Content may be used by TedOS for internal product improvement, system optimization, quality assurance, model improvement, prompt improvement, automation improvement, and related business purposes, unless a separate written agreement expressly limits such use.</p>
        <p className="mt-3">TedOS does not claim ownership of Customer Data merely because it is submitted to the Platform. However, customers and users grant TedOS the rights and permissions necessary to host, process, transmit, reproduce, display, analyze, modify, create derivative technical data from, and otherwise use such information as necessary or appropriate to provide, maintain, improve, secure, and develop the Platform and related services.</p>
        <p className="mt-3">Users are responsible for reviewing and approving all AI-generated content before using it in advertising, marketing, sales, customer communications, legal communications, financial communications, professional advice, or other business activities. AI outputs may be inaccurate, incomplete, unsuitable, or inconsistent.</p>
        <p className="mt-3">Users should not submit sensitive personal information, regulated information, protected health information, financial account credentials, government identification numbers, or other highly sensitive data into AI prompts unless they are authorized to do so and the applicable use is lawful and appropriate.</p>
      </>
    ),
  },
  {
    id: 'crm-providers',
    number: 7,
    title: 'CRM and White-Labeled Technology Providers',
    content: (
      <>
        <p>TedOS uses a white-labeled version of GoHighLevel/HighLevel or related technology to provide CRM, funnel, automation, calendar, communication, and related functionality.</p>
        <p className="mt-3">This means certain data entered into or generated through the Platform may be processed by HighLevel/GHL-related systems and service providers for purposes such as:</p>
        <UL items={[
          'Hosting and storage', 'CRM functionality', 'Funnel functionality',
          'Workflow automation', 'Lead management', 'Calendar booking',
          'Email sending', 'SMS sending', 'Calling functionality',
          'Payment integrations', 'Customer support', 'Analytics and reporting',
          'Technical operations',
        ]} />
        <p className="mt-3">HighLevel's public privacy policy describes its use of reasonable administrative, technical, and organizational security measures to protect personal information, and HighLevel's privacy guidance states that customers using the HighLevel platform remain responsible for understanding and complying with privacy obligations that may apply to their own use.</p>
      </>
    ),
  },
  {
    id: 'communications',
    number: 8,
    title: 'Email, SMS, Calls, and Communications Tools',
    content: (
      <>
        <p>The Platform may allow customers and users to send or manage emails, SMS messages, calls, voicemails, appointment reminders, confirmation messages, follow-up sequences, nurture campaigns, and other communications.</p>
        <p className="mt-3">Texts, emails, and calls may be sent through GHL-native providers or other supported providers. Customers may also have the option to connect their own dedicated email sending service or other supported communications tools.</p>
        <p className="mt-3">Customers and users are responsible for ensuring that all communications sent through the Platform comply with applicable laws, including laws relating to:</p>
        <UL items={[
          'Email marketing', 'SMS marketing', 'Telemarketing', 'Consent', 'Opt-outs',
          'Call recording', 'Autodialing', 'Do-not-call rules', 'Consumer protection',
          'Advertising claims', 'Data privacy',
        ]} />
        <p className="mt-3">Where required, customers and users must obtain appropriate consent before sending marketing emails, SMS messages, automated messages, calls, or other communications.</p>
        <p className="mt-3">Recipients may opt out of SMS messages by replying with standard opt-out language such as "STOP," where supported. Email recipients may use unsubscribe links where available.</p>
        <p className="mt-3">TedOS may process communication-related data to provide the Platform, transmit messages, maintain records, troubleshoot issues, support deliverability, comply with legal requirements, and enforce applicable agreements.</p>
      </>
    ),
  },
  {
    id: 'tracking',
    number: 9,
    title: 'Tracking, Advertising, and Customer-Installed Pixels',
    content: (
      <>
        <p>TedOS uses Meta Pixel and may use other analytics, advertising, attribution, retargeting, or tracking technologies in connection with its own websites, advertising campaigns, and marketing activities.</p>
        <p className="mt-3">Customers may also have the ability to install or use their own pixels, tracking codes, analytics tools, advertising tools, or similar technologies through Platform-supported functionality.</p>
        <p className="mt-3">Customers are responsible for:</p>
        <UL items={[
          'Providing appropriate privacy notices on their own pages and funnels',
          'Obtaining any required consent for cookies, pixels, tracking, analytics, and advertising',
          'Configuring tracking tools lawfully',
          'Complying with platform terms from Meta, Google, TikTok, or other advertising providers',
          'Honoring opt-outs where required',
          'Ensuring that sensitive, regulated, or prohibited data is not sent to advertising platforms in violation of applicable laws or platform terms',
        ]} />
      </>
    ),
  },
  {
    id: 'how-we-share',
    number: 10,
    title: 'How We Share Information',
    content: (
      <>
        <p>We may share information with the following categories of recipients.</p>

        <SubSection label="A. Service Providers">
          <p>We may share information with vendors and service providers who help us operate the Platform, including:</p>
          <UL items={[
            'Hosting providers', 'Cloud infrastructure providers', 'CRM technology providers',
            'AI providers', 'Payment processors and gateways, including NMI', 'Email providers',
            'SMS providers', 'Calling providers', 'Analytics providers',
            'Advertising and tracking providers', 'Customer support tools', 'Security providers',
            'Professional advisors', 'Contractors and technical service providers',
          ]} />
          <p className="mt-2">These providers may process information as necessary to provide services to us or as otherwise permitted by applicable agreements and law.</p>
        </SubSection>

        <SubSection label="B. Customer Administrators">
          <p>If your account is associated with a customer organization, administrators or authorized representatives of that organization may be able to access, manage, export, delete, or control information associated with your use of the Platform.</p>
        </SubSection>

        <SubSection label="C. Third-Party Integrations">
          <p>If a customer or user connects third-party tools, payment processors, calendars, email services, tracking tools, advertising accounts, or other integrations to the Platform, information may be shared with those third parties as directed by the customer or user.</p>
        </SubSection>

        <SubSection label="D. Legal, Compliance, and Safety">
          <p>We may disclose information where we believe it is necessary or appropriate to:</p>
          <UL items={[
            'Comply with applicable law, regulation, subpoena, court order, or legal process',
            'Respond to lawful requests from public authorities',
            'Enforce our agreements',
            'Protect the security or integrity of the Platform',
            'Prevent fraud, abuse, or illegal activity',
            'Protect the rights, safety, or property of TedOS, users, customers, or others',
          ]} />
        </SubSection>

        <SubSection label="E. Business Transfers">
          <p>If TedOS is involved in a merger, acquisition, financing, reorganization, sale of assets, bankruptcy, or similar transaction, information may be transferred or disclosed as part of that transaction.</p>
        </SubSection>

        <SubSection label="F. With Consent or Direction">
          <p>We may share information with third parties when you or the applicable customer directs us to do so, including through integrations, payment tools, connected accounts, tracking tools, or communications workflows.</p>
        </SubSection>
      </>
    ),
  },
  {
    id: 'customer-responsibilities',
    number: 11,
    title: 'Customer Responsibilities',
    content: (
      <>
        <p>Customers are responsible for:</p>
        <UL items={[
          'Providing legally required notices to their own leads, prospects, clients, contacts, and users',
          'Obtaining required consents for marketing, email, SMS, calling, tracking, payment processing, and data processing',
          'Ensuring Customer Data submitted to the Platform was lawfully collected',
          'Reviewing AI-generated content before use',
          'Maintaining accurate account and contact information',
          "Managing their own users' access permissions",
          "Responding to privacy requests from individuals whose data they control, unless TedOS is legally responsible for the request",
          'Complying with applicable advertising, marketing, privacy, consumer protection, telemarketing, SMS, email, payment, and communications laws',
          'Ensuring their own funnels, web pages, forms, calendars, tracking tools, and communications comply with applicable law',
        ]} />
      </>
    ),
  },
  {
    id: 'marketing-communications',
    number: 12,
    title: 'Marketing Communications from TedOS',
    content: (
      <>
        <p>We may use contact information to send marketing communications about TedOS products, services, events, offers, updates, and educational content.</p>
        <p className="mt-3">You may opt out of marketing emails by following the unsubscribe instructions in the email or contacting us at <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">support@tedmcgrathbrands.com</a>.</p>
        <p className="mt-3">Even if you opt out of marketing communications, we may still send transactional, administrative, security, billing, support, or service-related messages.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    number: 13,
    title: 'Cookies and Advertising Technologies',
    content: (
      <>
        <p>We may use cookies and similar technologies for analytics, performance, personalization, security, advertising, attribution, and remarketing.</p>
        <p className="mt-3">You may be able to control cookies through your browser settings. Disabling cookies may affect the functionality of certain websites or Platform features.</p>
        <p className="mt-3">Some third-party advertising networks and analytics providers may offer their own opt-out tools. Depending on applicable law, we may provide additional cookie notices, consent tools, or opt-out mechanisms.</p>
      </>
    ),
  },
  {
    id: 'data-security',
    number: 14,
    title: 'Data Security',
    content: (
      <>
        <p>We use reasonable administrative, technical, and organizational safeguards designed to protect information from unauthorized access, loss, misuse, alteration, or disclosure.</p>
        <p className="mt-3">However, no software platform, internet transmission, cloud system, AI system, CRM, payment system, or electronic storage method is completely secure. We cannot guarantee absolute security.</p>
        <p className="mt-3">Users are responsible for maintaining the confidentiality of their login credentials and for all activity occurring under their accounts. The TedOS EULA also requires users to maintain credential confidentiality and limits access to authorized users within the customer's organization.</p>
      </>
    ),
  },
  {
    id: 'data-retention',
    number: 15,
    title: 'Data Retention',
    content: (
      <>
        <p>We retain information for as long as reasonably necessary to provide the Platform, comply with legal obligations, resolve disputes, enforce agreements, support business operations, maintain security, improve the Platform, and fulfill the purposes described in this Privacy Policy.</p>
        <p className="mt-3">Retention periods may vary depending on:</p>
        <UL items={[
          'The type of information',
          "The customer's subscription status",
          'Contractual requirements',
          'Legal, tax, accounting, or compliance obligations',
          'Backup and disaster recovery practices',
          'Security and fraud-prevention needs',
          'Product improvement and system optimization needs',
          'Whether the information is Customer Data controlled by a customer',
        ]} />
        <p className="mt-3">We may retain de-identified, aggregated, or anonymized information for business, analytics, product improvement, research, benchmarking, system optimization, model improvement, or similar purposes where permitted by law.</p>
      </>
    ),
  },
  {
    id: 'international',
    number: 16,
    title: 'International Users and Data Transfers',
    content: (
      <>
        <p>TedOS is based in the United States. If you access or use the Platform from outside the United States, your information may be processed and stored in the United States or other jurisdictions where we or our service providers operate.</p>
        <p className="mt-3">These jurisdictions may have data protection laws that differ from those in your location. Where required, we use appropriate legal mechanisms for international data transfers.</p>
      </>
    ),
  },
  {
    id: 'privacy-rights',
    number: 17,
    title: 'Privacy Rights',
    content: (
      <>
        <p>Depending on your location and applicable law, you may have rights regarding your personal information, such as the right to:</p>
        <UL items={[
          'Request access to personal information',
          'Request correction of inaccurate information',
          'Request deletion of personal information',
          'Request a copy of personal information',
          'Object to or restrict certain processing',
          'Withdraw consent where processing is based on consent',
          'Opt out of certain marketing communications',
          'Opt out of certain sales, sharing, targeted advertising, or profiling where applicable',
        ]} />
        <p className="mt-3">To exercise privacy rights, contact us at <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">support@tedmcgrathbrands.com</a>.</p>
        <p className="mt-3">If your information was submitted to the Platform by one of our customers, we may direct your request to that customer or process the request on that customer's behalf, depending on the circumstances and applicable law.</p>
        <p className="mt-3">We may need to verify your identity before fulfilling certain requests.</p>
      </>
    ),
  },
  {
    id: 'california-rights',
    number: 18,
    title: 'California and U.S. State Privacy Rights',
    content: (
      <>
        <p>Certain U.S. state privacy laws, including the California Consumer Privacy Act as amended, may provide residents with specific rights regarding personal information.</p>
        <p className="mt-3">Depending on whether TedOS is subject to a particular state privacy law and depending on the nature of the information involved, eligible individuals may have rights to know, access, correct, delete, or obtain a copy of personal information, and to opt out of certain uses such as sale, sharing, targeted advertising, or profiling.</p>
        <p className="mt-3">TedOS does not intend to sell personal information in the traditional sense of exchanging it for money. However, some analytics, advertising, tracking, retargeting, or pixel-related activities may be considered "sharing," "targeted advertising," or similar regulated activity under certain privacy laws.</p>
        <p className="mt-3">To submit a request, contact <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">support@tedmcgrathbrands.com</a>.</p>
      </>
    ),
  },
  {
    id: 'sensitive-pii',
    number: 19,
    title: 'Sensitive Personal Information',
    content: (
      <>
        <p>TedOS is not designed to collect sensitive personal information unless a customer or user chooses to submit it.</p>
        <p className="mt-3">Sensitive personal information may include information such as:</p>
        <UL items={[
          'Government identification numbers', 'Financial account credentials', 'Precise geolocation',
          'Health information', 'Biometric information', 'Racial or ethnic origin',
          'Religious beliefs', 'Sexual orientation', 'Union membership', 'Criminal history',
          'Other legally protected or regulated categories',
        ]} />
        <p className="mt-3">Users should not submit sensitive personal information into the Platform unless they have authority to do so and the applicable use is lawful and appropriate.</p>
      </>
    ),
  },
  {
    id: 'childrens-privacy',
    number: 20,
    title: "Children's Privacy",
    content: (
      <>
        <p>The Platform is intended for business and commercial use and is not directed to children.</p>
        <p className="mt-3">We do not knowingly collect personal information from children under 13. We do not intend for individuals under 18 to use the Platform without appropriate authorization and supervision.</p>
        <p className="mt-3">If we learn that we have collected personal information from a child in violation of applicable law, we will take appropriate steps to delete it.</p>
      </>
    ),
  },
  {
    id: 'third-party-links',
    number: 21,
    title: 'Third-Party Links and Integrations',
    content: (
      <>
        <p>The Platform may include links to third-party websites, applications, tools, payment processors, calendar services, communication providers, advertising platforms, or integrations.</p>
        <p className="mt-3">We are not responsible for the privacy practices of third parties. Your use of third-party services may be governed by their own privacy policies and terms.</p>
      </>
    ),
  },
  {
    id: 'policy-changes',
    number: 22,
    title: 'Changes to This Privacy Policy',
    content: (
      <>
        <p>We may update this Privacy Policy from time to time.</p>
        <p className="mt-3">When we make material changes, we may notify users by posting the updated policy on our website, within the Platform, by email, or through other reasonable means.</p>
        <p className="mt-3">Your continued use of the Platform after an updated Privacy Policy becomes effective means you acknowledge the updated policy.</p>
      </>
    ),
  },
  {
    id: 'contact',
    number: 23,
    title: 'Contact Information',
    content: (
      <>
        <p>If you have questions about this Privacy Policy or wish to exercise privacy rights, contact us at:</p>
        <div className="mt-4 pl-4 border-l-2 border-[#00E5FF]/20 space-y-1">
          <p className="text-[#9CB3C5] font-medium">TedOS Inc.</p>
          <p>Email: <a href="mailto:support@tedmcgrathbrands.com" className="text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors">support@tedmcgrathbrands.com</a></p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="This Privacy Policy explains how TedOS Inc. collects, uses, shares, protects, and retains information in connection with the TedOS™ software platform and related services."
      effectiveDate="January 1, 2026"
      lastUpdated="January 1, 2026"
      sections={sections}
    />
  );
}
