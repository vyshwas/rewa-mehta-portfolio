export type ProjectSectionImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ProjectSection = {
  title: string;
  text: string;
  images?: ProjectSectionImage[];
};

export type Project = {
  id: string;
  title: string;
  category: string;
  discipline: 'Product' | 'Research' | 'Visual';
  year: string;
  tools: string[];
  team: string;
  context: string;
  image: string | null;
  poster?: string;
  intro: string;
  challenge: string;
  response: string;
  forHiring: string;
  forFounders: string;
  facts: string[];
  sections: ProjectSection[];
  flow: [string, string, string, string];
  link?: string;
};

export const featuredProject: Project = {
  id: 'neonatal',
  title: 'Real-Time Neonatal Care Monitoring',
  category: 'Clinical UX / Doctor Dashboard',
  discipline: 'Product',
  year: '2025',
  tools: ['Figma'],
  team: 'Solo (Rewa Mehta)',
  context: 'NICU clinical workflow research and centralized real-time dashboard design to reduce alarm fatigue and improve infant care coordination.',
  image: '/assets/projects/behance/neonatal-macbook.webp',
  poster: '/assets/projects/behance/neonatal-macbook.webp',
  intro: 'Centralized real-time monitoring and smart triage for high-stakes neonatal intensive care units.',
  challenge: 'In fast-paced NICUs, doctors must manage multiple critical infants simultaneously while vitals are recorded manually or fragmented across bedside sensors. Delayed caregiver updates and high false-alarm rates cause cognitive fatigue and risk missed early warnings.',
  response: 'Designed "neonatalcare" — a dual-sided ecosystem combining a caregiver mobile logging app with a centralized doctor dashboard. Tracks 5 vital parameters (HR, RR, SpO2, feeding, temp) with color-coded triage (Critical, Warning, Stable), intelligent alert feeds, and a 10-screen Figma interactive prototype.',
  forHiring: 'Demonstrates end-to-end clinical UX research, complex data visualization, and high-density dashboard information architecture crafted to minimize alarm fatigue in high-stress medical environments.',
  forFounders: 'Turns scattered bedside monitors and handwritten logs into one view a doctor can read at a glance, with alerts sorted by how urgent they are.',
  facts: [
    'Researched NICU workflow and clinical roles (personas: Dr. Ananya Sharma, Nurse Priya Mehta)',
    'Benchmarked market leaders: Philips, GE Healthcare, Dräger, Medtronic, Masimo, Mindray, Nihon Kohden',
    'Identified 3 core system limits: wired-sensor tethering, fragmented data silos, and clinical alarm fatigue',
    'Defined 5 core monitoring parameters: Heart Rate (bpm), Respiratory Rate (/min), SpO2 (%), Feeding (ml), Temperature (°C)',
    'Information Architecture structured into Infant Overview, Daily Summary KPI tiles, and Severity-tagged Alert Panel',
    'Interactive Figma prototype across 10 dashboard screens with sample state (12 infants: 2 critical, 8 stable, 15 alerts logged)'
  ],
  sections: [
    {
      title: 'Doctors & Nurses Clinical Need Analysis',
      text: 'NICU physicians coordinate care and make high-stakes decisions from fragmented clinical data, while bedside nurses manage frequent manual documentation under constant interruption. Research identified an urgent need for automated, centralized triage that aggregates scattered vitals and delivers smart, non-intrusive alert notifications.',
      images: [
        {
          src: '/assets/projects/behance/neonatal-needs.webp',
          alt: 'Doctors Needs, Challenges and Pain Points diagram',
          caption: 'Clinical research findings: Responsibilities, Challenges, Pain Points, and Expectations for NICU doctors'
        }
      ]
    },
    {
      title: 'Information Architecture & Parameter Hierarchy',
      text: 'Structured the clinician workstation into three distinct functional layers: Infant Overview (bedroom, live camera feed, vitals, and last-updated timestamp), Daily Summary (total infants, critical cases, stable infants), and a real-time Alert Panel categorized by alert type (Low SpO2, Apnea, Fever).',
      images: [
        {
          src: '/assets/projects/behance/neonatal-ia.webp',
          alt: 'Neonatal Care Information Architecture diagram',
          caption: 'System Information Architecture mapping Home Dashboard, Infant Overview, Daily Summary, and Alert hierarchy'
        }
      ]
    },
    {
      title: 'Figma Interactive Prototype Wireflow',
      text: 'Linked 10 Figma dashboard screens into one clickable flow, so a doctor can move from the ward summary to a single infant\'s vitals, live feed and alerts and back again.',
      images: [
        {
          src: '/assets/projects/behance/neonatal-flow.webp',
          alt: 'Figma Interactive Prototype Flow across 10 screens',
          caption: 'Interactive prototype wireflow linking infant ward cards, live video modals, and alert drill-downs'
        }
      ]
    },
    {
      title: 'High-Fidelity Workstation UI',
      text: 'The final interface utilizes soft lavender tones and high-contrast status pills to keep vital telemetry legible at a glance. Active monitoring cards surface live camera feeds alongside numerical vitals, ensuring urgent cases are immediately distinguishable from stable beds.',
      images: [
        {
          src: '/assets/projects/behance/neonatal-imac.webp',
          alt: 'Neonatal Care Doctor Dashboard UI on iMac workstation',
          caption: 'Doctor dashboard with infant cards, alerts and live nursery feeds (sample data)'
        }
      ]
    }
  ],
  flow: ['NICU Workflow Research', 'Parameter Definition', 'System Architecture', 'Hi-Fi Clinical UI'],
  link: 'https://www.behance.net/gallery/240404431/Real-Time-Neonatal-Care-Monitoring-Doctors-Dashboard'
};

export const projects: Project[] = [
  {
    id: 'manjha',
    title: 'Manjha AI',
    category: 'AI Product / Matrimony UX',
    discipline: 'Product',
    year: '2025',
    tools: ['Figma', 'Photoshop'],
    team: 'Team of 4 (Suraj Mourya, Soumya Choudhary, Rewa Mehta, Princy Yadav)',
    context: '1-week design sprint addressing conversational drop-off, decision anxiety, and trust in Indian matrimony applications.',
    image: '/assets/projects/behance/manjha-cover.webp',
    intro: 'Talk smarter. Connect deeper: an AI conversation-assistance layer for culturally nuanced matrimony apps.',
    challenge: 'Matrimony chats in India frequently stall after the initial message due to decision anxiety, overly formal/dry tones, and fear of misinterpretation. Users experience emotional fatigue and struggle to express genuine personality while staying culturally respectful.',
    response: 'Manjha AI introduces a privacy-first companion layer: a Gamified Persona Builder that analyzes initial interactions to build a communication profile, real-time respectful reply suggestions, and a vibe-compatibility score (e.g., 87%) paired with mandatory Aadhaar & Video KYC.',
    forHiring: 'Exhibits structured product strategy: 10 AI concepts evaluated across a 6-criteria scoring matrix, competitor benchmarking, and verified user-consent flows.',
    forFounders: 'Targets the exact moment matrimony matches go cold, the reply after "hi", with AI help users have to opt into and can switch off.',
    facts: [
      'Benchmarked Shaadi.com, Aisle, Bharat Matrimony, Jeevansathi, Elite, and Betterhalf.ai',
      '10 AI directions evaluated across Desirability, Feasibility, Scalability, Group Interest, Ethical Acceptability, and Learning Impact',
      'Top-ranked directions: Conversation Coach (54 pts), Compatibility Analyzer (52 pts), Gamified Persona Builder (51 pts)',
      'Privacy controls: user can pause, reset, delete history, or turn off AI assistance at any time',
      'Dual verification: Aadhaar KYC and video KYC to cut down fake profiles'
    ],
    sections: [
      {
        title: 'User Pain Points in Matrimony Chats',
        text: 'Qualitative analysis exposed consistent psychological bottlenecks: chats felt too dry or formal, users suffered from conversational paralysis after greeting, and fear of judgment prevented genuine self-expression.',
        images: [
          {
            src: '/assets/projects/behance/manjha-painpoints.webp',
            alt: 'Pain points in Indian matrimony chats',
            caption: 'Core user friction: formal tone, decision anxiety, emotional fatigue, and lost momentum'
          }
        ]
      },
      {
        title: 'Competitive Feature Benchmarking',
        text: 'Compared leading Indian matrimony platforms against emerging social dating apps. While incumbent platforms focus on traditional caste and horoscope filters, none offered conversational assistance or gamified communication coaching.',
        images: [
          {
            src: '/assets/projects/behance/manjha-competitors.webp',
            alt: 'Competitor Analysis table across Indian matrimony platforms',
            caption: 'Benchmarking Shaadi.com, Aisle, Bharat Matrimony, Jeevansathi, Elite, and Betterhalf'
          }
        ]
      },
      {
        title: 'Concept Prioritization Scoring Matrix',
        text: 'To select the most viable AI features within a 1-week sprint, 10 feature flows were scored across desirability, technical feasibility, scalability, group interest, ethics, and learning impact.',
        images: [
          {
            src: '/assets/projects/behance/manjha-scoring.webp',
            alt: 'Scoring Matrix evaluating 10 AI feature concepts',
            caption: 'Multi-criteria scoring matrix identifying the top 3 AI implementation priorities'
          }
        ]
      },
      {
        title: 'Gamified Persona & In-Chat Coaching Screens',
        text: 'The Gamified Persona Builder learns communication styles over the first 10 chats, unlocking vibe levels and badges while suggesting culturally attuned icebreakers and real-time response prompts.',
        images: [
          {
            src: '/assets/projects/behance/manjha-phones.webp',
            alt: 'Manjha AI mobile interface screens',
            caption: 'Persona Builder onboarding and real-time AI conversation coaching screens'
          }
        ]
      }
    ],
    flow: ['Pain Discovery', 'Matrix Scoring', 'Consent Architecture', 'Coach Interface'],
    link: 'https://www.behance.net/gallery/239610799/Manjha-AI-A-conversational-coach-Matrimony-App'
  },
  {
    id: 'leaflet',
    title: 'Leaflet',
    category: 'Mobile UX / Habit Building',
    discipline: 'Product',
    year: '2025',
    tools: ['Figma', 'Canva'],
    team: 'Solo (Rewa Mehta — NIFT M.Des MD/24/395)',
    context: 'Academic UX research and interaction design addressing digital attention spans and guilt-free reading consistency.',
    image: '/assets/projects/behance/leaflet-cover.webp',
    intro: 'Making reading light, focused, and social through bite-sized visual reads and live silent rooms.',
    challenge: 'Digital natives aspire to read regularly but battle shrinking attention spans (average 8.25s) and consistency hurdles: 60–70% of readers abandon books halfway, and 82% set reading goals while only 45% achieve them (Goodreads survey), resulting in guilt, shame, and app abandonment.',
    response: 'Leaflet combines digestible daily micro-reads with an AI-powered physical book page scanner that generates illustrated comic panels, proximity-based silent reading rooms, and compassionate streak monitors that prevent guilt-driven drop-off.',
    forHiring: 'A solo project from research to screens: secondary research, a problem-to-solution map, positioning against Goodreads, Blinkist and Headway, and full mobile flows.',
    forFounders: 'Designed around why reading apps get deleted: guilt over unmet goals. Small daily reads and quiet shared rooms replace the streak that shames you.',
    facts: [
      'Secondary research benchmarks: 60-70% unfinished book rate; attention span drop to 8.25s; 1 in 4 apps deleted after one use',
      'Goodreads survey data: 82% set yearly reading goals, only 45% finish — leading to shame avoidance cycles',
      'Competitor audit vs Goodreads, Blinkist, and Headway — Leaflet uniquely offers AI illustrated panels, silent rooms, and micro-reflections',
      'Nature-inspired palette: forest green (#013236, #4CA771), soft mint (#E8F9E6, #A3CD9D), and floral accent pink',
      'NIFT New Delhi M.Des Project (Assignment 2, ID: MD/24/395)'
    ],
    sections: [
      {
        title: 'Problem-Solution Architecture',
        text: 'Mapped 4 core psychological barriers (lack of focus, tracking without habit-building, sensory isolation, and guilt) to dedicated product mechanisms: bite-sized daily reads, AI visual panels, silent social rooms, and micro-reflections.',
        images: [
          {
            src: '/assets/projects/behance/leaflet-problem-solution.webp',
            alt: 'Leaflet Problem and Solution mapping table',
            caption: 'Translating behavioral reading obstacles into targeted interaction features'
          }
        ]
      },
      {
        title: 'AI Physical Book Scanning to Illustrated Panels',
        text: 'Readers can photograph any physical book page; Leaflet uses AI text analysis to convert dense prose into illustrated comic panels with key highlighted takeaways, lowering cognitive reading barriers.',
        images: [
          {
            src: '/assets/projects/behance/leaflet-ai-scanner.webp',
            alt: 'AI-Powered Book Scanner and Illustrated Reading Screen',
            caption: 'Camera page scanner converting physical text into illustrated micro-reading panels'
          }
        ]
      },
      {
        title: 'Explore, Habit Rings & Silent Reading Rooms',
        text: 'The exploration feed offers free curated book extracts by mood, while the live silent reading room surfaces nearby readers ("3 around you") to create gentle social accountability without chatter.',
        images: [
          {
            src: '/assets/projects/behance/leaflet-explore.webp',
            alt: 'Leaflet Explore page and Discover feed',
            caption: 'Discovery catalog and live silent reading room proximity radar'
          }
        ]
      }
    ],
    flow: ['Attention Research', 'Competitor Audit', 'Feature Framework', 'Interactive App UI'],
    link: 'https://www.behance.net/gallery/238351011/Leaflet-UXUI-Research-and-Design'
  },
  {
    id: 'dating',
    title: 'Swipe. Match. Ghost. Scam?',
    category: 'UX Research / Trust & Safety in Dating',
    discipline: 'Research',
    year: '2025',
    tools: ['Figma', 'Google Docs', 'Google Forms'],
    team: 'Team of 2 (Itika Kumar & Rewa Mehta)',
    context: 'Qualitative UX research study investigating psychological safety, catfishing, and fraud vectors on Indian dating platforms.',
    image: '/assets/projects/behance/dating-cover.webp',
    intro: 'Designing for trust, emotional security, and fraud prevention in Indian dating applications.',
    challenge: 'India represents 15.7% of global Bumble traffic (50M active users), yet faces massive trust deficits: a skewed 70:30 male-to-female ratio, ~50% fake profiles/catfishing, widespread deception (41%), extortion scams, and chronic ghosting that severely impacts user self-esteem.',
    response: 'Conducted literature reviews, contextual inquiry of live swiping sessions, and thematic analysis across 60 qualitative survey respondents. Formulated 6 trust-centered design solutions: 2-step ID verification, automated scam alerts, quick reporting, education hubs, safe messaging scanners, and AI scam detection.',
    forHiring: 'Exemplifies rigorous qualitative methodology: thematic analysis across 60 respondents, behavioral observation during live contextual inquiry, and translating vulnerability into system-level safety architecture.',
    forFounders: 'Actionable design playbook for social and matchmaking apps to restore trust and improve female user retention in high-fraud emerging markets.',
    facts: [
      'Market data: India is 15.7% of Bumble global traffic with 50M active users in 2025; over half of women in Delhi & Mumbai meet partners via apps',
      'Gender imbalance: 70:30 male-to-female user ratio drives intense caution among female users',
      'Top 5 fraud categories: catfishing, extortion/blackmail, phishing links, romance scams, crypto/investment fraud',
      '3 distinct personas framed: Karan (27, Burnt-Out Believer), Aanya (22, Cautious Explorer), Ritika (25, Disillusioned Quitter)',
      '6 system design proposals: 2-Step Verified Profiles, Scam Alerts, Quick Reporting, Education Hub, Safe Messaging, AI Scam Detection'
    ],
    sections: [
      {
        title: 'Macro Market Context & Fraud Vectors',
        text: 'Set the fast growth of dating apps in India against the trust problem: an estimated 50% fake profiles, a 70:30 gender split, and five recurring kinds of fraud, from catfishing to crypto scams.',
        images: [
          {
            src: '/assets/projects/behance/dating-stats.webp',
            alt: 'Context stats on Indian dating app market and trust vulnerabilities',
            caption: 'Ecosystem statistics: 15.7% Bumble traffic, 50M users, and top 5 fraud types'
          }
        ]
      },
      {
        title: 'Contextual Inquiry & How Might We',
        text: 'Observed real user sessions to understand micro-decisions: instant skips on shirtless gym pictures, trust signals from shared literary/music tastes, and immediate suspicion when matches ask for WhatsApp or Instagram off-platform.',
        images: [
          {
            src: '/assets/projects/behance/dating-hmw.webp',
            alt: 'Key takeaways and How Might We problem statement',
            caption: 'Four key discovery questions and the core HMW trust-centered framing'
          }
        ]
      },
      {
        title: 'Six Trust-Centered System Interventions',
        text: 'Structured 6 preventative design solutions with direct user benefits, from proactive AI scam flags and verified badges to educational safety tips and post-date verification check-ins.',
        images: [
          {
            src: '/assets/projects/behance/dating-solutions.webp',
            alt: 'Six design solutions for trust and safety in dating apps',
            caption: '6 actionable solutions: Verified Profiles, Scam Alerts, Quick Reporting, Safe Messaging, AI Detection'
          }
        ]
      }
    ],
    flow: ['Contextual Inquiry', 'Thematic Coding', 'Persona Formulation', 'Safety Architecture'],
    link: 'https://www.behance.net/gallery/226150187/UX-Research-on-Dating-Apps'
  },
  {
    id: 'upsc',
    title: 'Survival of the Fittest',
    category: 'Systems Design / Sustainability Thinking',
    discipline: 'Research',
    year: '2025',
    tools: ['Figma', 'Procreate'],
    team: 'Team of 6 (Lisha Batra, Swagat Mohapatra, Vangogh, Desingh Paal, Rewa Mehta, Suraj Mourya)',
    context: 'Systems-level field investigation of Delhi’s Old Rajinder Nagar coaching hub following the tragic 2024 basement flooding incident.',
    image: '/assets/projects/behance/upsc-cover.webp',
    intro: 'Unraveling the unsustainable pressures and systemic traps faced by civil-service aspirants in Delhi.',
    challenge: 'Over 1.5 lakh aspirants migrate to Old Rajinder Nagar annually competing for 800–1000 final UPSC vacancies (0.07% success rate). Students endure 10–14 hours of study daily for ~4 years with ₹30–35k monthly expenses, hazardous basement libraries, and zero institutional alternatives if they fail.',
    response: 'Applied systems-thinking frameworks (Input-Throughput-Output matrix, Stellar Structure, and Causal Loop Diagramming) to expose vicious market cycles. Formulated 3 systemic interventions: degree equivalency for prelims/mains qualifiers, a part-time job exchange, and an "Online Rajinder Nagar" virtual learning ecosystem.',
    forHiring: 'Demonstrates macro systems analysis, field interview synthesis across 6 human domains, and causal loop mapping to unpack complex institutional and policy failures.',
    forFounders: 'Exposes how to identify unsustainable market loops, incentive distortions, and regulatory vacuums to design viable edtech and community alternatives.',
    facts: [
      'Funnel statistics: ~12 lakh applicants -> ~6 lakh appear -> 10,000 clear prelims -> 800-1000 final selections (0.07% success rate)',
      'Coaching economy: ₹58,000 Crore industry; ~1.5 lakh students arrive in Delhi yearly with ~4 years average preparation time',
      'Field interviews across 6 domains: study conditions, food quality, accommodation, financial drain, mental health, and family dynamics',
      'Systems methodologies: Input-Throughput-Output (15 factors each), Stellar Structure (atmosphere to core beliefs), and Causal Loop Diagram',
      '3 proposed interventions: Degree certificates for qualifiers, flexible part-time job app, and virtual Rajinder Nagar metaverse'
    ],
    sections: [
      {
        title: 'The UPSC Nebula: The 0.07% Funnel',
        text: 'Mapped the astronomical funnel of civil service examinations in India, highlighting regional aspiration patterns and the immense concentration of resources into an exam where 99.93% of participants do not make the final list.',
        images: [
          {
            src: '/assets/projects/behance/upsc-nebula.webp',
            alt: 'Navigating the UPSC Nebula infographic',
            caption: 'Macro funnel analysis: 12 lakh applicants, 3 examination phases, and 0.07% final success rate'
          }
        ]
      },
      {
        title: 'Stellar Structure & Causal Loop Diagram',
        text: 'Modeled the coaching ecosystem through the Stellar Structure (visible dropout rates -> recurring migration behaviors -> profit-driven coaching monopolies -> core cultural beliefs) and a Causal Loop Diagram showing the self-reinforcing debt and anxiety cycle.',
        images: [
          {
            src: '/assets/projects/behance/upsc-causal.webp',
            alt: 'Stellar Structure and Causal Loop Diagram for Old Rajinder Nagar',
            caption: 'Systemic feedback loops connecting coaching fees, student debt, living hazards, and competition'
          }
        ]
      },
      {
        title: 'Three Structural Systemic Interventions',
        text: 'Framed 3 pragmatic interventions targeting the absence of exit ramps: accredited professional degree certifications for candidates clearing prelims/mains, a verified part-time job matching platform for aspirants, and an Online Rajinder Nagar virtual community.',
        images: [
          {
            src: '/assets/projects/behance/upsc-solutions.webp',
            alt: 'Three proposed solutions for UPSC aspirants',
            caption: 'Interventions: Degree certifications, flexible part-time work platform, and virtual Rajinder Nagar'
          }
        ]
      }
    ],
    flow: ['Field Observation', 'Domain Mapping', 'Causal Loop Modeling', 'Intervention Blueprint'],
    link: 'https://www.behance.net/gallery/238355051/Sustainability-Design-Thinking-Rajendra-Nagar-Delhi'
  },
  {
    id: 'greenwashed',
    title: 'Greenwashed on Wheels',
    category: 'Sustainability Research / Systems Storyboarding',
    discipline: 'Research',
    year: '2025',
    tools: ['Photoshop', 'Figma'],
    team: 'Team of 5 (Diksha, Soumya Choudhary, Itika Kumar, Rewa Mehta, Suraj Mourya)',
    context: 'Critical lifecycle analysis of electric vehicles in India questioning surface sustainability claims.',
    image: '/assets/projects/behance/greenwashed-cover.webp',
    intro: 'A factual, systems-level illustrated inquiry into the hidden ecological and economic footprint of electric mobility in India.',
    challenge: 'EV marketing positions electric cars as zero-emission solutions. In reality, 76% of India’s grid electricity comes from coal, EV manufacturing produces ~4 tons of CO2 requiring 8 years of driving to offset, battery replacement costs ₹3–8.5 lakh vs ₹6–15k in petrol cars, and lithium extraction drains millions of liters of water.',
    response: 'Created an illustrated narrative following consumer "Arohi" through the lifecycle of EV purchase, resource extraction, charging realities, maintenance costs, and e-waste disposal. Proposes grounded sustainability paths including slow solar charging, hybrids, and workplace charging infrastructure.',
    forHiring: 'Data-led storytelling: 15 cited sources turned into one illustrated narrative a non-expert can follow from showroom to scrapyard.',
    forFounders: 'A case study in supply chain transparency, illustrating why clean-tech and mobility startups must evaluate end-to-end total cost of ownership and ecological reality.',
    facts: [
      'Upstream manufacturing: A single EV emits ~4 tons CO2 in production, requiring 8 years of driving to break even',
      'Raw material impact: 1 ton of lithium requires 2 million liters of water; ethical issues in DRC cobalt mining',
      'Grid energy reality: India electricity source is 76% coal, 6.3% solar, 5.4% wind, 5% large hydro, 0.7% small hydro',
      'Maintenance economics: Routine EV service is lower (₹1k-2k), but battery replacement costs ₹3,00,000–8,50,000',
      'Waste challenge: India generates ~3.2 million tons of e-waste/year; supported by 15 vetted academic and government citations'
    ],
    sections: [
      {
        title: 'Power Source: The Coal-Fired Reality',
        text: 'Dissected the true origin of electricity powering EVs in India: with coal accounting for 76% of total power generation, charging electric vehicles frequently transfers emissions from tailpipes directly to thermal power plants.',
        images: [
          {
            src: '/assets/projects/behance/greenwashed-energy.webp',
            alt: 'Electricity power sources of India donut chart and thermal plant',
            caption: 'Power source breakdown: 76% Coal, 6.3% Solar, 5.4% Wind, 5% Hydro'
          }
        ]
      },
      {
        title: 'Ownership Finances & Battery Replacement',
        text: 'Compared ongoing maintenance and replacement economics between EVs and petrol cars. While daily running costs are lower, battery replacement at ₹3,00,000–8,50,000 presents a daunting hurdle for the average middle-class owner.',
        images: [
          {
            src: '/assets/projects/behance/greenwashed-finances.webp',
            alt: 'Finances table comparing EV vs Petrol Car repairs',
            caption: 'Comparative maintenance breakdown: service, brake pads, engine oil, and battery replacement costs'
          }
        ]
      },
      {
        title: 'Pragmatic Sustainable Interventions',
        text: 'Rather than unquestioning adoption, the team proposed practical systemic transitions: establishing a "Slow Charging Culture" that protects battery longevity, adopting hybrid powertrains, and integrating solar charging at office facilities.',
        images: [
          {
            src: '/assets/projects/behance/greenwashed-solutions.webp',
            alt: 'Possible solutions: Slow charging culture, hybrids, office solar charging',
            caption: 'Realistic transition pathways: Slow Charging Culture, Hybrid Bridges, and Workplace Solar'
          }
        ]
      }
    ],
    flow: ['Narrative Framing', 'Supply Chain Audit', 'Grid & Cost Analysis', 'Realistic Solutions'],
    link: 'https://www.behance.net/gallery/227286277/GreenWashed-on-Wheels'
  }
];

export const playgroundProjects: Project[] = [
  {
    id: 'malegaze',
    title: 'Male Gaze & Gender Norms',
    category: 'Visual Culture / Editorial Illustration',
    discipline: 'Visual',
    year: '2025',
    tools: ['Figma', 'Procreate'],
    team: 'Solo (Rewa Mehta)',
    context: 'Editorial illustration exploring patriarchal voyeurism, unsolicited advice, and women’s hyper-vigilance in public spaces.',
    image: '/assets/projects/behance/malegaze-art.webp',
    poster: '/assets/projects/behance/malegaze-art.webp',
    intro: 'An examination of looking, judgment, and the exhausting mental tax of defensive behavior.',
    challenge: 'Society continuously instructs women on self-policing ("Watch what you wear", "Avoid alleys", "Hold your keys like weapon", "Never go outside alone"), placing the responsibility for safety entirely onto women while normalizing systemic entitlement.',
    response: 'An original editorial illustration by Rewa Mehta capturing a woman surrounded by intrusive male gazes. Sticky notes with societal warnings cling to her face and body, visualizing the heavy psychological burden carried in shared spaces.',
    forHiring: 'Highlights expressive visual craft, conceptual narrative illustration, and the ability to articulate complex sociopolitical themes with visceral clarity.',
    forFounders: 'Proves a distinct aesthetic voice, cultural acuity, and creative bravery that elevates brand and product identity.',
    facts: [
      'Original editorial artwork created in Procreate and Figma by Rewa Mehta',
      'Critiques the shift of responsibility from structural misogyny onto women’s self-policing',
      'Sticky-note annotations ("Hold your keys like weapon", "Yell fire not help") represent defensive cognitive load',
      'Published on Behance under Visual Culture & Trends (Oct 2025)'
    ],
    sections: [
      {
        title: 'Visual Statement & Semiotics',
        text: 'The illustration depicts a woman smoking thoughtfully, enclosed by tight, crowding sketches of male observers. Adhesives bearing safety axioms cover her forehead, cheeks, and neck, transforming routine safety advice into a visible cage.',
        images: [
          {
            src: '/assets/projects/behance/malegaze-illustration.webp',
            alt: 'Male Gaze and Gender Norms illustration by Rewa Mehta',
            caption: 'Original editorial artwork by Rewa Mehta (Procreate & Figma, Oct 2025)'
          }
        ]
      }
    ],
    flow: ['Cultural Observation', 'Symbolic Synthesis', 'Hand-drawn Composition', 'Narrative Critique'],
    link: 'https://www.behance.net/gallery/237042977/Male-Gaze-and-Gender-Norms'
  },
  {
    id: 'care',
    title: 'Redesigning Care',
    category: 'Information Design / Healthcare Market Poster',
    discipline: 'Visual',
    year: '2025',
    tools: ['Figma'],
    team: 'Solo (Rewa Mehta — NIFT MD/24/395)',
    context: 'Comprehensive information design poster mapping the Indian healthcare UX market, emerging design roles, and systemic opportunity sectors.',
    image: '/assets/projects/behance/care-infographic.webp',
    poster: '/assets/projects/behance/care-infographic.webp',
    intro: 'An information architecture infographic mapping the explosive growth and career pathways of healthcare UX in India.',
    challenge: 'With 43,486 private hospitals in India and a strained 1:843 doctor-to-patient ratio, healthcare systems face unprecedented delivery challenges. Emerging designers lack clarity on market sizing, specialized clinical design functions, and high-impact intervention areas.',
    response: 'Synthesized market data into an accessible infographic poster: charts the sector expansion from $90B (2014) to $380B (2023), with an estimated $638B for 2025. Maps 7 specialized UX roles, 8 high-leverage sectors (Telehealth, Wearables, Medication Adherence), and target industry employers.',
    forHiring: 'Showcases dense information architecture, visual hierarchy, market sizing, and domain expertise in the healthtech sector.',
    forFounders: 'A map of where design can help Indian healthcare: telehealth, wearables, medication adherence, staff dashboards and patient navigation.',
    facts: [
      'Documented 43,486 private hospitals in India against a 1:843 doctor-to-patient ratio',
      'Healthcare market trajectory: $90B (2014) -> $160B (2021) -> $380B (2023) -> $638B (2025 est.)',
      '7 professional roles mapped: Healthcare Design Coordinator, UX Researcher, Technology Designer, Innovation Experience Manager, Design Strategy Lead, Principal Interaction Designer, Design Manager',
      '8 opportunity sectors: Telehealth, Wearables, Condition-Specific Apps, Medication Management, Staff Dashboards, Health Literacy, Post-Treatment Support, Navigation',
      'Academic project created at NIFT New Delhi, signed MD/24/395 (May 2025)'
    ],
    sections: [
      {
        title: 'Healthcare Ecosystem & Market Sizing',
        text: 'A high-density infographic poster balancing macro-economic healthcare expenditure curves with specific human-centered design opportunities across hospitals, diagnostic platforms, and chronic care management.',
        images: [
          {
            src: '/assets/projects/behance/care-infographic.webp',
            alt: 'Redesigning Care Infographic Poster by Rewa Mehta',
            caption: 'Redesigning Care: For Better Health Through Experience Design (NIFT MD/24/395, May 2025)'
          }
        ]
      }
    ],
    flow: ['Market Research', 'Taxonomy Mapping', 'Visual Hierarchy', 'Poster Synthesis'],
    link: 'https://www.behance.net/gallery/226149499/Health-Care-Research-Infographic-Poster'
  }
];

export const email = 'rewamehta2002@gmail.com';
