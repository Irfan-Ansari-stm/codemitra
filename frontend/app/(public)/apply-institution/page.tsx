'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Building2, CheckCircle2 } from 'lucide-react';
import { instituteApplicationApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ApplyInstitutionPage() {
  const user = useAuthStore((state) => state.user);
  const [submitted, setSubmitted] = useState(false);
  const application = useMutation({
    mutationFn: (values: Record<string, string>) => instituteApplicationApi.create({
      institutionName: values.institutionName.trim(),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim() || undefined,
      websiteUrl: values.websiteUrl.trim() || undefined,
      address: values.address.trim() || undefined,
    }),
    onSuccess: () => setSubmitted(true),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    application.mutate(values);
  }

  return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-9">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Building2 size={21} /></div>
      <p className="mt-6 text-sm font-semibold text-blue-700 dark:text-blue-300">Institute onboarding</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Apply to register your institute</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">A platform administrator reviews each application. Your account receives institute administrator access only after approval.</p>

      {submitted ? <div role="status" className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} />Application received</div><p className="mt-2 text-sm">You will receive a notification when the application is reviewed.</p></div>
        : !user ? <div className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300"><p>Sign in or create a general user account before applying.</p><div className="mt-4 flex gap-3"><Link className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" href="/login?next=%2Fapply-institution">Sign in</Link><Link className="rounded-lg border border-slate-300 px-4 py-2 font-medium dark:border-slate-600" href="/register">Create account</Link></div></div>
        : user.role !== 'general_student' ? <p role="status" className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">Institute applications are available to general user accounts.</p>
        : <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Institute name<input name="institutionName" required minLength={2} maxLength={255} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact email<input type="email" name="contactEmail" required maxLength={320} defaultValue={user.email} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact phone<input name="contactPhone" maxLength={30} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Website<input type="url" name="websiteUrl" placeholder="https://example.edu" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Address<textarea name="address" maxLength={500} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          {application.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">{(application.error as any)?.response?.data?.error?.message || 'Could not submit the application. Please try again.'}</p>}
          <div className="sm:col-span-2"><button type="submit" disabled={application.isPending} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{application.isPending ? 'Submitting…' : 'Submit application'}</button></div>
        </form>}
    </div>
  </main>;
}
