import { pool } from '../db';

async function seedPublicShowcase() {
  console.log('--- Starting CodeVerse Public Showcase Data Seeding ---');

  // 1. Get a Super Admin user ID to own public courses and problems
  const userRes = await pool.query(
    `SELECT id FROM users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1`
  );
  if (!userRes.rows.length) {
    throw new Error('Super admin user not found in database. Please run seed-users first.');
  }
  const superAdminId = userRes.rows[0].id;

  // 2. SEED COURSES (At least 12 published courses covering requested subjects)
  const coursesToSeed = [
    {
      title: 'C Programming Fundamentals',
      description: 'Master procedural programming, pointer arithmetic, dynamic memory allocation, and low-level system interfaces with ANSI C.',
      languageTags: ['C', 'Systems', 'Pointers'],
      thumbnailUrl: '/thumbnails/c-programming.png',
      sortOrder: 1,
    },
    {
      title: 'Modern C++ & Systems Architecture',
      description: 'Explore RAII, move semantics, smart pointers, template metaprogramming, and concurrent execution in modern C++20.',
      languageTags: ['C++', 'OOP', 'Templates'],
      thumbnailUrl: '/thumbnails/cpp-modern.png',
      sortOrder: 2,
    },
    {
      title: 'Enterprise Java & Spring Boot Core',
      description: 'Build scalable enterprise backend services, RESTful APIs, and distributed architectures using Java 21 and Spring Boot.',
      languageTags: ['Java', 'Spring', 'Backend'],
      thumbnailUrl: '/thumbnails/java-enterprise.png',
      sortOrder: 3,
    },
    {
      title: 'Complete Python Mastery & Data Pipelines',
      description: 'From syntax fundamentals and functional idioms to generators, asyncio, and high-performance data transformation.',
      languageTags: ['Python', 'Automation', 'AsyncIO'],
      thumbnailUrl: '/thumbnails/python-mastery.png',
      sortOrder: 4,
    },
    {
      title: 'Modern JavaScript & TypeScript Engineering',
      description: 'Deep dive into event loop mechanics, closures, asynchronous patterns, strict TypeScript typing, and modern Node.js runtimes.',
      languageTags: ['JavaScript', 'TypeScript', 'Node.js'],
      thumbnailUrl: '/thumbnails/typescript-engineering.png',
      sortOrder: 5,
    },
    {
      title: 'Data Structures & Algorithms in Practice',
      description: 'Comprehensive study of arrays, linked lists, trees, heaps, hash tables, and algorithm complexity analysis (Big-O).',
      languageTags: ['DSA', 'Algorithms', 'Trees'],
      thumbnailUrl: '/thumbnails/dsa-practice.png',
      sortOrder: 6,
    },
    {
      title: 'Advanced Graph Algorithms & Dynamic Programming',
      description: 'Tackle complex shortest-path networks, topological sorting, network flows, and multi-dimensional memoization strategies.',
      languageTags: ['Algorithms', 'Graphs', 'DP'],
      thumbnailUrl: '/thumbnails/advanced-algorithms.png',
      sortOrder: 7,
    },
    {
      title: 'Database Management Systems & PostgreSQL',
      description: 'Relational database schema modeling, ACID transactions, indexing strategies, query execution plans, and Row Level Security.',
      languageTags: ['SQL', 'PostgreSQL', 'Databases'],
      thumbnailUrl: '/thumbnails/dbms-postgres.png',
      sortOrder: 8,
    },
    {
      title: 'Full-Stack Web Development & Modern Architecture',
      description: 'End-to-end full-stack web applications featuring React, Next.js, API design, JWT authentication, and secure session management.',
      languageTags: ['Web', 'React', 'Next.js'],
      thumbnailUrl: '/thumbnails/fullstack-web.png',
      sortOrder: 9,
    },
    {
      title: 'Operating Systems & Concurrency Internals',
      description: 'Process scheduling, thread synchronization, mutexes, semaphores, memory paging, file systems, and kernel system calls.',
      languageTags: ['OS', 'Concurrency', 'Kernels'],
      thumbnailUrl: '/thumbnails/operating-systems.png',
      sortOrder: 10,
    },
    {
      title: 'Distributed Systems & Microservices Architecture',
      description: 'Principles of horizontal scaling, consensus algorithms (Raft/Paxos), message queues, event sourcing, and high-availability patterns.',
      languageTags: ['Distributed', 'Microservices', 'Cloud'],
      thumbnailUrl: '/thumbnails/distributed-systems.png',
      sortOrder: 11,
    },
    {
      title: 'Cloud Native DevOps & Containerization',
      description: 'Containerizing services with Docker, container isolation principles, automated CI/CD pipelines, and cloud deployment runtimes.',
      languageTags: ['DevOps', 'Docker', 'Linux'],
      thumbnailUrl: '/thumbnails/cloud-devops.png',
      sortOrder: 12,
    },
  ];

  console.log('Seeding courses...');
  for (const c of coursesToSeed) {
    const existing = await pool.query(
      `SELECT id FROM courses WHERE title = $1 LIMIT 1`,
      [c.title]
    );
    if (!existing.rows.length) {
      const courseInsert = await pool.query(
        `INSERT INTO courses (title, description, language_tags, thumbnail_url, status, sort_order, created_by, is_deleted)
         VALUES ($1, $2, $3, $4, 'published', $5, $6, FALSE)
         RETURNING id`,
        [c.title, c.description, c.languageTags, c.thumbnailUrl, c.sortOrder, superAdminId]
      );
      const courseId = courseInsert.rows[0].id;

      // Add a module and chapters for each seeded course
      const moduleInsert = await pool.query(
        `INSERT INTO modules (course_id, title, description, order_index, status)
         VALUES ($1, 'Module 1: Foundations & Architecture', 'Core theoretical and practical concepts.', 1, 'published')
         RETURNING id`,
        [courseId]
      );
      const moduleId = moduleInsert.rows[0].id;

      await pool.query(
        `INSERT INTO chapters (module_id, title, content, order_index, status, estimated_minutes)
         VALUES 
          ($1, '1.1 Architectural Introduction', 'Detailed walkthrough of concepts, toolchains, and environment setup.', 1, 'published', 25),
          ($1, '1.2 Practical Implementation Guide', 'Hands-on coding exercises, design patterns, and idiomatic approaches.', 2, 'published', 45)`,
        [moduleId]
      );
    }
  }

  // 3. SEED ORIGINAL CODING PROBLEMS (Ensure 35+ total published global problems)
  const additionalProblems = [
    {
      title: 'Array Chunk Splitter',
      slug: 'array-chunk-splitter',
      category: 'Arrays',
      difficulty: 'easy',
      statement: 'Given an array of integers and a chunk size k, divide the array into sub-arrays where each sub-array has length at most k, maintaining original order.',
      inputFormat: 'Line 1: Array size N and chunk size K.\nLine 2: N space-separated integers.',
      outputFormat: 'Print each chunk on a separate line with elements space-separated.',
      constraintsText: '1 <= K <= N <= 10^5\n-10^6 <= arr[i] <= 10^6',
      sampleExplanation: 'With array [1, 2, 3, 4, 5] and chunk size 2, the chunks are [1, 2], [3, 4], and [5].',
      tags: ['arrays', 'implementation', 'chunking'],
      testCases: [
        { input: '5 2\n1 2 3 4 5', expectedOutput: '1 2\n3 4\n5', isHidden: false, points: 1 },
        { input: '4 4\n10 20 30 40', expectedOutput: '10 20 30 40', isHidden: false, points: 1 },
        { input: '6 1\n7 8 9 1 2 3', expectedOutput: '7\n8\n9\n1\n2\n3', isHidden: true, points: 2 },
      ],
    },
    {
      title: 'Packet Router Traffic Balance',
      slug: 'packet-router-traffic-balance',
      category: 'Queue & Buffers',
      difficulty: 'medium',
      statement: 'A network router receives incoming packet streams across M channels. Determine the minimum buffer capacity required to prevent buffer overrun given arrival and processing timestamps.',
      inputFormat: 'Line 1: Number of packets P.\nNext P lines: arrival time and packet weight.',
      outputFormat: 'Print the maximum concurrent buffer weight observed.',
      constraintsText: '1 <= P <= 5 * 10^4\n0 <= arrival_time <= 10^9',
      sampleExplanation: 'Peak traffic load peaks during simultaneous batch ingestion.',
      tags: ['queues', 'sliding-window', 'simulation'],
      testCases: [
        { input: '3\n1 10\n2 20\n3 15', expectedOutput: '45', isHidden: false, points: 1 },
        { input: '2\n100 5\n200 10', expectedOutput: '15', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'String Compression Run Length',
      slug: 'string-compression-run-length',
      category: 'Strings',
      difficulty: 'easy',
      statement: 'Implement basic string compression using the counts of repeated characters. For example, "aabcccccaaa" becomes "a2b1c5a3". If compressed is not shorter, return original.',
      inputFormat: 'A single non-empty string S containing English letters.',
      outputFormat: 'Print the compressed string, or original if compressed is not shorter.',
      constraintsText: '1 <= |S| <= 10^5',
      sampleExplanation: 'Character runs are counted sequentially and concatenated.',
      tags: ['strings', 'two-pointers'],
      testCases: [
        { input: 'aabcccccaaa', expectedOutput: 'a2b1c5a3', isHidden: false, points: 1 },
        { input: 'abcdef', expectedOutput: 'abcdef', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Matrix Island Surveyor',
      slug: 'matrix-island-surveyor',
      category: 'Graphs & BFS',
      difficulty: 'medium',
      statement: 'Given an m x n 2D binary grid where 1 represents land and 0 represents water, return the number of discrete connected land islands (orthogonal connections only).',
      inputFormat: 'Line 1: Dimensions R and C.\nNext R lines: C characters (0 or 1).',
      outputFormat: 'Print total count of islands.',
      constraintsText: '1 <= R, C <= 300',
      sampleExplanation: 'Connected horizontal and vertical 1s form isolated landmasses.',
      tags: ['graphs', 'bfs', 'dfs', 'matrix'],
      testCases: [
        { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1', isHidden: false, points: 1 },
        { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Log Stream Event Window',
      slug: 'log-stream-event-window',
      category: 'Sliding Window',
      difficulty: 'hard',
      statement: 'Given a stream of server event timestamps in milliseconds, find the maximum number of error events that occurred within any sliding continuous window of size W.',
      inputFormat: 'Line 1: Total events N and window duration W in ms.\nLine 2: N sorted timestamps.',
      outputFormat: 'Print the maximum event count inside any interval [t, t + W].',
      constraintsText: '1 <= N <= 10^5\n1 <= W <= 10^8',
      sampleExplanation: 'Sliding window technique tracks maximum density of events.',
      tags: ['sliding-window', 'two-pointers', 'arrays'],
      testCases: [
        { input: '6 100\n10 50 90 120 180 200', expectedOutput: '4', isHidden: false, points: 1 },
        { input: '3 50\n10 100 200', expectedOutput: '1', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Binary Tree Level Average',
      slug: 'binary-tree-level-average',
      category: 'Trees',
      difficulty: 'medium',
      statement: 'Given level-order serialization of a binary tree, compute the floating-point average value of the nodes on each level.',
      inputFormat: 'Line 1: Space-separated values where "null" indicates missing node.',
      outputFormat: 'Print level averages rounded to two decimal places.',
      constraintsText: '1 <= total_nodes <= 10^4\n-10^5 <= node_val <= 10^5',
      sampleExplanation: 'Level order traversal (BFS) accumulates sum and counts for each level.',
      tags: ['trees', 'bfs', 'binary-tree'],
      testCases: [
        { input: '3 9 20 null null 15 7', expectedOutput: '3.00 14.50 11.00', isHidden: false, points: 1 },
        { input: '1 2 3', expectedOutput: '1.00 2.50', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'LRU Cache Access Model',
      slug: 'lru-cache-access-model',
      category: 'Design & HashMaps',
      difficulty: 'hard',
      statement: 'Simulate a Least Recently Used (LRU) key-value cache of capacity C responding to GET and PUT commands. Return the stream of output responses.',
      inputFormat: 'Line 1: Capacity C and Operations count Q.\nNext Q lines: operations "GET key" or "PUT key value".',
      outputFormat: 'Print the result of each GET operation (-1 if not present).',
      constraintsText: '1 <= C <= 1000\n1 <= Q <= 2 * 10^4',
      sampleExplanation: 'Doubly linked list combined with hash map provides O(1) eviction.',
      tags: ['design', 'linked-list', 'hash-table'],
      testCases: [
        { input: '2 5\nPUT 1 10\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2', expectedOutput: '10\n-1', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Bitwise Hamming Distance Aggregate',
      slug: 'bitwise-hamming-distance-aggregate',
      category: 'Bit Manipulation',
      difficulty: 'easy',
      statement: 'The Hamming distance between two integers is the number of positions at which the corresponding bits are different. Calculate total Hamming distance between all pairs in an array.',
      inputFormat: 'Line 1: Array length N.\nLine 2: N space-separated non-negative integers.',
      outputFormat: 'Print the sum of Hamming distances between all unordered pairs.',
      constraintsText: '1 <= N <= 10^4\n0 <= nums[i] <= 10^9',
      sampleExplanation: 'Counting ones and zeros per bit position computes total combinations in O(32 * N).',
      tags: ['bit-manipulation', 'math'],
      testCases: [
        { input: '3\n4 14 2', expectedOutput: '6', isHidden: false, points: 1 },
        { input: '2\n1 4', expectedOutput: '2', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Top K Frequent Elements',
      slug: 'top-k-frequent-elements',
      category: 'Heaps & Sorting',
      difficulty: 'medium',
      statement: 'Given an integer array nums and an integer k, return the k most frequent elements in descending order of their occurrence frequency.',
      inputFormat: 'Line 1: Array size N and threshold K.\nLine 2: N space-separated integers.',
      outputFormat: 'Print the K most frequent numbers separated by spaces.',
      constraintsText: '1 <= K <= N <= 10^5\n-10^4 <= nums[i] <= 10^4',
      sampleExplanation: 'Hash frequency map with min-heap or bucket sort produces top elements.',
      tags: ['heap', 'hash-table', 'sorting'],
      testCases: [
        { input: '6 2\n1 1 1 2 2 3', expectedOutput: '1 2', isHidden: false, points: 1 },
        { input: '1 1\n42', expectedOutput: '42', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Valid Arithmetic Expression Evaluator',
      slug: 'valid-arithmetic-expression-evaluator',
      category: 'Stacks & Parsers',
      difficulty: 'medium',
      statement: 'Evaluate an infix arithmetic expression containing non-negative integers, addition (+), subtraction (-), multiplication (*), and division (/) with operator precedence.',
      inputFormat: 'A single string expression S without spaces.',
      outputFormat: 'Print the integer result (truncate towards zero).',
      constraintsText: '1 <= |S| <= 10^5',
      sampleExplanation: 'Two-stack or operator precedence parsing ensures correct order of evaluation.',
      tags: ['stack', 'math', 'string-parsing'],
      testCases: [
        { input: '3+2*2', expectedOutput: '7', isHidden: false, points: 1 },
        { input: '3/2', expectedOutput: '1', isHidden: false, points: 1 },
        { input: '3+5/2', expectedOutput: '5', isHidden: false, points: 1 },
      ],
    },
    {
      title: 'Shortest Maze Escape Path',
      slug: 'shortest-maze-escape-path',
      category: 'Graphs & BFS',
      difficulty: 'medium',
      statement: 'Given a grid maze with obstacles (#) and open corridors (.), find the length of the shortest path from start (S) to exit (E). Return -1 if unreachable.',
      inputFormat: 'Line 1: Rows R and Columns C.\nNext R lines: C characters describing the maze grid.',
      outputFormat: 'Print minimum steps count, or -1.',
      constraintsText: '2 <= R, C <= 200',
      sampleExplanation: 'Breadth-First Search (BFS) guarantees discovering shortest path in unweighted graphs.',
      tags: ['graphs', 'bfs', 'shortest-path'],
      testCases: [
        { input: '3 3\nS..\n.#.\n..E', expectedOutput: '4', isHidden: false, points: 1 },
        { input: '3 3\nS#.\n###\n..E', expectedOutput: '-1', isHidden: false, points: 1 },
      ],
    },
  ];

  console.log('Seeding coding problems...');
  for (const p of additionalProblems) {
    const existing = await pool.query(
      `SELECT id FROM problems WHERE slug = $1 LIMIT 1`,
      [p.slug]
    );
    if (!existing.rows.length) {
      const probRes = await pool.query(
        `INSERT INTO problems 
          (created_by, title, slug, statement, input_format, output_format, constraints_text, sample_explanation, difficulty, scope, tags, status, is_deleted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'public', $10, 'published', FALSE)
         RETURNING id`,
        [
          superAdminId,
          p.title,
          p.slug,
          p.statement,
          p.inputFormat,
          p.outputFormat,
          p.constraintsText,
          p.sampleExplanation,
          p.difficulty,
          p.tags,
        ]
      );
      const problemId = probRes.rows[0].id;

      for (let i = 0; i < p.testCases.length; i++) {
        const tc = p.testCases[i];
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, points, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [problemId, tc.input, tc.expectedOutput, tc.isHidden, tc.points, i + 1]
        );
      }
    }
  }

  // 4. SEED FAQS (Ensure at least 18 comprehensive FAQs)
  const faqsToSeed = [
    {
      category: 'General',
      question: 'What is CodeVerse?',
      answer: 'CodeVerse is an enterprise-grade developer education and multi-tenant sandboxing platform built for learners, universities, coding bootcamps, and engineering organizations.',
    },
    {
      category: 'General',
      question: 'Can I browse courses and problems without an account?',
      answer: 'Yes! CodeVerse supports full guest mode browsing. Anyone can explore courses, curricula, problem statements, supported compiler runtimes, and engineering articles without logging in.',
    },
    {
      category: 'Platform & Execution',
      question: 'How does code execution work on CodeVerse?',
      answer: 'CodeVerse implements a hybrid architecture: ultra-low latency WebAssembly (WASM) micro-sandboxing in the browser for instant feedback, with seamless fallback to isolated multi-node Judge0 container clusters for resource-intensive languages.',
    },
    {
      category: 'Platform & Execution',
      question: 'What programming languages are supported?',
      answer: 'CodeVerse currently supports 16 programming languages including Python, C, C++, Java, JavaScript, TypeScript, Rust, Go, C#, Ruby, PHP, Swift, Kotlin, Bash, Scala, and SQL.',
    },
    {
      category: 'Courses',
      question: 'Are CodeVerse courses beginner friendly?',
      answer: 'Yes. Courses range from introductory fundamentals (such as C Programming and Python Basics) to advanced masterclasses (such as Concurrency Internals and Distributed Systems Architecture).',
    },
    {
      category: 'Courses',
      question: 'Do I get progress tracking across chapters?',
      answer: 'When you create a free learner account and enroll in a course, your chapter completions, quiz attempts, and coding exercise benchmarks are automatically synchronized across all your devices.',
    },
    {
      category: 'Challenges',
      question: 'Can I test my code before submitting?',
      answer: 'Yes. In the Online IDE and challenge workbench, you can run test cases against custom inputs in the playground sandbox before committing an official graded submission.',
    },
    {
      category: 'Challenges',
      question: 'Why do I need an account to submit solutions?',
      answer: 'An account is required for official submissions so the platform can compute execution benchmarks, record test case verification scores, and rank your accomplishments on platform leaderboards.',
    },
    {
      category: 'Campus & Institutions',
      question: 'How do universities and bootcamps use CodeVerse?',
      answer: 'Institutions can register for a dedicated campus tenant with private course authoring, custom cohort batches, automated plagiarism detection, and institutional gradebooks.',
    },
    {
      category: 'Campus & Institutions',
      question: 'How do we apply for an institutional portal?',
      answer: 'College deans and program coordinators can submit an application via the /apply-institution page. Applications are reviewed by CodeVerse administrators within 2 business days.',
    },
    {
      category: 'Security & Privacy',
      question: 'Is my submitted code secure and isolated?',
      answer: 'Every execution job runs in an ephemeral, memory-capped, CPU-throttled sandbox with network egress strictly blocked to guarantee zero-risk execution and complete security.',
    },
    {
      category: 'Security & Privacy',
      question: 'Does CodeVerse comply with data protection regulations?',
      answer: 'Yes. CodeVerse adheres to strict data minimization principles, SOC 2 compliance standards, and utilizes PostgreSQL Row Level Security (RLS) to enforce complete tenant data isolation.',
    },
    {
      category: 'Account & Settings',
      question: 'How can I change my workspace theme?',
      answer: 'Click the sun/moon theme toggle located in the top navigation bar to seamlessly alternate between dark mode and light mode. Your preference is persisted locally.',
    },
    {
      category: 'Account & Settings',
      question: 'What keyboard shortcuts are available?',
      answer: 'Press Ctrl+K (or Cmd+K on macOS) at any time to activate the Global Command Palette and instantly search courses, challenges, articles, and navigation destinations.',
    },
    {
      category: 'IDE & Playground',
      question: 'Can I use the Online IDE for personal scripts?',
      answer: 'Yes! The CodeVerse Online IDE features multi-tab file editing, custom stdin streaming, terminal output panels, and supports saving multiple workspace projects.',
    },
    {
      category: 'IDE & Playground',
      question: 'Does the IDE require any local software installations?',
      answer: 'None whatsoever. Everything executes directly inside modern browsers through WASM or our cloud compiler nodes with zero local dependencies.',
    },
    {
      category: 'Support',
      question: 'How do I contact customer support?',
      answer: 'Visitors and learners can submit support tickets through our Help Center at /contact. Institutional administrators also receive dedicated priority SLA channels.',
    },
    {
      category: 'Support',
      question: 'Where can I read release updates and technical deep dives?',
      answer: 'Visit the CodeVerse Blog at /blog to read monthly engineering updates, compiler design breakdowns, algorithmic tutorials, and product roadmaps.',
    },
  ];

  console.log('Seeding FAQs...');
  for (let i = 0; i < faqsToSeed.length; i++) {
    const f = faqsToSeed[i];
    const existing = await pool.query(
      `SELECT id FROM faqs WHERE question = $1 LIMIT 1`,
      [f.question]
    );
    if (!existing.rows.length) {
      await pool.query(
        `INSERT INTO faqs (category, question, answer, display_order, is_active, created_by)
         VALUES ($1, $2, $3, $4, TRUE, $5)`,
        [f.category, f.question, f.answer, i + 1, superAdminId]
      );
    }
  }

  console.log('--- CodeVerse Public Showcase Seeding Completed Successfully ---');
}

seedPublicShowcase()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
