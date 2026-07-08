CREATE TABLE about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hero_badge text,
  hero_heading text,
  hero_tagline text,
  bio_paragraphs jsonb,
  services jsonb,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Seed with current hardcoded content (strings match FALLBACK in src/app/about/page.tsx exactly)
INSERT INTO about_content (
  hero_badge,
  hero_heading,
  hero_tagline,
  bio_paragraphs,
  services
) VALUES (
  'Technology Innovator · Speaker · Pastor',
  'Keith L. Odom',
  'Bridging faith, technology, and leadership to empower organizations and communities for the digital age.',
  '[
    "Keith L. Odom is a distinguished technology innovator, executive strategist, and faith leader whose career spans more than two decades at the convergence of enterprise technology and community transformation. With deep roots in both Silicon Valley-caliber innovation and ministry leadership, Keith brings a rare perspective that unites technical excellence with purpose-driven vision.",
    "Keith’’s journey through the technology landscape includes his role as Senior Fiscal Officer (Controller) at the MIT Media Lab, where his oversight of fiscal operations and strategic resource management deepened his understanding of how technology institutions operate at the highest level. This experience grounded his approach in rigorous, operations-informed thinking while fueling a passion for making technology accessible and impactful for everyday people and organizations.",
    "As the CEO & Solution Architect of Axtegrity Consulting, a Gold Certified Microsoft Partner, Keith leads a consultancy specializing in ERP consulting, implementations, digital transformation, cloud solutions, custom app and software development, cybersecurity oversight, and infrastructure management. Through Axtegrity, he has helped organizations modernize their technology infrastructure, strengthen their cybersecurity posture, and adopt strategies that create lasting competitive advantage.",
    "A visionary at the intersection of faith and technology, Keith created TechChurch—a pioneering initiative that equips churches and ministries with the tools, frameworks, and digital literacy needed to thrive in a rapidly evolving technological landscape. He also organizes the Church & Tech Summit, a premier gathering that convenes pastors, technologists, and leaders to explore how innovation can amplify ministry impact and community engagement.",
    "Beyond the boardroom and the conference stage, Keith serves as Founder and Lead Pastor of The Place of Grace Church in Pine Hills, Orlando — a 21st-century church bringing about transformative change in the community. A son of the Church of God in Christ, Keith also serves as the Director of Technology for COGIC, overseeing infrastructure, cybersecurity, and software applications for the denomination. His ministry and technology leadership reflect a deep commitment to spiritual growth, community empowerment, and service.",
    "Whether advising C-suite executives on digital strategy, delivering keynotes that challenge audiences to rethink the relationship between innovation and purpose, or mentoring the next generation of technology leaders, Keith L. Odom operates with a singular conviction: that technology, guided by wisdom and faith, has the power to transform lives, organizations, and communities."
  ]'::jsonb,
  '[
    {"title": "IT Consulting", "description": "Enterprise technology strategy, infrastructure modernization, and digital transformation guidance tailored for organizations seeking sustainable growth.", "badge": "Strategy"},
    {"title": "CTO Services", "description": "Fractional and full-engagement CTO leadership, aligning technology vision with business objectives and driving innovation across the organization.", "badge": "Leadership"},
    {"title": "Project Management", "description": "End-to-end program delivery using agile and hybrid methodologies, ensuring complex initiatives ship on time and within budget.", "badge": "Delivery"},
    {"title": "Conference Speaking", "description": "Compelling keynotes and workshops at the intersection of faith, technology, and leadership that inspire audiences to take bold action.", "badge": "Speaking"}
  ]'::jsonb
);
