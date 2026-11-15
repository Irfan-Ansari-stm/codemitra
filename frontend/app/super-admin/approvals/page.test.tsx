import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuperAdminApprovalsPage from './page';
import { superAdminApprovalsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  superAdminApprovalsApi: {
    getSummary: vi.fn(),
    listInstitutes: vi.fn(),
    listAdmissions: vi.fn(),
    listCourses: vi.fn(),
    getInstitute: vi.fn(),
    getAdmission: vi.fn(),
    getCourse: vi.fn(),
    approveInstitute: vi.fn(),
    rejectInstitute: vi.fn(),
    requestInstituteChanges: vi.fn(),
    approveAdmission: vi.fn(),
    rejectAdmission: vi.fn(),
    requestAdmissionChanges: vi.fn(),
    approveCourse: vi.fn(),
    rejectCourse: vi.fn(),
    requestCourseChanges: vi.fn(),
  },
}));

const mockedApprovalsApi = vi.mocked(superAdminApprovalsApi);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SuperAdminApprovalsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockedApprovalsApi.getSummary.mockResolvedValue({
    data: {
      success: true,
      data: {
        counts: {
          institutes: 5,
          admissions: 10,
          courses: 7,
          total: 22,
          approvedToday: 7,
          rejectedToday: 4,
          changesRequested: 6,
        },
      },
    },
  } as any);

  mockedApprovalsApi.listInstitutes.mockResolvedValue({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 'ins-1',
            application_number: 'INS-2026-001',
            institution_name: 'Vellore Advanced Polytechnic',
            slug: 'vellore-adv-polytechnic',
            contact_email: 'dean@vap.edu.in',
            contact_person: 'Dr. R. Ramanathan',
            city: 'Vellore',
            state: 'Tamil Nadu',
            institution_type: 'Autonomous Polytechnic',
            status: 'pending',
            created_at: '2026-11-10T00:00:00Z',
            documents: [{ name: 'AICTE_Approval.pdf', size: '2.4 MB' }],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  } as any);

  mockedApprovalsApi.listAdmissions.mockResolvedValue({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 'adm-1',
            application_number: 'ADM-2026-0001',
            full_name: 'Aarav Mehta',
            email: 'aarav.mehta@example.com',
            phone: '+91 98200 11223',
            program: 'B.Tech Computer Science',
            institution_name: 'Apex Institute',
            status: 'pending',
            created_at: '2026-11-12T00:00:00Z',
            documents: [{ name: 'Marksheet_12.pdf', size: '1.4 MB' }],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  } as any);

  mockedApprovalsApi.listCourses.mockResolvedValue({
    data: {
      success: true,
      data: {
        items: [
          {
            id: 'sub-1',
            submission_number: 'SUB-2026-0001',
            title: 'Modern Distributed Systems with Go',
            category: 'Backend & Cloud',
            level: 'Advanced',
            instructor_name: 'Prof. Go Developer',
            status: 'pending',
            modules_count: 8,
            chapters_count: 32,
            created_at: '2026-11-13T00:00:00Z',
            documents: [{ name: 'Syllabus.pdf', size: '1.8 MB' }],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  } as any);

  mockedApprovalsApi.approveInstitute.mockResolvedValue({
    data: { success: true, message: 'Institute application approved successfully' },
  } as any);

  mockedApprovalsApi.rejectInstitute.mockResolvedValue({
    data: { success: true, message: 'Institute application rejected' },
  } as any);
});

describe('SuperAdminApprovalsPage Component Suite', () => {
  it('renders header, live metric counters, and tab badges correctly', async () => {
    renderPage();

    expect(screen.getByText('Workflow Approvals Hub')).toBeInTheDocument();
    expect(
      screen.getByText('Centralized queue for institute registrations, admissions, and platform-wide course reviews')
    ).toBeInTheDocument();

    // Verify summary metric cards
    expect(await screen.findByText('22')).toBeInTheDocument(); // Total pending
    expect(screen.getByText('Approved Today')).toBeInTheDocument();
    expect(screen.getByText('Rejected Today')).toBeInTheDocument();

    // Verify tabs
    expect(screen.getByRole('button', { name: /Institute Applications/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Student Admissions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Course Submissions/i })).toBeInTheDocument();

    // Verify initial institute item in table
    expect(await screen.findByText('Vellore Advanced Polytechnic')).toBeInTheDocument();
    expect(screen.getByText('INS-2026-001')).toBeInTheDocument();
  });

  it('switches between tabs and displays admissions and courses', async () => {
    renderPage();
    await screen.findByText('Vellore Advanced Polytechnic');

    // Switch to Student Admissions tab
    const admissionsTab = screen.getByRole('button', { name: /Student Admissions/i });
    await userEvent.click(admissionsTab);

    expect(await screen.findByText('Aarav Mehta')).toBeInTheDocument();
    expect(screen.getByText('ADM-2026-0001')).toBeInTheDocument();

    // Switch to Course Submissions tab
    const coursesTab = screen.getByRole('button', { name: /Course Submissions/i });
    await userEvent.click(coursesTab);

    expect(await screen.findByText('Modern Distributed Systems with Go')).toBeInTheDocument();
    expect(screen.getByText('SUB-2026-0001')).toBeInTheDocument();
  });

  it('opens details drawer on "View" button click', async () => {
    renderPage();
    await screen.findByText('Vellore Advanced Polytechnic');

    const viewButton = screen.getByTitle('View Inspection Details');
    await userEvent.click(viewButton);

    // Verify drawer details
    expect(await screen.findByText('Institution Profile')).toBeInTheDocument();
    expect(screen.getByText('Supporting Verification Documents (1)')).toBeInTheDocument();
    expect(screen.getByText('AICTE_Approval.pdf')).toBeInTheDocument();
  });

  it('opens approval decision modal and calls approve API', async () => {
    renderPage();
    await screen.findByText('Vellore Advanced Polytechnic');

    const approveButton = screen.getByTitle('Approve Institute');
    await userEvent.click(approveButton);

    expect(await screen.findByText('Approve Institute Application')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /Confirm Approval/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockedApprovalsApi.approveInstitute).toHaveBeenCalledWith('ins-1', undefined);
    });
  });

  it('validates mandatory rejection reason when rejecting', async () => {
    renderPage();
    await screen.findByText('Vellore Advanced Polytechnic');

    const rejectButton = screen.getByTitle('Reject Institute');
    await userEvent.click(rejectButton);

    expect(await screen.findByText('Reject Institute Application')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /Confirm Rejection/i });
    await userEvent.click(confirmButton);

    // Reason is mandatory
    expect(
      screen.getByText('Please provide a specific rejection reason for the applicant.')
    ).toBeInTheDocument();
    expect(mockedApprovalsApi.rejectInstitute).not.toHaveBeenCalled();
  });
});
