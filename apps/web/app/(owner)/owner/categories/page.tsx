'use client';
import React, { useState } from 'react';
import { useCategories } from '../../../../hooks/use-api';
import { PageHeader, PageLoader, EmptyState, Card } from '../../../../components/shared';
import OwnerShell from '../../../../components/layout/OwnerShell';
import { api } from '../../../../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Tag } from 'lucide-react';

export default function CategoriesPage() {
  const { data, isLoading } = useCategories();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adding, setAdding] = useState(false);
  const categories = Array.isArray(data) ? data : [];

  async function handleAdd() {
    if (!name || !slug) return;
    try { setAdding(true); await api.post('/categories', { name, slug }); toast.success('Created!'); qc.invalidateQueries({ queryKey: ['categories'] }); setName(''); setSlug(''); }
    catch { toast.error('Failed'); } finally { setAdding(false); }
  }

  return (
    <OwnerShell>
      <PageHeader title="Categories" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? <PageLoader /> : !categories.length ? <EmptyState title="No categories yet" /> : (
            <div className="space-y-2">
              {categories.map((cat: { id: string; name: string; slug: string; children?: { id: string; name: string; slug: string }[] }) => (
                <div key={cat.id}>
                  <div className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/30">
                    <Tag className="h-4 w-4 text-primary" /><span className="font-medium">{cat.name}</span><span className="text-xs text-muted-foreground">/{cat.slug}</span>
                  </div>
                  {cat.children?.map((child) => (
                    <div key={child.id} className="ml-6 mt-1 flex items-center gap-3 rounded-lg border bg-card p-3 text-sm hover:bg-muted/30">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" /><span>{child.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <Card>
          <h3 className="mb-4 font-semibold">Add Category</h3>
          <div className="space-y-3">
            <input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} placeholder="Category name" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-here" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={handleAdd} disabled={!name || !slug || adding} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </Card>
      </div>
    </OwnerShell>
  );
}
