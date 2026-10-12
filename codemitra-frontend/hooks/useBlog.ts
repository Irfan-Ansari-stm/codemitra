import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { blogApi, newsletterApi } from '@/lib/api';
import type {
  BlogListParams,
  BlogListResponse,
  BlogPost,
  BlogPostDetailResponse,
  BlogCategory,
  BlogTag,
} from '@/types';

/**
 * Builds a stable query parameter object with a fixed key order so
 * TanStack Query produces stable cache keys for identical filter states.
 * Neutral values (empty search, 'all' category) are dropped.
 */
export function buildBlogParams(
  input: BlogListParams & { category?: string; tag?: string }
): BlogListParams {
  const params: BlogListParams = {};
  const search = input.search?.trim();
  if (search) params.search = search;
  if (input.category && input.category !== 'all') params.category = input.category;
  if (input.tag && input.tag !== 'all') params.tag = input.tag;
  if (input.sort && input.sort !== 'newest') params.sort = input.sort;
  if (input.featured) params.featured = true;
  params.page = input.page || 1;
  params.limit = input.limit || 12;
  return params;
}

export function useBlogPosts(params: BlogListParams) {
  return useQuery<BlogListResponse>({
    queryKey: ['blog-posts', params],
    queryFn: () =>
      blogApi.list(params).then((response) => response.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useFeaturedPost() {
  return useQuery<BlogPost | null>({
    queryKey: ['blog-posts', 'featured'],
    queryFn: () =>
      blogApi.featured().then((response) => response.data.data ?? null),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBlogCategories() {
  return useQuery<BlogCategory[]>({
    queryKey: ['blog-categories'],
    queryFn: () =>
      blogApi.categories().then((response) => response.data.data ?? []),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBlogTags() {
  return useQuery<BlogTag[]>({
    queryKey: ['blog-tags'],
    queryFn: () =>
      blogApi.tags().then((response) => response.data.data ?? []),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRelatedPosts(slug: string | null, limit = 3) {
  return useQuery<BlogPost[]>({
    queryKey: ['blog-related', slug, limit],
    queryFn: () =>
      blogApi.related(slug!, limit).then((response) => response.data.data ?? []),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBlogBookmarks(params: { page?: number; limit?: number } = {}) {
  return useQuery<BlogListResponse>({
    queryKey: ['blog-bookmarks', params],
    queryFn: () =>
      blogApi.bookmarks(params).then((response) => response.data),
    staleTime: 30_000,
  });
}

export function useBlogBookmark(postId: string | null) {
  return useQuery<{ bookmarked: boolean }>({
    queryKey: ['blog-bookmark', postId],
    queryFn: () =>
      blogApi.checkBookmark(postId!).then(
        (response) => response.data.data ?? { bookmarked: false }
      ),
    enabled: !!postId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleBlogBookmark(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookmark: boolean) =>
      bookmark
        ? blogApi.addBookmark(postId)
        : blogApi.removeBookmark(postId),
    onMutate: async (bookmark) => {
      await queryClient.cancelQueries({ queryKey: ['blog-bookmark', postId] });
      const previous = queryClient.getQueryData<{ bookmarked: boolean }>([
        'blog-bookmark',
        postId,
      ]);
      queryClient.setQueryData<{ bookmarked: boolean }>(
        ['blog-bookmark', postId],
        { bookmarked: bookmark }
      );
      return previous;
    },
    onError: (_error, _variables, snapshot) => {
      if (snapshot) {
        queryClient.setQueryData(['blog-bookmark', postId], snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-bookmark', postId] });
      queryClient.invalidateQueries({ queryKey: ['blog-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      newsletterApi.subscribe(email, name),
  });
}

export function useBlogPost(slug: string | null) {
  return useQuery<BlogPostDetailResponse>({
    queryKey: ['blog-post', slug],
    queryFn: () => blogApi.getBySlug(slug!).then((response) => response.data),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
  });
}
