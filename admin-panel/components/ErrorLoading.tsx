import React from "react";
import SectionLoader from "./SectionLoader";

interface Props extends React.PropsWithChildren {
  loading: boolean;
  error: any;
  emptyMessage: string;
  dataLength: number;
}

export default function ErrorLoading({ children, loading, error, emptyMessage, dataLength }: Props) {
  return (
    <div className="w-full">
      {loading ? (
        <SectionLoader />
      ) : error ? (
        <ErrorSection text={error?.response?.data?.message || error.message || "Failed to load data."} />
      ) : (
        <>
          {children}
          {!dataLength && (
            <div className="text-center my-10 font-bold text-gray-500 bg-white p-6 rounded-xl border-2 border-dashed">
              {emptyMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ErrorSection({ text }: { text: string }) {
  return (
    <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl text-center text-red-600 font-bold">
      {text}
    </div>
  );
}