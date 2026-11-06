import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions, requireSellerOrAdmin } from '@/lib/api';

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  image_url: z.string().optional().nullable(),
  color_hex: z.string().optional().nullable(),
  subcategory_name: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*, subcategories(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[GET /api/categories] error:', error);
      // Fallback query if subcategories table is not created yet
      const { data: fallbackData } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      return ok({
        categories: (fallbackData ?? []).map((c: any) => ({
          ...c,
          image: c.image_url,
          label: c.name,
          subcategories: [],
        })),
      });
    }

    const formattedCategories = data?.map((c: any) => {
      const activeSubs = (c.subcategories ?? [])
        .filter((s: any) => s.is_active !== false)
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      return {
        ...c,
        image: c.image_url,
        label: c.name,
        subcategories: activeSubs,
      };
    });

    return ok({ categories: formattedCategories ?? [] });
  } catch (e) {
    console.error('[GET /api/categories] catch error:', e);
    return err('Failed to fetch categories', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/categories — Verified Sellers & Admins create categories & subcategories
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireSellerOrAdmin(req);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, CreateCategorySchema);
  if (parsed instanceof Response) return parsed;
  const { name, image_url, color_hex, subcategory_name } = parsed.data;

  const slug = parsed.data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    // 1. Check if category already exists by slug or name
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .or(`slug.eq.${slug},name.ilike.${name.trim()}`)
      .maybeSingle();

    let categoryId = existing?.id;
    let categoryData = existing;

    if (!existing) {
      const { data: newCat, error: insertError } = await supabaseAdmin
        .from('categories')
        .insert({
          name: name.trim(),
          slug,
          image_url: image_url || null,
          color_hex: color_hex || '#059669',
          is_active: true,
          sort_order: 100,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[categories/POST] Insert error:', insertError);
        return err(insertError.message || 'Failed to create category', 500);
      }
      categoryId = newCat.id;
      categoryData = newCat;
    }

    // 2. If a subcategory name was provided, create subcategory under this category
    let subcategoryData = null;
    if (subcategory_name && subcategory_name.trim() && categoryId) {
      const subName = subcategory_name.trim();
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data: existingSub } = await supabaseAdmin
        .from('subcategories')
        .select('id, name, slug')
        .eq('category_id', categoryId)
        .or(`slug.eq.${subSlug},name.ilike.${subName}`)
        .maybeSingle();

      if (!existingSub) {
        const { data: newSub, error: subError } = await supabaseAdmin
          .from('subcategories')
          .insert({
            category_id: categoryId,
            name: subName,
            slug: subSlug,
            is_active: true,
            sort_order: 0,
          })
          .select()
          .maybeSingle();

        if (!subError) {
          subcategoryData = newSub;
        }
      } else {
        subcategoryData = existingSub;
      }
    }

    return ok({
      category: categoryData,
      subcategory: subcategoryData,
      message: 'Category and subcategory successfully created and ready for catalog listing.',
    }, 201);
  } catch (error: any) {
    console.error('[categories/POST] Unexpected error:', error);
    return err(error?.message || 'Server error creating category', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
