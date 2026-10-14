create table if not exists public.site_content (
  id integer primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
  on public.site_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

insert into public.site_content (id, content)
values (1, '{
  "brandName": "Pretty Handwritten Work",
  "instagramUrl": "https://instagram.com/yourusername",
  "contactEmail": "hello@example.com",
  "experienceYears": 2,
  "ordersDelivered": 100,
  "aboutStory": "I started this service to help students who need clear, carefully organised handwritten work without the last-minute stress. Every order is prepared with attention to legibility, neat presentation, and the instructions you provide.",
  "aboutPhotoUrl": "",
  "faviconUrl": "/favicon.svg",
  "offerEndDate": "",
  "minimumOrder": 120,
  "freeShippingThreshold": 800,
  "heroEyebrow": "Handwritten assignments in India",
  "heroHeading": "Handwritten assignments in India, beautifully done.",
  "heroDescription": "Neat, consistent handwriting for school, college and university work — with clear pricing and delivery options.",
  "heroImages": [
    {"src":"https://images.unsplash.com/photo-1455390582262-044cdead277a?w=640&q=75&auto=format","alt":"Handwritten notes in an open notebook"},
    {"src":"https://images.unsplash.com/photo-1517842645767-c639042777db?w=640&q=75&auto=format","alt":"Notebook and pen on a desk"},
    {"src":"https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=640&q=75&auto=format","alt":"Colourful pens and stationery"},
    {"src":"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=75&auto=format","alt":"Student studying with books"},
    {"src":"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=640&q=75&auto=format","alt":"Hand writing on lined paper"},
    {"src":"https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=640&q=75&auto=format","alt":"Writing notes at a desk"}
  ],
  "seoTitle": "Pretty Handwritten Work | Handwritten Assignments in India",
  "seoDescription": "Neat, pretty handwritten assignments in India, records, notes and projects for students — delivered anywhere in India, with optional scanned PDF. Order on WhatsApp.",
  "services": [
    {"name":"School Assignments","icon":"book-open"},
    {"name":"College & University Assignments","icon":"graduation-cap"},
    {"name":"Practical Record Writing","icon":"flask-conical"},
    {"name":"Project Writing","icon":"folder-kanban"},
    {"name":"Notes, Copywriting & Handwritten Questions and Answers","icon":"message-square-text"},
    {"name":"Cursive and Beautiful Handwriting","icon":"feather"},
    {"name":"File Covers and Decorative Titles","icon":"palette"},
    {"name":"Custom Written Work according to your requirements","icon":"sparkles"}
  ],
  "whyChooseUs": ["Neat & consistent handwriting","Affordable prices","Careful packaging","On-time delivery","Pan-India shipping","Privacy of your work"],
  "faqItems": [
    {"question":"How long does it take?","answer":"Turnaround is 2–5 days for up to 30 pages. Larger orders and your deadline are confirmed on WhatsApp."},
    {"question":"Which ink colours can I choose?","answer":"Blue and black ink are standard. Other colours are available on request."},
    {"question":"What paper do you use?","answer":"We use A4 ruled paper. Plain paper is available on request."},
    {"question":"Can you draw diagrams and tables?","answer":"Yes, we can neatly include diagrams and tables."},
    {"question":"How does payment work?","answer":"Pay 50% in advance via UPI. The remaining balance is due before dispatch."},
    {"question":"What if there is a mistake?","answer":"We correct our own mistakes free of charge."},
    {"question":"Can I cancel and get a refund?","answer":"Refunds are possible for cancellations made before work starts. Once work has started, contact us to discuss the order."},
    {"question":"How long does courier delivery take?","answer":"Courier delivery usually takes 3–7 days after dispatch, depending on your location in India."}
  ],
  "testimonials": [
    {"name":"Student name","education":"Class / school","quote":"Replace with a genuine customer quote about an assignment."},
    {"name":"Student name","education":"Course / college","quote":"Replace with a genuine customer quote about a practical record."},
    {"name":"Student name","education":"Class / college","quote":"Replace with a genuine customer quote about a project."}
  ],
  "gallerySamples": [],
  "pricingSamples": [
    {"label":"Basic Running","src":"/samples/basic-running--a4-ruled.jpg"},
    {"label":"Cursive","src":"/samples/cursive--a4-ruled.jpg"},
    {"label":"Beautiful & Neat","src":"/samples/beautiful-neat--a4-ruled.jpg"},
    {"label":"File Cover","src":"/samples/file-cover--cover.jpg"},
    {"label":"Projects","src":"/samples/project--sample-page.jpg"}
  ],
  "pricingLabels": {"basic":"Basic Running Handwriting","cursive":"Cursive Handwriting","neat":"Beautiful & Neat Handwriting","cover":"File Cover","project":"Projects"}
}'::jsonb)
on conflict (id) do nothing;
