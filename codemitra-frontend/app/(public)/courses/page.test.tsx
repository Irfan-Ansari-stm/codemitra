import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CoursesPage from '@/app/(public)/courses/page';
import { courseApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Course, CourseStats } from '@/types';

vi.mock('@/lib/api', () => ({
  courseApi: {
    list: vi.fn(),
    stats: vi.fn(),
    featured: vi.fn(),
  },
  getErrorMessage: (error: any) =>
    error?.response?.data?.error?.message ?? error?.message ?? 'An error occurred',
}));

const mockedList = vi.mocked(courseApi.list);
const mockedStats = vi.mocked(courseApi.stats);
const mockedFeatured = vi.mocked(courseApi.featured);

const FIXTURE_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Introduction to Algorithms',
    description: 'A sample course covering basic problem solving.',
    status: 'published',
    languageTags: ['Python', 'Algorithms'],
    createdAt: '2026-01-01T00:00:00Z',
    createdByName: 'Demo Instructor',
    moduleCount: 2,
    chapterCount: 5,
    totalMinutes: 120,
    enrollmentCount: 42,
    isEnrolled: false,
  },
  {
    id: 'c2',
    title: 'Data Structures Fundamentals',
    description: 'Arrays, trees, and graphs.',
    status: 'published',
    languageTags: ['JavaScript'],
    createdAt: '2026-02-01T00:00:00Z',
    createdByName: 'Demo Instructor',
    moduleCount: 3,
    chapterCount: 8,
    totalMinutes: 240,
    enrollmentCount: 10,
    isEnrolled: true,
    progress: {
      totalLessons: 8,
      completedLessons: 2,
      percent: 25,
      lastAccessedAt: null,
      completedAt: null,
    },
  },
];

const FIXTURE_STATS: CourseStats = {
  totalCourses: 12,
  publishedCourses: 9,
  totalModules: 30,
  totalLessons: 120,
};

const FEATURED_COURSE: Course = {
  id: 'c0',
  title: 'Featured: Advanced Algorithms',
  description: 'A featured deep-dive course.',
  status: 'published',
  languageTags: ['Python'],
  createdAt: '2026-01-15T00:00:00Z',
  createdByName: 'Featured Instructor',
  moduleCount: 4,
  chapterCount: 12,
  totalMinutes: 300,
  enrollmentCount: 99,
  isEnrolled: false,
};

const DEMO_USER = {
  id: 'user-1',
  name: 'Demo Student',
  email: 'student@demo.codemitra.local',
  role: 'institution_student' as const,
  tenantId: 'tenant-1',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CoursesPage />
    </QueryClientProvider>
  );
}

function mockSuccessResponses() {
  mockedList.mockResolvedValue({
    data: {
      success: true,
      data: FIXTURE_COURSES,
      meta: { total: 2, page: 1, limit: 9, totalPages: 1 },
    },
  } as any);
  mockedStats.mockResolvedValue({
    data: { success: true, data: FIXTURE_STATS },
  } as any);
  mockedFeatured.mockResolvedValue({
    data: { success: true, data: [FEATURED_COURSE] },
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().setUser(DEMO_USER as any);
  useAuthStore.getState().setReady(true);
});

describe('CoursesPage', () => {
  it('renders the course catalog from the API', async () => {
    mockSuccessResponses();

    renderPage();

    expect(await screen.findByText('Introduction to Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Data Structures Fundamentals')).toBeInTheDocument();
    expect(screen.getAllByText('Demo Instructor').length).toBeGreaterThan(0);
    expect(screen.getByText('2 modules')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument();
  });

  it('renders catalog statistics from the API', async () => {
    mockSuccessResponses();

    renderPage();

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('9 published')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('across 30 modules')).toBeInTheDocument();
  });

  it('renders the featured section on the first page', async () => {
    mockSuccessResponses();

    renderPage();

    expect(await screen.findByText('Featured courses')).toBeInTheDocument();
    expect(
      screen.getByText('Featured: Advanced Algorithms')
    ).toBeInTheDocument();
  });

  it('renders pagination when results span multiple pages', async () => {
    mockedList.mockResolvedValue({
      data: {
        success: true,
        data: FIXTURE_COURSES,
        meta: { total: 45, page: 1, limit: 9, totalPages: 5 },
      },
    } as any);
    mockedStats.mockResolvedValue({
      data: { success: true, data: FIXTURE_STATS },
    } as any);
    mockedFeatured.mockResolvedValue({
      data: { success: true, data: [] },
    } as any);

    renderPage();

    expect(await screen.findByText('Introduction to Algorithms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('shows learning progress on enrolled course cards', async () => {
    mockSuccessResponses();

    renderPage();

    expect(await screen.findByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('2 of 8 lessons')).toBeInTheDocument();
    expect(screen.getByText('Continue learning')).toBeInTheDocument();
  });

  it('toggles the status filter and resets pagination', async () => {
    mockSuccessResponses();

    renderPage();
    await screen.findByText('Introduction to Algorithms');

    const publishedButton = screen.getByRole('button', { name: 'Published' });
    await userEvent.click(publishedButton);

    await waitFor(() => {
      expect(mockedList).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          page: 1,
        })
      );
    });
  });

  it('debounces search input before requesting results', async () => {
    mockSuccessResponses();

    renderPage();
    await screen.findByText('Introduction to Algorithms');

    const searchInput = screen.getByLabelText(
      'Search courses by title, description, or topic'
    );
    await userEvent.type(searchInput, 'algorithms');

    await waitFor(
      () => {
        expect(mockedList).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'algorithms' })
        );
      },
      { timeout: 2000 }
    );
  });

  it('renders the empty state with a clear-filters action', async () => {
    mockedList.mockResolvedValue({
      data: { success: true, data: [], meta: { total: 0, page: 1, limit: 9, totalPages: 1 } },
    } as any);
    mockedStats.mockResolvedValue({
      data: { success: true, data: FIXTURE_STATS },
    } as any);
    mockedFeatured.mockResolvedValue({
      data: { success: true, data: [] },
    } as any);

    renderPage();

    expect(await screen.findByText('No matching courses')).toBeInTheDocument();
  });

  it('renders the error state with a retry action', async () => {
    mockedList.mockRejectedValue(new Error('Network failure'));
    mockedStats.mockResolvedValue({
      data: { success: true, data: FIXTURE_STATS },
    } as any);
    mockedFeatured.mockResolvedValue({
      data: { success: true, data: [] },
    } as any);

    renderPage();

    expect(
      await screen.findByText(/Courses couldn.t be loaded/)
    ).toBeInTheDocument();
    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows a sign-in gate for unauthenticated users', () => {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setReady(true);

    renderPage();

    expect(screen.getByText('Sign in to browse courses')).toBeInTheDocument();
    expect(screen.queryByText('Featured courses')).not.toBeInTheDocument();
    expect(mockedList).not.toHaveBeenCalled();
    expect(mockedStats).not.toHaveBeenCalled();
    expect(mockedFeatured).not.toHaveBeenCalled();
  });

  it('loads the published course catalog for a signed-in learner without an institution', async () => {
    useAuthStore.getState().setUser({
      id: 'general-learner',
      name: 'CodeVerse Learner',
      email: 'learner@example.com',
      role: 'general_student',
      tenantId: null,
    });
    mockSuccessResponses();

    renderPage();

    expect(await screen.findByText('Introduction to Algorithms')).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 9 })
    );
  });
});
