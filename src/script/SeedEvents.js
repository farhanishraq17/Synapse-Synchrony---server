// script/SeedEvents.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

// Image assets
const eventImages = [
  'https://i.ibb.co.com/rKJX4Dsp/Evening.webp',
  'https://i.ibb.co.com/4Rt4YcVD/Fitness.webp',
  'https://i.ibb.co.com/27Lt5MQD/Morning-Jog.webp',
  'https://i.ibb.co.com/cK53YZg6/Morning-Yoga.webp',
  'https://i.ibb.co.com/QvRXjjrG/Study.webp',
];

const eventsData = [
  {
    title: 'React & Node.js Full Stack Workshop',
    description:
      'A comprehensive workshop covering React frontend and Node.js backend development. Learn how to build modern web applications from scratch. Topics include: React hooks, state management, RESTful APIs, MongoDB integration, and deployment strategies. Perfect for beginners and intermediate developers.',
    eventType: 'workshop',
    startDate: new Date('2026-02-15T10:00:00Z'),
    endDate: new Date('2026-02-15T17:00:00Z'),
    location: 'Room 301, Computer Science Building',
    organizer: {
      name: 'UIU Computer Science Club',
      contact: 'csc@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 50,
    tags: ['web-development', 'react', 'nodejs', 'programming'],
    status: 'upcoming',
  },
  {
    title: 'AI and Machine Learning Seminar',
    description:
      'Join us for an enlightening seminar on the latest trends in Artificial Intelligence and Machine Learning. Industry experts will share insights on neural networks, deep learning, and practical AI applications in business. Includes live demonstrations and Q&A session.',
    eventType: 'seminar',
    startDate: new Date('2026-02-20T14:00:00Z'),
    endDate: new Date('2026-02-20T16:30:00Z'),
    location: 'Auditorium, Main Campus',
    organizer: {
      name: 'UIU AI Research Group',
      contact: 'ai.research@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 200,
    tags: [
      'artificial-intelligence',
      'machine-learning',
      'technology',
      'research',
    ],
    status: 'upcoming',
  },
  {
    title: 'Annual Tech Fest 2026',
    description:
      'The biggest tech event of the year! Features coding competitions, hackathons, tech talks, startup showcases, and networking opportunities. Win prizes worth BDT 500,000! Special guest speakers from leading tech companies. Food, games, and exciting giveaways throughout the day.',
    eventType: 'extracurricular',
    startDate: new Date('2026-03-05T09:00:00Z'),
    endDate: new Date('2026-03-07T18:00:00Z'),
    location: 'University Ground & Multiple Venues',
    organizer: {
      name: 'UIU Tech Club',
      contact: 'techclub@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/rKJX4Dsp/Evening.webp',
    capacity: null, // Unlimited
    tags: ['tech-fest', 'competition', 'hackathon', 'networking'],
    status: 'upcoming',
  },
  {
    title: 'Database Design & Optimization Workshop',
    description:
      'Master the art of database design! Learn about normalization, indexing, query optimization, and NoSQL vs SQL databases. Hands-on exercises with PostgreSQL and MongoDB. Bring your laptop for practical sessions.',
    eventType: 'workshop',
    startDate: new Date('2026-02-25T13:00:00Z'),
    endDate: new Date('2026-02-25T17:00:00Z'),
    location: 'Computer Lab 4, CSE Building',
    organizer: {
      name: 'Database Systems Study Group',
      contact: 'dbsg@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 35,
    tags: ['database', 'sql', 'mongodb', 'optimization'],
    status: 'upcoming',
  },
  {
    title: 'Career Fair 2026 - Meet Top Employers',
    description:
      'Connect with leading companies and explore career opportunities! 50+ companies attending including Google, Microsoft, bKash, Pathao, and more. Bring your resume, attend mock interviews, and network with recruiters. Professional attire required.',
    eventType: 'academic',
    startDate: new Date('2026-03-10T10:00:00Z'),
    endDate: new Date('2026-03-10T16:00:00Z'),
    location: 'University Convention Center',
    organizer: {
      name: 'UIU Career Services',
      contact: 'careers@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/rKJX4Dsp/Evening.webp',
    capacity: null,
    tags: ['career', 'jobs', 'networking', 'recruitment'],
    status: 'upcoming',
  },
  {
    title: 'Mobile App Development with Flutter',
    description:
      'Build beautiful cross-platform mobile apps with Flutter and Dart. Learn widgets, state management, API integration, and publishing to app stores. Previous programming experience recommended.',
    eventType: 'workshop',
    startDate: new Date('2026-03-01T10:00:00Z'),
    endDate: new Date('2026-03-01T16:00:00Z'),
    location: 'Room 405, Engineering Building',
    organizer: {
      name: 'Mobile Developers Community',
      contact: 'mobiledev@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 40,
    tags: ['mobile', 'flutter', 'android', 'ios'],
    status: 'upcoming',
  },
  {
    title: 'Cybersecurity Awareness Session',
    description:
      'Learn to protect yourself and your data online. Topics include password security, phishing attacks, social engineering, VPNs, and ethical hacking basics. Suitable for all students regardless of technical background.',
    eventType: 'seminar',
    startDate: new Date('2026-02-28T15:00:00Z'),
    endDate: new Date('2026-02-28T17:00:00Z'),
    location: 'Lecture Hall 2',
    organizer: {
      name: 'UIU Cybersecurity Club',
      contact: 'cybersec@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 100,
    tags: ['cybersecurity', 'security', 'privacy', 'hacking'],
    status: 'upcoming',
  },
  {
    title: 'Spring Cultural Night 2026',
    description:
      'Celebrate diversity and culture! Enjoy music, dance performances, cultural exhibitions, traditional food stalls, and art displays from various cultures. Open to all students and faculty. Free entry!',
    eventType: 'social',
    startDate: new Date('2026-03-15T18:00:00Z'),
    endDate: new Date('2026-03-15T22:00:00Z'),
    location: 'Open Air Theater',
    organizer: {
      name: 'UIU Cultural Committee',
      contact: 'culture@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/rKJX4Dsp/Evening.webp',
    capacity: null,
    tags: ['cultural', 'music', 'dance', 'celebration'],
    status: 'upcoming',
  },
  {
    title: 'Introduction to Cloud Computing (AWS)',
    description:
      'Get started with Amazon Web Services! Learn about EC2, S3, Lambda, and other AWS services. Understand cloud architecture, deployment, and cost optimization. AWS account required (free tier sufficient).',
    eventType: 'workshop',
    startDate: new Date('2026-03-12T14:00:00Z'),
    endDate: new Date('2026-03-12T18:00:00Z'),
    location: 'Computer Lab 2, CSE Building',
    organizer: {
      name: 'Cloud Computing Study Circle',
      contact: 'cloud@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 30,
    tags: ['cloud', 'aws', 'devops', 'infrastructure'],
    status: 'upcoming',
  },
  {
    title: 'Competitive Programming Boot Camp',
    description:
      'Intensive 3-day boot camp for competitive programmers. Solve algorithmic problems, learn advanced data structures, and practice for ACM ICPC. Daily contests with prizes for top performers. All levels welcome!',
    eventType: 'extracurricular',
    startDate: new Date('2026-03-20T09:00:00Z'),
    endDate: new Date('2026-03-22T17:00:00Z'),
    location: 'Computer Labs 1-3',
    organizer: {
      name: 'UIU Programming Club',
      contact: 'programming@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 60,
    tags: ['programming', 'algorithms', 'competitive', 'coding'],
    status: 'upcoming',
  },
  {
    title: 'Startup Pitch Competition 2026',
    description:
      'Have a startup idea? Pitch it to investors and judges! Top 3 teams win seed funding and mentorship. Open to all students. Submit your pitch deck by March 1st. Finalists will present live.',
    eventType: 'academic',
    startDate: new Date('2026-03-25T13:00:00Z'),
    endDate: new Date('2026-03-25T17:00:00Z'),
    location: 'Business Incubation Center',
    organizer: {
      name: 'UIU Entrepreneurship Cell',
      contact: 'ecell@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/rKJX4Dsp/Evening.webp',
    capacity: 150,
    tags: ['startup', 'entrepreneurship', 'pitch', 'innovation'],
    status: 'upcoming',
  },
  {
    title: 'Game Development with Unity',
    description:
      'Create your first video game! Learn Unity game engine, C# scripting, physics, animation, and game design principles. Build a complete 2D platformer game by the end of the workshop.',
    eventType: 'workshop',
    startDate: new Date('2026-03-08T10:00:00Z'),
    endDate: new Date('2026-03-08T17:00:00Z'),
    location: 'Multimedia Lab, CSE Building',
    organizer: {
      name: 'Game Developers Guild',
      contact: 'gamedev@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 25,
    tags: ['game-development', 'unity', 'csharp', 'gaming'],
    status: 'upcoming',
  },
  {
    title: 'Mental Health & Wellness Seminar',
    description:
      'Learn about stress management, maintaining work-life balance, and mental wellness strategies for students. Professional counselors will share tips and answer questions. Free and confidential.',
    eventType: 'seminar',
    startDate: new Date('2026-02-22T14:00:00Z'),
    endDate: new Date('2026-02-22T16:00:00Z'),
    location: 'Student Wellness Center',
    organizer: {
      name: 'UIU Counseling Services',
      contact: 'wellness@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/cK53YZg6/Morning-Yoga.webp',
    capacity: 80,
    tags: ['mental-health', 'wellness', 'stress', 'counseling'],
    status: 'upcoming',
  },
  {
    title: 'Blockchain & Cryptocurrency Explained',
    description:
      'Demystify blockchain technology and cryptocurrencies. Learn how blockchain works, smart contracts, NFTs, DeFi, and the future of Web3. No prior knowledge required.',
    eventType: 'seminar',
    startDate: new Date('2026-03-18T15:00:00Z'),
    endDate: new Date('2026-03-18T17:00:00Z'),
    location: 'Lecture Hall 5',
    organizer: {
      name: 'Blockchain Research Lab',
      contact: 'blockchain@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/QvRXjjrG/Study.webp',
    capacity: 120,
    tags: ['blockchain', 'cryptocurrency', 'web3', 'technology'],
    status: 'upcoming',
  },
  {
    title: 'Photography & Videography Workshop',
    description:
      'Master the basics of photography and videography! Learn composition, lighting, editing with Adobe tools, and storytelling through visual media. Bring your camera or smartphone.',
    eventType: 'extracurricular',
    startDate: new Date('2026-03-02T10:00:00Z'),
    endDate: new Date('2026-03-02T15:00:00Z'),
    location: 'Media Studio, Arts Building',
    organizer: {
      name: 'UIU Photography Club',
      contact: 'photo@uiu.ac.bd',
    },
    image: 'https://i.ibb.co.com/rKJX4Dsp/Evening.webp',
    capacity: 30,
    tags: ['photography', 'videography', 'creative', 'media'],
    status: 'upcoming',
  },
];

const seedEvents = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing events
    await Event.deleteMany({});
    console.log('🗑️  Cleared existing events');

    // Define specific user IDs (excluding Whoop AI)
    const userIds = [
      '694705d265a36461d80c6236', // Farhan Tahsin Khan
      '694797e83043538f27da7733', // Ayon Ameyo
    ];

    console.log(`👥 Using ${userIds.length} specific users as event creators`);

    // Assign users as creators and add some registrations
    const eventsWithCreators = eventsData.map((event, index) => {
      // Alternate between the two users
      const creatorId = userIds[index % userIds.length];

      // Randomly register 0-2 users for each event (since we only have 2 users)
      const numRegistrations = Math.floor(Math.random() * 3);
      const registeredUsers = [];

      for (let i = 0; i < numRegistrations; i++) {
        const randomRegistrant =
          userIds[Math.floor(Math.random() * userIds.length)];
        if (!registeredUsers.includes(randomRegistrant)) {
          registeredUsers.push(randomRegistrant);
        }
      }

      return {
        ...event,
        createdBy: creatorId,
        registeredUsers,
      };
    });

    // Insert events
    const createdEvents = await Event.insertMany(eventsWithCreators);
    console.log(`✅ Created ${createdEvents.length} events`);

    // Display summary
    console.log('\n📊 Event Summary:');
    console.log(
      `   - Workshops: ${createdEvents.filter((e) => e.eventType === 'workshop').length}`,
    );
    console.log(
      `   - Seminars: ${createdEvents.filter((e) => e.eventType === 'seminar').length}`,
    );
    console.log(
      `   - Academic: ${createdEvents.filter((e) => e.eventType === 'academic').length}`,
    );
    console.log(
      `   - Extracurricular: ${createdEvents.filter((e) => e.eventType === 'extracurricular').length}`,
    );
    console.log(
      `   - Social: ${createdEvents.filter((e) => e.eventType === 'social').length}`,
    );

    console.log('\n🎉 Event seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
};

// Run the seed function
seedEvents();
