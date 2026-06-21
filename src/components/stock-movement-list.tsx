import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: Date;
};

type Props = {
  movements: MovementRow[];
};

export function StockMovementList({ movements }: Props) {
  return (
    <div className="border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Date</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Type</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Qty</TableHead>
            <TableHead className="font-heading font-bold text-[10px] uppercase tracking-wider">Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 font-sans text-sm text-muted-foreground">
                No movements recorded yet.
              </TableCell>
            </TableRow>
          )}
          {movements.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-mono text-xs text-muted-foreground" data-number>
                {new Date(m.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {m.type === "IN" ? (
                  <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-success" data-number>
                    <ArrowDownCircle className="size-3.5" />
                    IN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-destructive" data-number>
                    <ArrowUpCircle className="size-3.5" />
                    OUT
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm" data-number>{m.quantity}</TableCell>
              <TableCell className="font-sans text-sm text-muted-foreground">{m.note ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
