interface EndpointSelectorProps {
  currentEndpoint: string;
  setEndpoint: (endpoint: string) => void;
}

export default function EndpointSelector({ currentEndpoint, setEndpoint }: EndpointSelectorProps) {
  const types = ["live", "moung", "results"];

  return (
    <div className="flex bg-[#2D3748] py-2 px-1 text-sm font-medium border-b border-gray-700">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => setEndpoint(type)}
          className={`flex-1 py-2 text-center rounded-md transition duration-200 ${
            currentEndpoint === type
              ? "bg-yellow-500 text-black shadow-md"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {type === "moung" ? "ตารางวันนี้" : type === "live" ? "บอลสด(กำลังเตะ)" : "ผลการแข่ง"}
        </button>
      ))}
    </div>
  );
}