export function CampaignCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] animate-pulse bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mb-1 h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="mb-3 space-y-2">
          <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
