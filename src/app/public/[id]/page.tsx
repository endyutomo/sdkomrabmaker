'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PublicProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/public/${params.id}`);
        if (!res.ok) throw new Error('Project not found or not public');
        const data = await res.json();
        setProject(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!project) return <div className="p-8">Project not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{project.title}</CardTitle>
                <CardDescription className="mt-2">{project.type}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Public
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {project.client_name && (
              <div>
                <h3 className="font-semibold text-sm text-slate-600">Client</h3>
                <p className="mt-1">{project.client_name}</p>
              </div>
            )}
            {project.creator_name && (
              <div>
                <h3 className="font-semibold text-sm text-slate-600">Creator</h3>
                <p className="mt-1">{project.creator_name}</p>
              </div>
            )}
            {project.project_location && (
              <div>
                <h3 className="font-semibold text-sm text-slate-600">Location</h3>
                <p className="mt-1">{project.project_location}</p>
              </div>
            )}
            {project.document_number && (
              <div>
                <h3 className="font-semibold text-sm text-slate-600">Document Number</h3>
                <p className="mt-1">{project.document_number}</p>
              </div>
            )}
            {project.document_date && (
              <div>
                <h3 className="font-semibold text-sm text-slate-600">Date</h3>
                <p className="mt-1">{new Date(project.document_date).toLocaleDateString('id-ID')}</p>
              </div>
            )}
            {project.specifications && (
              <div>
                <h3 className="font-semibold text-sm text-slate-600">Specifications</h3>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{project.specifications}</p>
              </div>
            )}
            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500">
                Created: {new Date(project.created_at).toLocaleDateString('id-ID')} at{' '}
                {new Date(project.created_at).toLocaleTimeString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
