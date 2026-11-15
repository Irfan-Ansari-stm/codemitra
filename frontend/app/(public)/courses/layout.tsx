import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Courses',
  description:
    'Explore structured coding courses, follow a guided curriculum, and track your learning progress.',
};

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return children;
}
