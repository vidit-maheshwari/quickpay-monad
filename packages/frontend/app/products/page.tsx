/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Search, ArrowLeft, Sparkles, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type Variant = {
  id: string;
  title: string;
  price: string | { amount: string; currencyCode: string };
  imageUrl?: string | null;
  sku?: string | null;
  inventoryQuantity?: number | null;
};

type Product = {
  id: string;
  title: string;
  imageUrl?: string | null;
  variants: Variant[];
  descriptionHtml?: string | null;
};

export default function ProductsPage() {
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const domain = localStorage.getItem("shop_domain");
    const token = localStorage.getItem("access_token");
    if (!domain || !token) {
      setError("Missing Shopify credentials. Go back and connect again.");
      return;
    }
    setStoreUrl(domain);

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3001/api/shopify/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeUrl: domain, accessToken: token }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        const data = (await res.json()) as { products: Product[] };
        setProducts(data.products ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Default select all products when they first load
  useEffect(() => {
    if (products.length && selected.size === 0) {
      setSelected(new Set(products.map((p) => p.id)));
    }
  }, [products]);

  function toggleSelected(id: string, next?: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      const shouldSelect = typeof next === "boolean" ? next : !copy.has(id);
      if (shouldSelect) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  const selectedCount = selected.size;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Bar */}
      <div className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 shadow-2xl shadow-black/20">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-12 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                Select Products
              </h1>
              <p className="text-slate-400 text-lg">
                Choose products for your agent-ready store
              </p>
            </div>
          </div>
          {storeUrl && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <span className="text-xs text-slate-500 font-medium">Connected to:</span>
              <span className="text-xs text-emerald-300 font-mono font-semibold">{storeUrl}</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-r-teal-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-slate-400 text-lg font-medium">Loading products...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 p-4 text-sm text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10 mb-8 backdrop-blur-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const allPrices = p.variants
                .map((v) =>
                  typeof v.price === "string"
                    ? parseFloat(v.price)
                    : parseFloat(v.price.amount)
                )
                .filter((n) => !Number.isNaN(n));
              const minPrice = allPrices.length
                ? Math.min(...allPrices)
                : undefined;
              const currency = p.variants.find((v) => typeof v.price !== "string")
                ? (p.variants.find((v) => typeof v.price !== "string")!.price as any)
                  .currencyCode
                : undefined;

              return (
                <Card
                  key={p.id}
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all duration-300 border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 group",
                    selected.has(p.id)
                      ? "ring-2 ring-emerald-500/60 border-emerald-500/60 shadow-emerald-500/20 scale-[1.02]"
                      : "hover:shadow-blue-500/10 hover:scale-[1.01]"
                  )}
                  onClick={() => toggleSelected(p.id)}
                >
                  {selected.has(p.id) && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 pointer-events-none"></div>
                  )}
                  <div className="absolute left-3 top-3 z-10">
                    <Checkbox
                      className="size-5 bg-slate-800/80 border-slate-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      checked={selected.has(p.id)}
                      onCheckedChange={(v) => toggleSelected(p.id, Boolean(v))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {selected.has(p.id) && (
                    <div className="absolute right-3 top-3 z-10">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                        <CheckCircle2 className="size-5 text-emerald-300 drop-shadow-lg" />
                      </div>
                    </div>
                  )}
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <CardHeader className="relative">
                    <CardTitle className="text-lg line-clamp-2 text-white">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 relative">
                    <div className="text-sm text-slate-400">
                      {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}
                    </div>
                    <div className="text-base font-semibold text-white">
                      {minPrice !== undefined
                        ? `From ${currency ?? ""} $${minPrice.toFixed(2)}`
                        : "Price unavailable"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom sticky continue bar */}
        {!loading && !error && products.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 mt-8 border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 py-4 px-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <div className="text-sm text-slate-400">
                  <span className="font-semibold text-emerald-300">{selectedCount}</span> product{selectedCount === 1 ? "" : "s"} selected
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
                disabled={selectedCount === 0 || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const domain = localStorage.getItem("shop_domain")!;
                    const token = localStorage.getItem("access_token")!;
                    const existingStoreId = localStorage.getItem("store_id");

                    let storeId: string;
                    let currency = "USD";

                    // If store was already created on register page, use that ID
                    if (existingStoreId) {
                      storeId = existingStoreId;
                      console.log("Using existing store ID from register page:", storeId);
                    } else {
                      // Otherwise create a new store (fallback for direct product page access)
                      const storeName = (() => {
                        try {
                          const host = new URL(domain).hostname.replace(
                            ".myshopify.com",
                            ""
                          );
                          return host
                            .split("-")
                            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                            .join(" ");
                        } catch {
                          return "Shopify Store";
                        }
                      })();

                      // 1) Create store via backend
                      const createRes = await fetch("http://localhost:3001/api/stores", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: storeName,
                          url: domain,
                          adminAccessToken: token,
                          currency: "USD",
                          networks: ["monad-testnet"],
                          asset: "MON",
                          agentMetadata: {
                            minOrder: "5.00",
                            supportsPhysical: true,
                            supportsDigital: false,
                          },
                        }),
                      });
                      if (!createRes.ok) {
                        const t = await createRes.text();
                        throw new Error(`Create store failed: ${t}`);
                      }
                      const created = (await createRes.json()) as {
                        id: string;
                        currency: string;
                      };
                      storeId = created.id;
                      currency = created.currency || "USD";
                      localStorage.setItem("store_id", storeId);
                    }

                    // 2) Prepare selected variants for upsert
                    const selectedProducts = products.filter((p) =>
                      selected.has(p.id)
                    );
                    const selectedVariants = selectedProducts.flatMap((p) =>
                      p.variants.map((v) => ({
                        id: v.id,
                        name:
                          v.title && v.title !== "Default Title"
                            ? `${p.title} - ${v.title}`
                            : p.title,
                        description: p.descriptionHtml ?? null,
                        image: v.imageUrl || p.imageUrl || null,
                        price:
                          typeof v.price === "string"
                            ? v.price
                            : v.price.amount,
                        currency: currency,
                        inventory: v.inventoryQuantity ?? null,
                        metadata: {
                          sku: v.sku ?? undefined,
                          productId: p.id,
                        },
                      }))
                    );

                    // 3) Save selected products via backend
                    const prodRes = await fetch(
                      `http://localhost:3001/api/stores/${storeId}/products`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          products: selectedVariants,
                        }),
                      }
                    );
                    if (!prodRes.ok) {
                      const t = await prodRes.text();
                      throw new Error(`Save products failed: ${t}`);
                    }

                    // Save selection locally
                    localStorage.setItem(
                      "selected_product_ids",
                      JSON.stringify(Array.from(selected))
                    );

                    // Navigate to dashboard
                    window.location.href = "/dashboard";
                  } catch (e) {
                    console.error(e);
                    // eslint-disable-next-line no-alert
                    alert(
                      e instanceof Error ? e.message : "Failed to save selection"
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
