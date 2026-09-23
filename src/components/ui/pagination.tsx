import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] bg-white">
      <span className="text-[12px] text-[#64748b]">
        Exibindo {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-[12px] text-[#64748b]">
          {safePage} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={safePage >= pages}
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}