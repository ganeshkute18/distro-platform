'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { useProduct, useAgencies, useCategories } from '../../../../../hooks/use-api';
import { api } from '../../../../../lib/api-client';
import { Card, PageHeader } from '../../../../../components/shared';
import OwnerShell from '../../../../../components/layout/OwnerShell';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  sku: z.string().min(1, 'SKU required'),
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  unitType: z.enum(['BOX', 'CRATE', 'PACKET', 'PIECE', 'DOZEN', 'KG', 'LITRE']),
  unitsPerCase: z.coerce.number().int().min(1),
  priceInRupees: z.coerce.number().min(0, 'Price required'),
  taxPercent: z.coerce.number().min(0).max(100),
  agencyId: z.string().min(1, 'Agency required'),
  categoryId: z.string().min(1, 'Category required'),
  minOrderQty: z.coerce.number().int().min(1),
  maxOrderQty: z.coerce.number().int().optional(),
  isFeatured: z.boolean(),
  imageUrls: z.array(z.string().url()).optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProductFormPage() {
  const params = useParams<{ productId: string }>();
  const isEdit = !!params?.productId && params.productId !== 'new';
  const productId = isEdit ? params.productId : undefined;

  const router = useRouter();
  const qc = useQueryClient();
  const { data: product } = useProduct(productId ?? '');
  const { data: agencies } = useAgencies();
  const { data: categories } = useCategories();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unitType: 'BOX', unitsPerCase: 1, taxPercent: 18, minOrderQty: 1, isFeatured: false, imageUrls: [] },
  });

  useEffect(() => {
    if (product && isEdit) {
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        unitType: product.unitType,
        unitsPerCase: product.unitsPerCase,
        priceInRupees: Number((product.pricePerUnit / 100).toFixed(2)),
        taxPercent: Number(product.taxPercent),
        agencyId: product.agency?.id,
        categoryId: product.category?.id,
        minOrderQty: product.minOrderQty,
        maxOrderQty: product.maxOrderQty ?? undefined,
        isFeatured: product.isFeatured,
        imageUrls: product.imageUrls ?? [],
      });
      setExistingImages(product.imageUrls ?? []);
    }
  }, [product, isEdit, reset]);

  async function uploadProductImages(productId: string, files: File[]) {
    if (!files.length) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const res = await fetch(`${baseUrl}/products/${productId}/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
  }

  async function onSubmit(data: FormData) {
    try {
      const { priceInRupees, ...rest } = data;
      const payload = {
        ...rest,
        pricePerUnit: Math.round(data.priceInRupees * 100),
        imageUrls: existingImages,
      };
      if (isEdit) {
        await api.patch(`/products/${productId}`, payload);
        if (selectedFiles.length) {
          await uploadProductImages(productId!, selectedFiles);
        }
        toast.success('Product updated!');
      } else {
        const created = await api.post<{ id: string }>('/products', payload);
        if (selectedFiles.length) {
          await uploadProductImages(created.id, selectedFiles);
        }
        toast.success('Product created!');
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      router.push('/owner/products');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save product');
    }
  }

  const agencyList = (agencies as { data?: { id: string; name: string }[] })?.data ?? [];
  const categoryList = (Array.isArray(categories) ? categories : []) as { id: string; name: string; children?: { id: string; name: string }[] }[];

  return (
    <OwnerShell>
      <Link href="/owner/products" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main fields */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="mb-4 font-semibold">Basic Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">SKU *</label>
                  <input {...register('sku')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="HUL-LUX-001" />
                  {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Product Name *</label>
                  <input {...register('name')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Lux Soap Bar (Pack of 4)" />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <textarea {...register('description')} rows={3} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Product description…" />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium">Product Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Select product photos manually. They will upload on save.
                </p>
              </div>
              {!!existingImages.length && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">Existing Images</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {existingImages.map((url) => (
                      <div key={url} className="flex items-center gap-2 rounded-lg border p-2">
                        <img src={url} alt="Product" className="h-12 w-12 rounded object-cover" />
                        <button
                          type="button"
                          onClick={() => setExistingImages((prev) => prev.filter((u) => u !== url))}
                          className="ml-auto rounded p-1 hover:bg-muted"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!!selectedFiles.length && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" />
                  {selectedFiles.length} new file(s) selected
                </p>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold">Pricing & Units</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Price (INR) *</label>
                  <input {...register('priceInRupees')} type="number" min="0" step="0.01"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="80.00" />
                  {errors.priceInRupees && <p className="mt-1 text-xs text-destructive">{errors.priceInRupees.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Tax %</label>
                  <input {...register('taxPercent')} type="number" min="0" max="100" step="0.5"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Unit Type</label>
                  <select {...register('unitType')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                    {['BOX', 'CRATE', 'PACKET', 'PIECE', 'DOZEN', 'KG', 'LITRE'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Units per Case</label>
                  <input {...register('unitsPerCase')} type="number" min="1"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Min Order Qty</label>
                  <input {...register('minOrderQty')} type="number" min="1"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Max Order Qty</label>
                  <input {...register('maxOrderQty')} type="number" min="1"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="No limit" />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <h3 className="mb-4 font-semibold">Classification</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Agency / Brand *</label>
                  <select {...register('agencyId')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select agency…</option>
                    {agencyList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {errors.agencyId && <p className="mt-1 text-xs text-destructive">{errors.agencyId.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Category *</label>
                  <select {...register('categoryId')} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select category…</option>
                    {categoryList.map(c => (
                      <React.Fragment key={c.id}>
                        <option value={c.id}>{c.name}</option>
                        {c.children?.map(child => <option key={child.id} value={child.id}>  └ {child.name}</option>)}
                      </React.Fragment>
                    ))}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <input {...register('isFeatured')} type="checkbox" id="featured" className="h-4 w-4 rounded border accent-primary" />
                  <label htmlFor="featured" className="text-sm font-medium">Featured product</label>
                </div>
              </div>
            </Card>

            <button type="submit" disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </OwnerShell>
  );
}
