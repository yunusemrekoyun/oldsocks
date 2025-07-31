import { useUploadQueue } from "../../context/UploadQueueContext";

export default function UploadQueueOverlay() {
  const { queue } = useUploadQueue();
  if (!queue.length) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 p-4 bg-white shadow-lg rounded-lg z-[60]">
      <h3 className="text-sm font-bold mb-2">Yükleme Listesi</h3>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {queue.map((t) => (
          <li key={t.id}>
            <p className="truncate">{t.name}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${t.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-0.5">
              <span className="text-gray-500">{t.progress}%</span>
              {t.status === "success" && (
                <span className="text-green-600 font-bold">✓</span>
              )}
              {t.status === "error" && (
                <span className="text-red-600 font-bold">✕</span>
              )}
            </div>{" "}
          </li>
        ))}
      </ul>
    </div>
  );
}
