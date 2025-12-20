import type { APIRoute } from 'astro';
import { searchPhotography, searchProfessional } from '../../utils/search';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const space = (url.searchParams.get('space') ?? 'professional').toLowerCase();

  const searchFn =
    space === 'photography' ? searchPhotography : searchProfessional;

  const results = await searchFn(q);

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
};

