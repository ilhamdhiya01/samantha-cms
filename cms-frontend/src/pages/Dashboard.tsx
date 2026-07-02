import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { apiClient, unwrap } from '@/api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { useEffect } from 'react';

interface CountsResponse {
  total: number;
}

async function countPosts(): Promise<number> {
  const res = await apiClient.get('/api/posts', { params: { pageSize: 1 } });
  return ((res.data as { meta?: { total?: number } }).meta?.total) ?? 0;
}
async function countProjects(): Promise<number> {
  const res = await apiClient.get('/api/projects', { params: { pageSize: 1 } });
  return (res.data as { meta?: { total?: number } }).meta?.total ?? 0;
}
async function countExperiences(): Promise<number> {
  const res = await apiClient.get('/api/experiences');
  const d = unwrap<unknown[]>(res.data);
  return Array.isArray(d) ? d.length : 0;
}
async function countMedia(): Promise<number> {
  const res = await apiClient.get('/api/media', { params: { pageSize: 1 } });
  return (res.data as { meta?: { total?: number } }).meta?.total ?? 0;
}

export function Dashboard() {
  const admin = useAuth((s) => s.admin);
  const { data: posts } = useQuery({ queryKey: ['count', 'posts'], queryFn: countPosts });
  const { data: projects } = useQuery({ queryKey: ['count', 'projects'], queryFn: countProjects });
  const { data: experiences } = useQuery({ queryKey: ['count', 'experiences'], queryFn: countExperiences });
  const { data: media } = useQuery({ queryKey: ['count', 'media'], queryFn: countMedia });

  return (
    <div>
      <PageHeader
        title={`Halo, ${admin?.name ?? admin?.email ?? 'Admin'} 👋`}
        description="Ringkasan singkat konten CMS kamu."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Posts" value={posts} to="/posts" />
        <StatCard label="Projects" value={projects} to="/projects" />
        <StatCard label="Experiences" value={experiences} to="/experiences" />
        <StatCard label="Media" value={media} to="/media" />
      </div>
    </div>
  );
}

function StatCard({ label, value, to }: { label: string; value: number | undefined; to: string }) {
  return (
    <Link to={to} className="block">
      <Card className="p-4 hover:shadow-md transition">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-2xl font-semibold text-slate-900 mt-2">{value ?? '—'}</div>
      </Card>
    </Link>
  );
}
