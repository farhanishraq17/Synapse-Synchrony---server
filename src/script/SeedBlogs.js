// script/SeedBlogs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const blogsData = [
  {
    title: 'My First Semester at UIU: A Journey of Growth',
    content: `Starting university was both exciting and overwhelming. I remember walking through the gates on my first day, feeling a mix of nervousness and anticipation. The campus was much bigger than I expected, and I got lost trying to find my first class!

What surprised me most was how welcoming everyone was. Seniors helped me navigate the campus, professors were approachable, and I quickly made friends in my classes. The Computer Science curriculum is challenging but rewarding. Every programming assignment pushes me to think critically and solve problems creatively.

The best part? The clubs and extracurricular activities! I joined the Programming Club and participated in my first hackathon last month. We didn't win, but the experience was invaluable. I learned React, worked with a team under pressure, and made connections with like-minded students.

To all freshmen reading this: embrace the challenges, ask questions, and don't be afraid to step out of your comfort zone. University is what you make of it!`,
    category: 'experience',
    tags: ['freshman', 'university-life', 'computer-science', 'advice'],
  },
  {
    title: '10 Essential Tips for Surviving Final Exams',
    content: `Final exams can be stressful, but with the right strategies, you can tackle them successfully! Here are my top 10 tips:

1. Start Early: Don't wait until the last minute. Create a study schedule at least two weeks before exams.

2. Prioritize Difficult Subjects: Tackle the hardest subjects first when your mind is fresh.

3. Use Active Recall: Instead of just re-reading notes, test yourself regularly.

4. Form Study Groups: Explaining concepts to others helps solidify your understanding.

5. Take Breaks: Use the Pomodoro Technique - 25 minutes study, 5 minutes break.

6. Stay Healthy: Get enough sleep, eat well, and exercise. Your brain needs fuel!

7. Organize Your Notes: Clean, organized notes make studying much easier.

8. Practice Past Papers: They give you a feel for the exam format and common questions.

9. Stay Positive: Believe in yourself and your preparation.

10. Don't Cram: Last-minute cramming rarely works. Trust your preparation.

Remember, exams are important, but they don't define you. Do your best and stay calm!`,
    category: 'tips',
    tags: ['exams', 'study-tips', 'academic', 'productivity'],
  },
  {
    title: 'How I Built My First Full-Stack Web Application',
    content: `As a second-year CSE student, I finally completed my first full-stack project - a task management app! Here's my journey and what I learned.

The Idea: I wanted to build something practical that I would actually use. A simple todo app wasn't enough, so I added features like deadlines, priorities, categories, and collaboration.

Tech Stack:
- Frontend: React with Tailwind CSS
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT

Challenges I Faced:
1. State Management: Learning Redux was tough at first, but it made my code much cleaner.
2. Authentication: Implementing secure login with JWT took several attempts.
3. Database Design: I had to refactor my schema twice to optimize queries.
4. Deployment: Hosting on Heroku taught me about environment variables and production builds.

Key Learnings:
- Break big problems into smaller tasks
- Don't be afraid to refactor code
- Documentation is your friend
- Testing saves time in the long run

The project took me 3 months working part-time, but it was worth every hour. I learned more from this one project than from several courses combined.

To fellow students: pick a project you're passionate about and just start building. You'll learn by doing!`,
    category: 'academic',
    tags: ['web-development', 'react', 'nodejs', 'project'],
  },
  {
    title: 'Campus Life Beyond Academics: My Extracurricular Adventures',
    content: `When I first joined UIU, I thought university was all about studying and getting good grades. Boy, was I wrong! The extracurricular activities have been just as important for my growth.

Programming Club:
This was my gateway to the tech community. We organize workshops, hackathons, and coding competitions. I've learned so much from senior members and made lasting friendships.

Cultural Events:
I never thought I'd perform on stage, but I participated in the Spring Cultural Night last year. It helped me overcome my stage fright and discover talents I didn't know I had.

Debate Society:
Joining the debate club improved my communication skills tremendously. It taught me to think on my feet, research thoroughly, and present arguments confidently.

Sports:
I'm not naturally athletic, but playing badminton twice a week has been great for my physical and mental health. It's a perfect stress reliever!

Volunteering:
Participating in community service projects gave me perspective. Teaching underprivileged kids basic computer skills was incredibly fulfilling.

The Balance:
Yes, balancing academics and extracurriculars is challenging. Some weeks are busier than others. But time management skills you develop are invaluable.

My advice: try different things, find what you're passionate about, and don't let anyone tell you that only grades matter. University is about holistic development!`,
    category: 'campus-life',
    tags: ['extracurricular', 'clubs', 'student-life', 'balance'],
  },
  {
    title: 'Internship Hunt: From Applications to Offers',
    content: `Landing my first internship was a rollercoaster. Here's my complete journey from application to acceptance.

The Preparation (2 months before):
- Updated my resume (had it reviewed by 5 different people!)
- Built 3 solid projects for my portfolio
- Practiced DSA problems on LeetCode
- Learned about the companies I was targeting

Application Phase:
I applied to 50+ companies. Yes, 50! I got responses from about 15. The rejection emails were tough, but I kept going.

Interview Process:
Round 1 - Online Assessment: Usually coding problems and MCQs
Round 2 - Technical Interview: Data structures, algorithms, and system design
Round 3 - HR Interview: Behavioral questions and culture fit

My Biggest Mistakes:
1. Not researching companies thoroughly
2. Being nervous and not asking clarifying questions
3. Not following up after interviews

What Worked:
1. Having concrete projects to discuss
2. Showing genuine enthusiasm for the role
3. Being honest about what I didn't know
4. Asking thoughtful questions about the team and role

The Result:
After 3 months, I received 2 offers! I chose a startup where I could learn more and have real impact.

Key Takeaway: Rejections are part of the process. Learn from each interview and keep improving. Your first internship might not be at a FAANG company, and that's perfectly okay!`,
    category: 'experience',
    tags: ['internship', 'career', 'job-search', 'interview'],
  },
  {
    title: 'Understanding Data Structures: A Beginner\'s Guide',
    content: `Data Structures were intimidating when I first encountered them in CSE 4304. Now they're one of my favorite topics! Let me break them down simply.

What are Data Structures?
Think of them as different ways to organize and store data, just like you organize books on a shelf, clothes in a closet, or files in folders.

Arrays:
Like a row of numbered boxes. Great for storing similar items where you know the position.
Use case: Student roll numbers

Linked Lists:
Like a treasure hunt where each clue points to the next location.
Use case: Browser history (back/forward buttons)

Stacks:
Like a stack of plates - last in, first out.
Use case: Undo functionality in text editors

Queues:
Like a line at a cafeteria - first in, first out.
Use case: Print job queue

Trees:
Like a family tree or organization chart.
Use case: File systems on your computer

Hash Tables:
Like a dictionary where you can look up words instantly.
Use case: Database indexing

Why Learn Them?
1. Write efficient code
2. Solve complex problems
3. Ace technical interviews
4. Understand how software works

How I Learned:
- Visualize with drawings
- Implement each structure from scratch
- Solve LeetCode problems
- Watch YouTube tutorials
- Join study groups

Pro Tip: Don't just memorize. Understand WHY each structure exists and WHEN to use it.`,
    category: 'academic',
    tags: ['data-structures', 'programming', 'learning', 'algorithms'],
  },
  {
    title: 'The Reality of Remote Learning: Pros, Cons, and Survival Tips',
    content: `We've all experienced remote learning during the pandemic, and even now some classes are online. Here's my honest take.

The Good:
- Flexibility to review recorded lectures
- No commute time (extra sleep!)
- Comfortable learning environment
- Easy access to online resources
- Can eat during class (guilty!)

The Not-So-Good:
- Zoom fatigue is real
- Harder to stay focused
- Internet connectivity issues
- Missing face-to-face interactions
- Technical difficulties during exams

Survival Strategies:
1. Dedicated Study Space: Don't study in bed!
2. Routine: Maintain regular sleep and study schedule
3. Active Participation: Turn camera on, ask questions
4. Break Time: 10 minutes between classes
5. Human Connection: Video calls with classmates
6. Physical Activity: Exercise daily
7. Limit Distractions: Keep phone away during lectures

Productivity Tools I Use:
- Notion for note-taking
- Forest app to stay focused
- Google Calendar for deadlines
- Discord for group discussions
- Anki for spaced repetition

The Hybrid Future:
I think the future is hybrid - combining the best of both worlds. Some theoretical classes work well online, while practical labs need in-person interaction.

Bottom line: Remote learning has challenges, but with the right mindset and tools, it can be just as effective!`,
    category: 'tips',
    tags: ['remote-learning', 'online-classes', 'productivity', 'pandemic'],
  },
  {
    title: 'Why I Switched My Major and Why That\'s Okay',
    content: `This is a vulnerable post, but I hope it helps someone out there.

I started university as an EEE major. I thought I wanted to work with circuits and electronics because it sounded cool. Six months in, I realized I was miserable. I struggled with every class, had no passion for the subject, and dreaded going to lectures.

The Decision:
Switching majors felt like failure. What would people think? I'd lose time and credits. My parents had expectations. But staying in a field I hated seemed worse.

The Switch to CSE:
Programming clicked for me in a way electronics never did. Suddenly, I was excited to solve problems. I spent hours coding not because I had to, but because I wanted to.

Challenges I Faced:
1. Starting "behind" classmates
2. Catching up on prerequisite knowledge
3. Dealing with judgment from others
4. Overcoming imposter syndrome

What I Learned:
- It's never too late to change paths
- Your mental health matters more than others' opinions
- Passion makes learning easier
- Everyone's journey is different

Two Years Later:
I'm thriving! I have a 3.8 GPA, multiple projects, and a summer internship lined up. More importantly, I'm happy.

My Message:
If you're in the wrong major, it's okay to switch. Yes, there will be challenges. Yes, some people won't understand. But your happiness and future are worth it.

Don't let sunk cost fallacy trap you in misery. It's your life - make the choice that's right for YOU.`,
    category: 'experience',
    tags: ['major', 'career-change', 'advice', 'mental-health'],
  },
  {
    title: 'Mastering Time Management: A Student\'s Complete Guide',
    content: `Time management was my biggest struggle in first year. Now in third year, I've finally figured it out. Here's everything I learned.

The Problem:
- Too many deadlines
- Multiple projects
- Social life
- Personal time
- Sleep (what's that?)

My System:

1. Weekly Planning (Sunday Night):
- Review upcoming week
- List all assignments and deadlines
- Plan study sessions
- Schedule social activities

2. Daily Planning (Every Morning):
- Top 3 priorities for the day
- Time blocks for each task
- Buffer time for unexpected issues

3. The 2-Minute Rule:
If something takes less than 2 minutes, do it immediately. This prevents small tasks from piling up.

4. Time Blocking:
- 8 AM - 12 PM: Most difficult tasks
- 12 PM - 1 PM: Lunch + exercise
- 1 PM - 5 PM: Classes/meetings
- 5 PM - 7 PM: Group work
- 7 PM - 8 PM: Dinner + break
- 8 PM - 10 PM: Homework/study
- 10 PM - 11 PM: Personal time

5. The Pomodoro Technique:
25 minutes focused work, 5 minutes break. After 4 pomodoros, take a 15-30 minute break.

Tools I Use:
- Google Calendar: All events and deadlines
- Notion: Task management and notes
- Forest App: Stay focused
- Habitica: Gamify daily tasks

Common Mistakes to Avoid:
- Over-scheduling (leave buffer time!)
- Not accounting for breaks
- Saying yes to everything
- Multitasking (it doesn't work!)
- Ignoring sleep and health

The Result:
I have time for academics, projects, gym, friends, and hobbies. I sleep 7 hours a night and still maintain a high GPA.

Remember: Time management is a skill. It takes practice. Be patient with yourself and keep refining your system!`,
    category: 'tips',
    tags: ['time-management', 'productivity', 'organization', 'study-tips'],
  },
  {
    title: 'Building a Strong Portfolio: What Employers Actually Want',
    content: `After talking to 20+ recruiters and analyzing 100+ job postings, here's what I learned about building a portfolio that gets you hired.

Quality Over Quantity:
3 excellent projects > 10 mediocre ones

Project Selection Criteria:
1. Solves a real problem
2. Uses modern tech stack
3. Demonstrates multiple skills
4. Well-documented
5. Live demo available

My Portfolio Projects:

Project 1: E-Commerce Platform
- Tech: React, Node.js, MongoDB, Stripe
- Features: User auth, cart, payment, admin panel
- What it shows: Full-stack skills, API integration
- Deployed on: Vercel + Railway

Project 2: AI Image Recognition App
- Tech: Python, TensorFlow, Flask, React
- Features: Upload image, get predictions
- What it shows: Machine learning skills
- Deployed on: Heroku

Project 3: Real-time Chat Application
- Tech: React, Socket.io, Node.js
- Features: Group chat, file sharing, typing indicators
- What it shows: WebSocket implementation
- Deployed on: Netlify + Railway

Key Elements:
1. Clean README with screenshots
2. Clear setup instructions
3. Live demo link
4. Your role (if team project)
5. Challenges faced and solutions

GitHub Profile Tips:
- Pinned repositories
- Descriptive repo names
- Consistent commit history
- Meaningful commit messages
- Open source contributions

Personal Website:
I built a portfolio website showcasing:
- About me section
- Projects with descriptions
- Skills and technologies
- Contact information
- Blog (yes, this one!)

Bonus Points:
- Technical blog posts
- Open source contributions
- Hackathon wins
- Certifications
- Side projects

What Recruiters Look For:
1. Can you build complete applications?
2. Do you write clean code?
3. Can you learn new technologies?
4. Do you work on personal projects?
5. Are you passionate about tech?

Remember: Your portfolio is never "done." Keep learning, building, and improving!`,
    category: 'tips',
    tags: ['portfolio', 'career', 'projects', 'job-search'],
  },
  {
    title: 'From Introvert to Public Speaker: My Transformation Story',
    content: `I used to be terrified of public speaking. My hands would shake, voice would crack, and I'd avoid eye contact. Fast forward two years - I just presented at a 200-person tech conference. Here's how I did it.

The Beginning:
My first presentation was a disaster. I spoke so fast that nobody understood me. I read directly from slides. I turned beet red. It was awful.

Baby Steps:

Step 1: Class Presentations
Started with comfortable environments - small study groups, then class presentations. The pressure was lower, and I could practice regularly.

Step 2: Joined Debate Club
This was scary but transformative. Weekly practice, constructive feedback, and supportive environment helped immensely.

Step 3: Volunteered for Opportunities
- Lab demo presentations
- Student orientation sessions
- Club meetings
- Workshop presentations

Techniques That Helped:

1. Preparation:
- Know your topic inside out
- Practice in front of mirror
- Record yourself
- Time your presentation

2. Structure:
- Clear introduction
- Main points (3-5 max)
- Supporting examples
- Strong conclusion

3. During Presentation:
- Deep breathing before starting
- Make eye contact (look at foreheads if nervous!)
- Speak slowly and clearly
- Use pauses effectively
- Engage with questions

4. Mindset Shift:
Instead of "What if I mess up?" think "I'm sharing valuable information."

The Turning Point:
I presented my project at a hackathon. I was nervous but prepared. The audience asked great questions. I realized I was helping people learn, not being judged.

Current Status:
I regularly present at:
- Study groups
- Club meetings
- Tech meetups
- Conferences (online and offline)

Key Realizations:
1. Everyone starts somewhere
2. Nerves are normal (even pros get them!)
3. Practice makes confidence
4. Imperfection is okay
5. Focus on helping your audience

To fellow introverts: You don't have to become an extrovert. You just need to get comfortable being uncomfortable. Start small, practice regularly, and watch yourself grow!`,
    category: 'experience',
    tags: ['public-speaking', 'personal-growth', 'communication', 'confidence'],
  },
  {
    title: 'The Ultimate Guide to Group Projects (Without Losing Your Mind)',
    content: `Group projects - the necessary evil of university life. After completing 15+ group projects, here's my survival guide.

The Reality:
- Someone always does more work
- Communication is challenging
- Schedules never align
- Someone disappears mid-project

How to Succeed:

Phase 1: Team Formation
- Choose reliable people (not just friends!)
- Diverse skill sets
- Similar work ethics
- Compatible schedules

Phase 2: Planning
First Meeting Checklist:
- Define project goals
- Divide responsibilities
- Set deadlines for each part
- Choose communication channel
- Schedule regular check-ins

Tools We Use:
- Slack: Daily communication
- Trello: Task management
- Google Drive: Shared documents
- GitHub: Code collaboration
- Zoom: Virtual meetings

Phase 3: Execution
- Weekly progress meetings
- Clear task ownership
- Help teammates who struggle
- Document everything
- Regular commits/updates

Handling Common Issues:

Free Riders:
- Document contributions
- Talk to them directly first
- Escalate to professor if needed
- Don't let them slide

Different Work Styles:
- Establish ground rules early
- Respect different approaches
- Focus on outcomes, not methods

Communication Breakdown:
- Use written communication for clarity
- Confirm important decisions
- Keep everyone in the loop

Time Management:
- Start early!
- Build in buffer time
- Have backup plans
- Regular progress checks

Phase 4: Final Delivery
- Combine parts early
- Test everything
- Practice presentation
- Prepare for questions
- Submit before deadline

Lessons Learned:
1. Clear communication prevents 90% of problems
2. Documentation saves lives
3. Flexibility is key
4. Give constructive feedback
5. Celebrate wins together

Best Practices:
- Respect everyone's time
- Be reliable and accountable
- Help struggling teammates
- Share knowledge
- Stay positive

The Silver Lining:
Group projects teach invaluable skills:
- Teamwork
- Communication
- Conflict resolution
- Project management
- Leadership

These are exactly what you'll need in your career!`,
    category: 'tips',
    tags: ['group-projects', 'teamwork', 'collaboration', 'academic'],
  },
  {
    title: 'Mental Health Matters: My Journey Through Burnout',
    content: `Content warning: This post discusses mental health, stress, and burnout.

Semester 5 broke me. I was taking 6 courses, working on two side projects, leading a club, and trying to maintain a social life. I thought I could handle everything. I was wrong.

The Breaking Point:
It started with small things - forgetting assignments, sleeping 4 hours a night, skipping meals. Then came the anxiety attacks. I couldn't focus. I felt overwhelmed by simple tasks. I withdrew from friends.

One night, I broke down crying over a programming assignment I could normally complete in an hour. That's when I knew something was seriously wrong.

The Recovery:

Step 1: Acknowledgment
I admitted I wasn't okay. This was the hardest part. I thought asking for help meant I was weak.

Step 2: Seek Help
- Talked to university counselor
- Opened up to parents
- Confided in close friends
- Consulted with academic advisor

Step 3: Make Changes
- Dropped one course
- Stepped back from club leadership
- Paused side projects
- Started therapy
- Established boundaries

Step 4: Self-Care Routine
Daily:
- 7-8 hours sleep
- Regular meals
- 30 minutes exercise
- Meditation app
- No work after 10 PM

Weekly:
- One social activity
- Hobby time (reading, gaming)
- Complete technology detox day

Step 5: Sustainable Habits
- Realistic goals
- Regular breaks
- Say "no" to overcommitment
- Maintain perspective
- Celebrate small wins

What Helped:
1. Therapy (game changer!)
2. Supportive friends
3. Understanding professors
4. Exercise and sleep
5. Mindfulness practices

What I Learned:
- Productivity ≠ Self-worth
- Rest is productive
- Asking for help is strength
- Mental health > grades
- You are not your achievements

To Anyone Struggling:
1. You're not alone
2. It's okay to not be okay
3. Seeking help is brave
4. Recovery takes time
5. Be kind to yourself

Resources:
- UIU Counseling Center
- Mental health hotlines
- Therapy apps (BetterHelp, Talkspace)
- Meditation apps (Headspace, Calm)
- Support groups

One Year Later:
I'm in a much better place. I still have stressful days, but I have tools to cope. I set boundaries. I prioritize my well-being.

Remember: Taking care of your mental health isn't selfish. You can't pour from an empty cup.

If you're struggling, please reach out. You deserve support.`,
    category: 'experience',
    tags: ['mental-health', 'burnout', 'wellness', 'self-care'],
  },
  {
    title: 'Learning Programming: Resources That Actually Worked for Me',
    content: `After 3 years of programming and trying countless resources, here are the ones that actually helped me become a better developer.

Foundation (First Year):

1. CS50 (Harvard - Free)
Best introduction to computer science. David Malan is an incredible teacher.

2. freeCodeCamp
Hands-on practice. Built real projects while learning.

3. The Odin Project
Comprehensive web development curriculum.

Data Structures & Algorithms:

1. Abdul Bari (YouTube)
Clear explanations with great visualizations.

2. mycodeschool (YouTube)
Detailed DSA explanations.

3. LeetCode
Practice, practice, practice. Start with easy, progress gradually.

Web Development:

Frontend:
- Traversy Media (YouTube)
- Net Ninja (YouTube)
- JavaScript.info (Documentation)
- MDN Web Docs

Backend:
- Academind (YouTube)
- Programming with Mosh
- Node.js Documentation

Full Stack:
- Full Stack Open (University of Helsinki)
- The Net Ninja Full Stack Course

Advanced Topics:

System Design:
- System Design Primer (GitHub)
- Gaurav Sen (YouTube)
- Tech Dummies (YouTube)

Databases:
- Khan Academy SQL
- MongoDB University
- PostgreSQL Tutorial

DevOps:
- Docker Documentation
- Kubernetes for Beginners
- AWS Free Tier

Books That Helped:

1. "Clean Code" by Robert Martin
Changed how I write code.

2. "You Don't Know JS" by Kyle Simpson
Deep dive into JavaScript.

3. "Designing Data-Intensive Applications"
Must-read for system design.

4. "The Pragmatic Programmer"
Career-changing advice.

Practice Platforms:

1. LeetCode
Interview prep and problem-solving.

2. HackerRank
Good for beginners, covers many topics.

3. CodeWars
Fun challenges, great community.

4. Project Euler
Math + programming problems.

Learning Strategies:

1. Build Projects
Theory alone won't make you a developer.

2. Read Others' Code
Learn from open source projects.

3. Join Communities
- Reddit: r/learnprogramming
- Discord: TheOdinProject, freeCodeCamp
- Stack Overflow

4. Write Blog Posts
Teaching solidifies understanding.

5. Code Daily
Even 30 minutes counts.

Common Mistakes to Avoid:

1. Tutorial Hell
Don't watch endlessly. Build things!

2. Learning Too Many Things
Master one thing before moving on.

3. Ignoring Fundamentals
Frameworks change, fundamentals don't.

4. Not Reading Documentation
It's boring but necessary.

5. Comparing Your Progress
Everyone learns at different pace.

My Current Routine:
- Morning: LeetCode (1 problem)
- Day: University classes
- Evening: Side project (2 hours)
- Night: Read documentation/articles

The most important lesson? Just start. Don't wait for the perfect resource. Pick one and begin coding!`,
    category: 'academic',
    tags: ['programming', 'learning', 'resources', 'web-development'],
  },
  {
    title: 'Making the Most of University: Things I Wish I Knew Earlier',
    content: `As I approach graduation, here are the lessons I learned (sometimes the hard way) during my university journey.

Academic Wisdom:

1. Attend Classes
I know, obvious right? But seriously, attendance matters. You miss context, explanations, and announcements. That YouTube lecture can't answer your specific questions.

2. Build Relationships with Professors
They're not just grade-givers. They're mentors, recommendation letter writers, and industry connections. Go to office hours!

3. Start Assignments Early
Future you will thank present you. Last-minute work is stressful and usually lower quality.

4. Study Groups Are Gold
Teaching others helps you learn. Plus, you'll catch things you missed.

5. Don't Just Memorize
Understand concepts. They'll be useful beyond exams.

Career Preparation:

1. Start Building Portfolio Early
Don't wait until job hunting. Build projects from day one.

2. Network Actively
- Attend tech meetups
- Connect on LinkedIn
- Join online communities
- Go to career fairs

3. Internships > High GPA
3.5 GPA + 2 internships > 4.0 GPA + 0 experience

4. Learn Beyond Curriculum
Technologies taught in class are often outdated. Self-learning is crucial.

5. Contribute to Open Source
Great for portfolio and networking.

Personal Development:

1. Join Extracurriculars
Skills you gain (leadership, communication, teamwork) are invaluable.

2. Step Out of Comfort Zone
Try new things. That's what university is for!

3. Build Soft Skills
Technical skills get you the interview. Soft skills get you the job.

4. Travel and Explore
If you can, attend conferences, hackathons in other cities.

5. Maintain Work-Life Balance
Burning out helps no one.

Social Life:

1. Make Genuine Friendships
These people will be your network for life.

2. Don't Isolate
Even introverts need connection.

3. Quality Over Quantity
Few real friends > many acquaintances

4. Stay in Touch
Maintain relationships beyond group projects.

Health & Wellness:

1. Sleep Is Not Negotiable
All-nighters are not badges of honor.

2. Exercise Regularly
Physical health affects mental performance.

3. Eat Properly
Ramen every day is not a personality trait.

4. Mental Health Matters
Seek help when needed. No shame in it.

Financial Wisdom:

1. Budget Your Money
Track expenses. Future you will appreciate it.

2. Avoid Unnecessary Debt
Be smart about loans and credit cards.

3. Look for Scholarships
Free money is available. Apply!

4. Part-time Work Experience
If possible, work. Real-world experience is valuable.

Things I Regret:

1. Not starting side projects earlier
2. Being afraid to ask questions
3. Not attending more networking events
4. Procrastinating on important applications
5. Not documenting my journey

Things I'm Glad I Did:

1. Joined programming club
2. Participated in hackathons
3. Built strong friendships
4. Took care of mental health
5. Learned continuously

The Big Picture:

University is not just about getting a degree. It's about:
- Discovering who you are
- Building skills and knowledge
- Creating lasting relationships
- Preparing for your career
- Growing as a person

You'll make mistakes. That's okay. Learn from them and keep moving forward.

To current students: Make the most of these years. They're fleeting but formative. Balance work and play. Study hard, but live fully.

Your university experience is what you make of it. So make it count!`,
    category: 'experience',
    tags: ['university-life', 'advice', 'wisdom', 'reflection'],
  },
];

const seedBlogs = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing blogs
    await Blog.deleteMany({});
    console.log('🗑️  Cleared existing blogs');

    // Get users to assign as authors
    const users = await User.find({}).limit(10);
    
    if (users.length === 0) {
      console.error('❌ No users found in database. Please create users first.');
      process.exit(1);
    }

    console.log(`👥 Found ${users.length} users to assign as blog authors`);

    // Assign random users as authors and add some likes/views
    const blogsWithAuthors = blogsData.map((blog) => {
      const randomAuthor = users[Math.floor(Math.random() * users.length)];
      
      // Randomly add likes (0-20 users)
      const numLikes = Math.floor(Math.random() * 21);
      const likes = [];
      
      for (let i = 0; i < Math.min(numLikes, users.length); i++) {
        const randomLiker = users[Math.floor(Math.random() * users.length)];
        if (!likes.includes(randomLiker._id)) {
          likes.push(randomLiker._id);
        }
      }

      // Random views (50-500)
      const views = Math.floor(Math.random() * 450) + 50;

      return {
        ...blog,
        author: randomAuthor._id,
        likes,
        views,
      };
    });

    // Insert blogs
    const createdBlogs = await Blog.insertMany(blogsWithAuthors);
    console.log(`✅ Created ${createdBlogs.length} blogs`);

    // Display summary
    console.log('\n📊 Blog Summary:');
    console.log(`   - Experience: ${createdBlogs.filter(b => b.category === 'experience').length}`);
    console.log(`   - Academic: ${createdBlogs.filter(b => b.category === 'academic').length}`);
    console.log(`   - Campus Life: ${createdBlogs.filter(b => b.category === 'campus-life').length}`);
    console.log(`   - Tips: ${createdBlogs.filter(b => b.category === 'tips').length}`);
    console.log(`   - Story: ${createdBlogs.filter(b => b.category === 'story').length}`);

    console.log('\n📈 Stats:');
    const totalLikes = createdBlogs.reduce((sum, blog) => sum + blog.likes.length, 0);
    const totalViews = createdBlogs.reduce((sum, blog) => sum + blog.views, 0);
    console.log(`   - Total Likes: ${totalLikes}`);
    console.log(`   - Total Views: ${totalViews}`);
    console.log(`   - Average Likes per Blog: ${(totalLikes / createdBlogs.length).toFixed(1)}`);
    console.log(`   - Average Views per Blog: ${(totalViews / createdBlogs.length).toFixed(1)}`);

    console.log('\n🎉 Blog seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding blogs:', error);
    process.exit(1);
  }
};

// Run the seed function
seedBlogs();
