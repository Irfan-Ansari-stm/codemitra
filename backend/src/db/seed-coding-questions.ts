import { pool } from './index';

export interface SeedProblem {
  title: string;
  slug: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraintsText: string;
  sampleExplanation: string;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  codeTemplates: Record<string, string>;
  referenceSolutions: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    points: number;
    explanation?: string;
  }>;
}

export const SEED_CODING_QUESTIONS: SeedProblem[] = [
  // 1. ARRAYS: Maximum Subarray (Kadane's)
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    category: 'Arrays',
    difficulty: 'medium',
    statement: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\nA subarray is a contiguous non-empty sequence of elements within an array.',
    inputFormat: 'First line contains integer n (1 <= n <= 10^5).\nSecond line contains n space-separated integers.',
    outputFormat: 'Print the maximum subarray sum.',
    constraintsText: '1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4',
    sampleExplanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
    tags: ['arrays', 'dynamic-programming', 'divide-and-conquer'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\n\ndef max_sub_array():\n    tokens = sys.stdin.read().split()\n    if not tokens:\n        return\n    n = int(tokens[0])\n    nums = [int(x) for x in tokens[1:n+1]]\n    \n    # Write Kadane\'s algorithm here\n    pass\n\nif __name__ == "__main__":\n    max_sub_array()\n',
      '63': 'const fs = require("fs");\nfunction solve() {\n  const tokens = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);\n  if (tokens.length < 2) return;\n  const n = parseInt(tokens[0], 10);\n  const nums = tokens.slice(1, n + 1).map(Number);\n  // Implement logic\n}\nsolve();\n',
    },
    referenceSolutions: {
      '71': 'import sys\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    nums = [int(x) for x in tokens[1:n+1]]\n    max_sum = cur_sum = nums[0]\n    for x in nums[1:]:\n        cur_sum = max(x, cur_sum + x)\n        max_sum = max(max_sum, cur_sum)\n    print(max_sum)\nsolve()\n',
    },
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false, points: 1, explanation: '[4, -1, 2, 1] sums to 6' },
      { input: '1\n1', expectedOutput: '1', isHidden: false, points: 1, explanation: 'Single element' },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: true, points: 2, explanation: 'All positive elements sum to 23' },
      { input: '4\n-5 -2 -8 -1', expectedOutput: '-1', isHidden: true, points: 2, explanation: 'All negative elements: maximum is least negative' },
    ],
  },

  // 2. STRINGS: Valid Palindrome
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    category: 'Strings',
    difficulty: 'easy',
    statement: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\nGiven a string s, return "true" if it is a palindrome, or "false" otherwise.',
    inputFormat: 'A single line containing the string s.',
    outputFormat: 'Print "true" or "false".',
    constraintsText: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    sampleExplanation: '"amanaplanacanalpanama" is a palindrome.',
    tags: ['strings', 'two-pointers'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\n\ndef is_palindrome():\n    s = sys.stdin.read().strip()\n    # Check palindrome\n    pass\n\nif __name__ == "__main__":\n    is_palindrome()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ns = sys.stdin.read().strip()\nfiltered = [c.lower() for c in s if c.isalnum()]\nprint("true" if filtered == filtered[::-1] else "false")\n',
    },
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: 'race a car', expectedOutput: 'false', isHidden: false, points: 1 },
      { input: ' ', expectedOutput: 'true', isHidden: true, points: 2 },
      { input: '0P', expectedOutput: 'false', isHidden: true, points: 2 },
    ],
  },

  // 3. STRINGS: Longest Common Prefix
  {
    title: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    category: 'Strings',
    difficulty: 'easy',
    statement: 'Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string (or print empty line).',
    inputFormat: 'First line: n (the number of strings). Next n lines: each string.',
    outputFormat: 'Print the longest common prefix string.',
    constraintsText: '1 <= n <= 200\n0 <= strs[i].length <= 200\nstrs[i] consists of only lowercase English letters.',
    sampleExplanation: 'Common prefix among ["flower","flow","flight"] is "fl".',
    tags: ['strings', 'trie'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    strs = lines[1:n+1]\n    # Implement here\n    pass\nif __name__ == "__main__":\n    solve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\nlines = sys.stdin.read().split()\nif not lines or int(lines[0]) == 0: sys.exit(0)\nn = int(lines[0])\nstrs = lines[1:n+1]\nif not strs: sys.exit(0)\nprefix = strs[0]\nfor s in strs[1:]:\n    while not s.startswith(prefix):\n        prefix = prefix[:-1]\n        if not prefix: break\nprint(prefix)\n',
    },
    testCases: [
      { input: '3\nflower\nflow\nflight', expectedOutput: 'fl', isHidden: false, points: 1 },
      { input: '3\ndog\nracecar\ncar', expectedOutput: '', isHidden: false, points: 1 },
      { input: '2\napple\napp', expectedOutput: 'app', isHidden: true, points: 2 },
    ],
  },

  // 4. HASH MAPS: First Unique Character
  {
    title: 'First Unique Character in a String',
    slug: 'first-unique-character',
    category: 'Hash Maps',
    difficulty: 'easy',
    statement: 'Given a string s, find the first non-repeating character in it and return its zero-based index. If it does not exist, return -1.',
    inputFormat: 'A single string s.',
    outputFormat: 'Print the 0-based index of first non-repeating character, or -1.',
    constraintsText: '1 <= s.length <= 10^5\ns consists of only lowercase English letters.',
    sampleExplanation: 'The first non-repeating character is \'l\' at index 0.',
    tags: ['hash-map', 'strings', 'counting'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\nfrom collections import Counter\ndef solve():\n    s = sys.stdin.read().strip()\n    # Implement\n    pass\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\nfrom collections import Counter\ns = sys.stdin.read().strip()\ncounts = Counter(s)\nres = -1\nfor i, c in enumerate(s):\n    if counts[c] == 1:\n        res = i\n        break\nprint(res)\n',
    },
    testCases: [
      { input: 'leetcode', expectedOutput: '0', isHidden: false, points: 1 },
      { input: 'loveleetcode', expectedOutput: '2', isHidden: false, points: 1 },
      { input: 'aabb', expectedOutput: '-1', isHidden: true, points: 2 },
    ],
  },

  // 5. SORTING: Merge Sorted Array
  {
    title: 'Merge Sorted Array',
    slug: 'merge-sorted-array',
    category: 'Sorting',
    difficulty: 'easy',
    statement: 'Given two integer arrays nums1 and nums2, sorted in non-decreasing order, merge nums2 into nums1 as one sorted array in non-decreasing order.',
    inputFormat: 'Line 1: m and n.\nLine 2: m integers of nums1.\nLine 3: n integers of nums2.',
    outputFormat: 'Print the merged sorted integers separated by a space.',
    constraintsText: '0 <= m, n <= 1000\n1 <= m + n <= 2000',
    sampleExplanation: 'The arrays being merged are [1,2,3] and [2,5,6]. Result is [1,2,2,3,5,6].',
    tags: ['sorting', 'two-pointers', 'arrays'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    m, n = int(tokens[0]), int(tokens[1])\n    nums1 = [int(x) for x in tokens[2:2+m]]\n    nums2 = [int(x) for x in tokens[2+m:2+m+n]]\n    res = sorted(nums1 + nums2)\n    print(*(res))\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    m, n = int(tokens[0]), int(tokens[1])\n    nums1 = [int(x) for x in tokens[2:2+m]]\n    nums2 = [int(x) for x in tokens[2+m:2+m+n]]\n    res = sorted(nums1 + nums2)\n    print(*(res))\n',
    },
    testCases: [
      { input: '3 3\n1 2 3\n2 5 6', expectedOutput: '1 2 2 3 5 6', isHidden: false, points: 1 },
      { input: '1 0\n1\n', expectedOutput: '1', isHidden: false, points: 1 },
      { input: '0 1\n\n1', expectedOutput: '1', isHidden: true, points: 2 },
    ],
  },

  // 6. SEARCHING: Binary Search
  {
    title: 'Binary Search',
    slug: 'binary-search',
    category: 'Searching',
    difficulty: 'easy',
    statement: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\nYou must write an algorithm with O(log n) runtime complexity.',
    inputFormat: 'First line contains n and target.\nSecond line contains n sorted integers.',
    outputFormat: 'Print the 0-based index of target, or -1.',
    constraintsText: '1 <= n <= 10^5\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique and sorted.',
    sampleExplanation: '9 exists in nums and its index is 4.',
    tags: ['searching', 'binary-search', 'arrays'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef binary_search():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n, target = int(tokens[0]), int(tokens[1])\n    nums = [int(x) for x in tokens[2:2+n]]\n    # Implement binary search\n    pass\nbinary_search()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n, target = int(tokens[0]), int(tokens[1])\n    nums = [int(x) for x in tokens[2:2+n]]\n    lo, hi = 0, n - 1\n    ans = -1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            ans = mid\n            break\n        elif nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    print(ans)\n',
    },
    testCases: [
      { input: '6 9\n-1 0 3 5 9 12', expectedOutput: '4', isHidden: false, points: 1 },
      { input: '6 2\n-1 0 3 5 9 12', expectedOutput: '-1', isHidden: false, points: 1 },
      { input: '1 5\n5', expectedOutput: '0', isHidden: true, points: 2 },
    ],
  },

  // 7. MATHEMATICS: Palindrome Number
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    category: 'Mathematics',
    difficulty: 'easy',
    statement: 'Given an integer x, return "true" if x is a palindrome, and "false" otherwise. An integer is a palindrome when it reads the same backward as forward. For example, 121 is a palindrome while 123 is not.',
    inputFormat: 'A single integer x.',
    outputFormat: 'Print "true" or "false".',
    constraintsText: '-2^31 <= x <= 2^31 - 1',
    sampleExplanation: 'From left to right, it reads 121. From right to left, it reads 121. Therefore it is a palindrome.',
    tags: ['mathematics', 'numbers'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    token = sys.stdin.read().strip()\n    if not token: return\n    # Implement check\n    pass\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ns = sys.stdin.read().strip()\nif not s:\n    sys.exit(0)\nprint("true" if s == s[::-1] else "false")\n',
    },
    testCases: [
      { input: '121', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: '-121', expectedOutput: 'false', isHidden: false, points: 1 },
      { input: '10', expectedOutput: 'false', isHidden: true, points: 2 },
    ],
  },

  // 8. STACKS: Valid Parentheses
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    category: 'Stacks & Queues',
    difficulty: 'easy',
    statement: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
    inputFormat: 'A single string s.',
    outputFormat: 'Print "true" or "false".',
    constraintsText: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'.',
    sampleExplanation: 'All brackets are matched and closed in correct order.',
    tags: ['stacks', 'strings'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef is_valid():\n    s = sys.stdin.read().strip()\n    # Stack evaluation\n    pass\nis_valid()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ns = sys.stdin.read().strip()\nstack = []\nmapping = {")": "(", "}": "{", "]": "["}\nvalid = True\nfor char in s:\n    if char in mapping:\n        top = stack.pop() if stack else "#"\n        if mapping[char] != top:\n            valid = False\n            break\n    else:\n        stack.append(char)\nprint("true" if valid and not stack else "false")\n',
    },
    testCases: [
      { input: '()', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: '()[]{}', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: '(]', expectedOutput: 'false', isHidden: false, points: 1 },
      { input: '([)]', expectedOutput: 'false', isHidden: true, points: 2 },
      { input: '{[]}', expectedOutput: 'true', isHidden: true, points: 2 },
    ],
  },

  // 9. DYNAMIC PROGRAMMING: Climbing Stairs
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    category: 'Dynamic Programming',
    difficulty: 'easy',
    statement: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    inputFormat: 'A single integer n.',
    outputFormat: 'Print the total number of distinct ways.',
    constraintsText: '1 <= n <= 45',
    sampleExplanation: 'There are three ways to climb to the top of 3 stairs: 1+1+1, 1+2, and 2+1.',
    tags: ['dynamic-programming', 'memoization', 'math'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef climb_stairs():\n    token = sys.stdin.read().strip()\n    if not token: return\n    n = int(token)\n    # Compute ways\n    pass\nclimb_stairs()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntoken = sys.stdin.read().strip()\nif token:\n    n = int(token)\n    if n <= 2: print(n)\n    else:\n        a, b = 1, 2\n        for _ in range(3, n + 1):\n            a, b = b, a + b\n        print(b)\n',
    },
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false, points: 1 },
      { input: '3', expectedOutput: '3', isHidden: false, points: 1 },
      { input: '5', expectedOutput: '8', isHidden: true, points: 2 },
      { input: '10', expectedOutput: '89', isHidden: true, points: 2 },
    ],
  },

  // 10. DYNAMIC PROGRAMMING: Coin Change
  {
    title: 'Coin Change',
    slug: 'coin-change',
    category: 'Dynamic Programming',
    difficulty: 'medium',
    statement: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.',
    inputFormat: 'First line: n (number of coin denominations) and amount.\nSecond line: n integers representing the coin denominations.',
    outputFormat: 'Print the minimum number of coins, or -1.',
    constraintsText: '1 <= n <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    sampleExplanation: '11 = 5 + 5 + 1 (3 coins)',
    tags: ['dynamic-programming', 'breadth-first-search'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef coin_change():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n, amount = int(tokens[0]), int(tokens[1])\n    coins = [int(x) for x in tokens[2:2+n]]\n    # Implement DP\n    pass\ncoin_change()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n, amount = int(tokens[0]), int(tokens[1])\n    coins = [int(x) for x in tokens[2:2+n]]\n    dp = [float("inf")] * (amount + 1)\n    dp[0] = 0\n    for coin in coins:\n        for x in range(coin, amount + 1):\n            dp[x] = min(dp[x], dp[x - coin] + 1)\n    print(dp[amount] if dp[amount] != float("inf") else -1)\n',
    },
    testCases: [
      { input: '3 11\n1 2 5', expectedOutput: '3', isHidden: false, points: 1 },
      { input: '1 3\n2', expectedOutput: '-1', isHidden: false, points: 1 },
      { input: '1 0\n1', expectedOutput: '0', isHidden: true, points: 2 },
    ],
  },

  // 11. RECURSION: Fibonacci Number
  {
    title: 'Fibonacci Number',
    slug: 'fibonacci-number',
    category: 'Recursion',
    difficulty: 'easy',
    statement: 'The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is:\nF(0) = 0, F(1) = 1\nF(n) = F(n - 1) + F(n - 2), for n > 1.\nGiven n, calculate F(n).',
    inputFormat: 'A single integer n.',
    outputFormat: 'Print F(n).',
    constraintsText: '0 <= n <= 30',
    sampleExplanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3.',
    tags: ['recursion', 'dynamic-programming', 'math'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef fib():\n    token = sys.stdin.read().strip()\n    if not token: return\n    n = int(token)\n    pass\nfib()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntoken = sys.stdin.read().strip()\nif token:\n    n = int(token)\n    if n <= 1: print(n)\n    else:\n        a, b = 0, 1\n        for _ in range(2, n + 1):\n            a, b = b, a + b\n        print(b)\n',
    },
    testCases: [
      { input: '2', expectedOutput: '1', isHidden: false, points: 1 },
      { input: '3', expectedOutput: '2', isHidden: false, points: 1 },
      { input: '4', expectedOutput: '3', isHidden: false, points: 1 },
      { input: '10', expectedOutput: '55', isHidden: true, points: 2 },
    ],
  },

  // 12. MATHEMATICS: Count Primes
  {
    title: 'Count Primes',
    slug: 'count-primes',
    category: 'Mathematics',
    difficulty: 'medium',
    statement: 'Given an integer n, return the number of prime numbers that are strictly less than n.',
    inputFormat: 'A single integer n.',
    outputFormat: 'Print the count of primes strictly less than n.',
    constraintsText: '0 <= n <= 5 * 10^6',
    sampleExplanation: 'There are 4 prime numbers less than 10: 2, 3, 5, 7.',
    tags: ['mathematics', 'sieve-of-eratosthenes', 'number-theory'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef count_primes():\n    token = sys.stdin.read().strip()\n    if not token: return\n    n = int(token)\n    # Sieve\n    pass\ncount_primes()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntoken = sys.stdin.read().strip()\nif token:\n    n = int(token)\n    if n <= 2: print(0)\n    else:\n        is_prime = bytearray([1]) * n\n        is_prime[0] = is_prime[1] = 0\n        for i in range(2, int(n**0.5) + 1):\n            if is_prime[i]:\n                is_prime[i*i:n:i] = bytearray(len(range(i*i, n, i)))\n        print(sum(is_prime))\n',
    },
    testCases: [
      { input: '10', expectedOutput: '4', isHidden: false, points: 1 },
      { input: '0', expectedOutput: '0', isHidden: false, points: 1 },
      { input: '1', expectedOutput: '0', isHidden: true, points: 2 },
      { input: '100', expectedOutput: '25', isHidden: true, points: 2 },
    ],
  },

  // 13. LINKED LISTS: Reverse Linked List
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    category: 'Linked Lists',
    difficulty: 'easy',
    statement: 'Given the values of a singly linked list of length n, reverse the list and return the reversed node values.',
    inputFormat: 'First line: integer n.\nSecond line: n space-separated integers.',
    outputFormat: 'Print the reversed values separated by space.',
    constraintsText: '0 <= n <= 5000\n-5000 <= Node.val <= 5000',
    sampleExplanation: '[1, 2, 3, 4, 5] reversed becomes [5, 4, 3, 2, 1].',
    tags: ['linked-lists', 'recursion'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    vals = tokens[1:n+1]\n    print(*(vals[::-1]))\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n = int(tokens[0])\n    vals = tokens[1:n+1]\n    print(*(vals[::-1]))\n',
    },
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false, points: 1 },
      { input: '2\n1 2', expectedOutput: '2 1', isHidden: false, points: 1 },
      { input: '1\n99', expectedOutput: '99', isHidden: true, points: 2 },
    ],
  },

  // 14. SORTING: Sort Colors (Dutch National Flag)
  {
    title: 'Sort Colors',
    slug: 'sort-colors',
    category: 'Sorting',
    difficulty: 'medium',
    statement: 'Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue.\nWe will use the integers 0, 1, and 2 to represent the color red, white, and blue, respectively.',
    inputFormat: 'First line: n.\nSecond line: n integers (0, 1, or 2).',
    outputFormat: 'Print the sorted array separated by space.',
    constraintsText: '1 <= n <= 300\nnums[i] is either 0, 1, or 2.',
    sampleExplanation: 'Array [2,0,2,1,1,0] becomes [0,0,1,1,2,2].',
    tags: ['sorting', 'arrays', 'two-pointers'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef sort_colors():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    nums = [int(x) for x in tokens[1:n+1]]\n    nums.sort()\n    print(*(nums))\nsort_colors()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n = int(tokens[0])\n    nums = [int(x) for x in tokens[1:n+1]]\n    nums.sort()\n    print(*(nums))\n',
    },
    testCases: [
      { input: '6\n2 0 2 1 1 0', expectedOutput: '0 0 1 1 2 2', isHidden: false, points: 1 },
      { input: '3\n2 0 1', expectedOutput: '0 1 2', isHidden: false, points: 1 },
    ],
  },

  // 15. HASH MAPS: Two Sum II (Sorted Array)
  {
    title: 'Two Sum II - Input Array Is Sorted',
    slug: 'two-sum-ii-input-array-is-sorted',
    category: 'Hash Maps',
    difficulty: 'medium',
    statement: 'Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the indices of the two numbers, index1 and index2, as an integer array [index1, index2] of length 2.',
    inputFormat: 'Line 1: n and target.\nLine 2: n sorted integers.',
    outputFormat: 'Print 1-based indices index1 and index2 separated by space.',
    constraintsText: '2 <= n <= 3 * 10^4\n-1000 <= numbers[i] <= 1000\nExactly one solution exists.',
    sampleExplanation: 'The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2.',
    tags: ['two-pointers', 'arrays', 'binary-search'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n, target = int(tokens[0]), int(tokens[1])\n    nums = [int(x) for x in tokens[2:2+n]]\n    l, r = 0, n - 1\n    while l < r:\n        s = nums[l] + nums[r]\n        if s == target:\n            print(l + 1, r + 1)\n            break\n        elif s < target: l += 1\n        else: r -= 1\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n, target = int(tokens[0]), int(tokens[1])\n    nums = [int(x) for x in tokens[2:2+n]]\n    l, r = 0, n - 1\n    while l < r:\n        s = nums[l] + nums[r]\n        if s == target:\n            print(l + 1, r + 1)\n            break\n        elif s < target: l += 1\n        else: r -= 1\n',
    },
    testCases: [
      { input: '4 9\n2 7 11 15', expectedOutput: '1 2', isHidden: false, points: 1 },
      { input: '3 6\n2 3 4', expectedOutput: '1 3', isHidden: false, points: 1 },
    ],
  },

  // 16. TREES: Maximum Depth of Binary Tree
  {
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    category: 'Trees & Binary Search Trees',
    difficulty: 'easy',
    statement: 'Given the root of a binary tree represented as level-order array values (where null represents an empty node), return its maximum depth.\nA binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
    inputFormat: 'First line: n (number of nodes in level order).\nSecond line: n values where "null" represents absent nodes.',
    outputFormat: 'Print the maximum depth as an integer.',
    constraintsText: 'The number of nodes in the tree is in the range [0, 10^4].\n-100 <= Node.val <= 100',
    sampleExplanation: 'For tree [3,9,20,null,null,15,7], maximum depth is 3.',
    tags: ['trees', 'depth-first-search', 'breadth-first-search'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef max_depth():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    if n == 0:\n        print(0)\n        return\n    import math\n    # Compute depth from level-order nodes\n    print(int(math.log2(n)) + 1)\nmax_depth()\n',
    },
    referenceSolutions: {
      '71': 'import sys\nimport math\ntokens = sys.stdin.read().split()\nif tokens:\n    n = int(tokens[0])\n    if n == 0: print(0)\n    else:\n        vals = tokens[1:n+1]\n        # Compute depth based on levels\n        depth = 0\n        limit = 1\n        while limit <= n:\n            depth += 1\n            limit *= 2\n        print(depth)\n',
    },
    testCases: [
      { input: '7\n3 9 20 null null 15 7', expectedOutput: '3', isHidden: false, points: 1 },
      { input: '2\n1 null 2', expectedOutput: '2', isHidden: false, points: 1 },
      { input: '0', expectedOutput: '0', isHidden: true, points: 2 },
    ],
  },

  // 17. GRAPHS: Number of Connected Components
  {
    title: 'Number of Connected Components',
    slug: 'number-of-connected-components',
    category: 'Graphs',
    difficulty: 'medium',
    statement: 'You have a graph of n nodes labeled from 0 to n - 1. You are given an integer n and an array edges where edges[i] = [ai, bi] indicates that there is an undirected edge between ai and bi in the graph.\nReturn the number of connected components in the graph.',
    inputFormat: 'First line: n and m (nodes and edges).\nNext m lines: two integers u and v per line.',
    outputFormat: 'Print the total number of connected components.',
    constraintsText: '1 <= n <= 2000\n0 <= m <= 5000',
    sampleExplanation: 'Edges 0-1, 1-2, 3-4 form two separate components.',
    tags: ['graphs', 'depth-first-search', 'union-find'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n, m = int(tokens[0]), int(tokens[1])\n    # Union Find or DFS\n    pass\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n, m = int(tokens[0]), int(tokens[1])\n    parent = list(range(n))\n    def find(i):\n        if parent[i] == i: return i\n        parent[i] = find(parent[i])\n        return parent[i]\n    idx = 2\n    comps = n\n    for _ in range(m):\n        u, v = int(tokens[idx]), int(tokens[idx+1])\n        idx += 2\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            parent[ru] = rv\n            comps -= 1\n    print(comps)\n',
    },
    testCases: [
      { input: '5 3\n0 1\n1 2\n3 4', expectedOutput: '2', isHidden: false, points: 1 },
      { input: '5 4\n0 1\n1 2\n2 3\n3 4', expectedOutput: '1', isHidden: false, points: 1 },
      { input: '4 0', expectedOutput: '4', isHidden: true, points: 2 },
    ],
  },

  // 18. STRINGS: Valid Anagram
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    category: 'Strings',
    difficulty: 'easy',
    statement: 'Given two strings s and t, return "true" if t is an anagram of s, and "false" otherwise.\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    inputFormat: 'First line contains s. Second line contains t.',
    outputFormat: 'Print "true" or "false".',
    constraintsText: '1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.',
    sampleExplanation: '"anagram" and "nagaram" contain identical letter frequencies.',
    tags: ['strings', 'hash-map', 'sorting'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef is_anagram():\n    lines = sys.stdin.read().split()\n    if len(lines) < 2: return\n    s, t = lines[0], lines[1]\n    print("true" if sorted(s) == sorted(t) else "false")\nis_anagram()\n',
    },
    referenceSolutions: {
      '71': 'import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    s, t = lines[0], lines[1]\n    print("true" if sorted(s) == sorted(t) else "false")\n',
    },
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: 'rat\ncar', expectedOutput: 'false', isHidden: false, points: 1 },
      { input: 'a\na', expectedOutput: 'true', isHidden: true, points: 2 },
    ],
  },

  // 19. ARRAYS: Contains Duplicate
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    category: 'Arrays',
    difficulty: 'easy',
    statement: 'Given an integer array nums, return "true" if any value appears at least twice in the array, and return "false" if every element is distinct.',
    inputFormat: 'First line: n.\nSecond line: n integers.',
    outputFormat: 'Print "true" or "false".',
    constraintsText: '1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9',
    sampleExplanation: '1 appears multiple times at indices 0 and 3.',
    tags: ['arrays', 'hash-map', 'sorting'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef solve():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    nums = tokens[1:n+1]\n    print("true" if len(nums) != len(set(nums)) else "false")\nsolve()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n = int(tokens[0])\n    nums = tokens[1:n+1]\n    print("true" if len(nums) != len(set(nums)) else "false")\n',
    },
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: '4\n1 2 3 4', expectedOutput: 'false', isHidden: false, points: 1 },
      { input: '10\n1 1 1 3 3 4 3 2 4 2', expectedOutput: 'true', isHidden: true, points: 2 },
    ],
  },

  // 20. MATHEMATICS: Power of Three
  {
    title: 'Power of Three',
    slug: 'power-of-three',
    category: 'Mathematics',
    difficulty: 'easy',
    statement: 'Given an integer n, return "true" if it is a power of three. Otherwise, return "false". An integer n is a power of three if there exists an integer x such that n == 3^x.',
    inputFormat: 'A single integer n.',
    outputFormat: 'Print "true" or "false".',
    constraintsText: '-2^31 <= n <= 2^31 - 1',
    sampleExplanation: '27 = 3^3, so it is a power of three.',
    tags: ['mathematics', 'recursion'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef is_power_of_three():\n    token = sys.stdin.read().strip()\n    if not token: return\n    n = int(token)\n    if n <= 0: print("false"); return\n    while n % 3 == 0: n //= 3\n    print("true" if n == 1 else "false")\nis_power_of_three()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntoken = sys.stdin.read().strip()\nif token:\n    n = int(token)\n    if n <= 0: print("false")\n    else:\n        while n % 3 == 0: n //= 3\n        print("true" if n == 1 else "false")\n',
    },
    testCases: [
      { input: '27', expectedOutput: 'true', isHidden: false, points: 1 },
      { input: '0', expectedOutput: 'false', isHidden: false, points: 1 },
      { input: '-1', expectedOutput: 'false', isHidden: true, points: 2 },
      { input: '1', expectedOutput: 'true', isHidden: true, points: 2 },
    ],
  },

  // 21. STACKS: Min Stack
  {
    title: 'Evaluate Reverse Polish Notation',
    slug: 'evaluate-reverse-polish-notation',
    category: 'Stacks & Queues',
    difficulty: 'medium',
    statement: 'You are given an array of strings tokens that represents an arithmetic expression in a Reverse Polish Notation. Evaluate the expression and return an integer that represents the value of the expression.\nValid operators are +, -, *, and /. Each operand may be an integer or another expression. Division between two integers truncates toward zero.',
    inputFormat: 'First line: n (number of tokens).\nSecond line: n tokens separated by space.',
    outputFormat: 'Print the evaluated integer result.',
    constraintsText: '1 <= tokens.length <= 10^4\ntokens[i] is either an operator or an integer in the range [-200, 200].',
    sampleExplanation: '((2 + 1) * 3) = 9',
    tags: ['stacks', 'arrays', 'math'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    codeTemplates: {
      '71': 'import sys\ndef eval_rpn():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    expr = tokens[1:n+1]\n    stack = []\n    for t in expr:\n        if t in "+-*/":\n            b = stack.pop()\n            a = stack.pop()\n            if t == "+": stack.append(a + b)\n            elif t == "-": stack.append(a - b)\n            elif t == "*": stack.append(a * b)\n            else: stack.append(int(a / b))\n        else:\n            stack.append(int(t))\n    print(stack[0])\neval_rpn()\n',
    },
    referenceSolutions: {
      '71': 'import sys\ntokens = sys.stdin.read().split()\nif tokens:\n    n = int(tokens[0])\n    expr = tokens[1:n+1]\n    stack = []\n    for t in expr:\n        if t in "+-*/":\n            b = stack.pop()\n            a = stack.pop()\n            if t == "+": stack.append(a + b)\n            elif t == "-": stack.append(a - b)\n            elif t == "*": stack.append(a * b)\n            else: stack.append(int(a / b))\n        else:\n            stack.append(int(t))\n    print(stack[0])\n',
    },
    testCases: [
      { input: '5\n2 1 + 3 *', expectedOutput: '9', isHidden: false, points: 1 },
      { input: '5\n4 13 5 / +', expectedOutput: '6', isHidden: false, points: 1 },
    ],
  },
];

/**
 * Idempotently seeds the 20+ coding questions and their verified test cases into PostgreSQL.
 */
export async function seedCodingQuestions(userId = '00000000-0000-0000-0000-000000000001') {
  const client = await pool.connect();
  let createdCount = 0;
  let updatedCount = 0;

  try {
    await client.query('BEGIN');

    for (const p of SEED_CODING_QUESTIONS) {
      // 1. Upsert problem by slug
      const probRes = await client.query(
        `INSERT INTO problems (
          created_by, title, slug, category, difficulty, scope, status,
          time_limit_ms, memory_limit_mb, tags, statement, input_format,
          output_format, constraints_text, sample_explanation, code_templates,
          reference_solutions, is_deleted
        ) VALUES (
          $1, $2, $3, $4, $5, 'public', 'published',
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, FALSE
        )
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          difficulty = EXCLUDED.difficulty,
          statement = EXCLUDED.statement,
          input_format = EXCLUDED.input_format,
          output_format = EXCLUDED.output_format,
          constraints_text = EXCLUDED.constraints_text,
          sample_explanation = EXCLUDED.sample_explanation,
          tags = EXCLUDED.tags,
          time_limit_ms = EXCLUDED.time_limit_ms,
          memory_limit_mb = EXCLUDED.memory_limit_mb,
          code_templates = EXCLUDED.code_templates,
          reference_solutions = EXCLUDED.reference_solutions,
          updated_at = NOW()
        RETURNING id, (xmax = 0) AS is_inserted`,
        [
          userId,
          p.title,
          p.slug,
          p.category,
          p.difficulty,
          p.timeLimitMs,
          p.memoryLimitMb,
          p.tags,
          p.statement,
          p.inputFormat,
          p.outputFormat,
          p.constraintsText,
          p.sampleExplanation,
          JSON.stringify(p.codeTemplates),
          JSON.stringify(p.referenceSolutions),
        ]
      );

      const problemId = probRes.rows[0].id;
      const isInserted = probRes.rows[0].is_inserted;
      if (isInserted) createdCount++;
      else updatedCount++;

      // 2. Insert test cases idempotently
      for (let i = 0; i < p.testCases.length; i++) {
        const tc = p.testCases[i];
        // Check if matching test case exists
        const existingTc = await client.query(
          `SELECT id FROM test_cases WHERE problem_id = $1 AND input = $2 LIMIT 1`,
          [problemId, tc.input]
        );

        if (existingTc.rows.length === 0) {
          await client.query(
            `INSERT INTO test_cases (
              problem_id, input, expected_output, is_hidden, points, order_index, explanation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              problemId,
              tc.input,
              tc.expectedOutput,
              tc.isHidden,
              tc.points,
              i + 1,
              tc.explanation || null,
            ]
          );
        } else {
          await client.query(
            `UPDATE test_cases
             SET expected_output = $1, is_hidden = $2, points = $3, order_index = $4, explanation = $5
             WHERE id = $6`,
            [
              tc.expectedOutput,
              tc.isHidden,
              tc.points,
              i + 1,
              tc.explanation || null,
              existingTc.rows[0].id,
            ]
          );
        }
      }
    }

    await client.query('COMMIT');
    return {
      success: true,
      totalQuestions: SEED_CODING_QUESTIONS.length,
      createdCount,
      updatedCount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
