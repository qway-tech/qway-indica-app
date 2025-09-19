// src/components/Loading.tsx
type LoadingProps = {
  texto?: string;
};

export default function Loading({ texto = "Carregando…" }: LoadingProps) {
  return (
    <div className="pt-24 flex flex-col items-center justify-center">
      <svg
        className="animate-spin h-12 w-12 text-foreground mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
        />
      </svg>
      <span className="text-muted">{texto}</span>
    </div>
  );
}