import { Loader2 } from "lucide-react";

export default function SectionLoader() {
  return (
    <div className="my-4 w-full flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );
}