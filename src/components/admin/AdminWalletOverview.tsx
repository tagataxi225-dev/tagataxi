import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet } from "lucide-react";

const formatCDF = (amount: number) =>
  new Intl.NumberFormat("fr-CD").format(Math.round(amount)) + " CDF";

interface WalletRow {
  user_id: string;
  balance: number;
  currency: string;
  display_name: string | null;
  phone_number: string | null;
}

const useWalletStats = () =>
  useQuery({
    queryKey: ["admin", "wallet-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("balance");
      if (error) throw error;
      const total = data.reduce((s, w) => s + w.balance, 0);
      const countPositive = data.filter((w) => w.balance > 0).length;
      return { total, countPositive };
    },
    staleTime: 2 * 60 * 1000,
  });

const useTopWallets = () =>
  useQuery({
    queryKey: ["admin", "top-wallets"],
    queryFn: async (): Promise<WalletRow[]> => {
      const { data: wallets, error: wErr } = await supabase
        .from("user_wallets")
        .select("user_id, balance, currency")
        .order("balance", { ascending: false })
        .limit(10);
      if (wErr) throw wErr;
      if (!wallets?.length) return [];

      const userIds = wallets.map((w) => w.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone_number")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      return wallets.map((w) => {
        const p = profileMap.get(w.user_id);
        return {
          user_id: w.user_id,
          balance: w.balance,
          currency: w.currency,
          display_name: p?.display_name ?? null,
          phone_number: p?.phone_number ?? null,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });

export const AdminWalletOverview = () => {
  const { data: stats, isLoading: loadingStats } = useWalletStats();
  const { data: topWallets, isLoading: loadingTop } = useTopWallets();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Wallets utilisateurs</h2>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde total (tous wallets)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <p className="text-2xl font-bold">{formatCDF(stats?.total ?? 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wallets avec solde {">"} 0
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{stats?.countPositive ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 wallets par solde</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTop ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !topWallets?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun wallet trouvé
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topWallets.map((w, i) => (
                  <TableRow key={w.user_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      {w.display_name ?? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {w.user_id.slice(0, 8)}…
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.phone_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCDF(w.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
