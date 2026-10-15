/**
 * Simple loading spinner shown during session restoration.
 */
export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-steel-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-navy-300 border-t-navy-800 rounded-full animate-spin" />
        <p className="text-sm text-steel-500">Загрузка…</p>
      </div>
    </div>
  );
}
