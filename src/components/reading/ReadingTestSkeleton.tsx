export default function ReadingTestSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-gray-100 animate-pulse">
      <div className="h-14 border-b border-gray-200 bg-white px-6">
        <div className="flex h-full items-center justify-between">
          <div className="h-6 w-48 rounded-lg bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-lg bg-gray-200" />
            <div className="h-8 w-16 rounded-lg bg-blue-200" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="hidden w-[60%] border-r border-gray-200 bg-white p-6 md:block">
          <div className="mb-4 h-8 w-3/4 rounded-lg bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${90 - i * 8}%` }} />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-50 p-5">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </div>
      <div className="h-16 border-t border-gray-200 bg-white px-6">
        <div className="flex h-full items-center gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
