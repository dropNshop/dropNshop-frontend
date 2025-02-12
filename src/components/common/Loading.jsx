export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-lg text-gray-700">Loading...</span>
    </div>
  );
} 