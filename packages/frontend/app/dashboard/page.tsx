/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign, Package, Zap } from "lucide-react";

type Order = {
  id: string;
  store_id: string;
  order_intent_id: string;
  email: string;
  items: any[];
  subtotal_amount: string;
  shipping_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: "confirmed" | "fulfilled" | "cancelled";
  shopify_order_id: string | null;
  created_at: string;
};

type OrderIntent = {
  id: string;
  store_id: string;
  items: any[];
  shipping_address: any;
  email: string;
  subtotal_amount: string;
  shipping_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: "pending" | "paid" | "expired";
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  verification_status?: string;
  payment_tx_hash?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderIntents, setOrderIntents] = useState<OrderIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const store = localStorage.getItem("store_id");
    const domain = localStorage.getItem("shop_domain");

    if (!store || !domain) {
      setError("Missing store information. Please complete registration.");
      setLoading(false);
      return;
    }

    setStoreId(store);
    setShopUrl(domain);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch orders
        const ordersRes = await fetch(
          `http://localhost:3001/x402/stores/${store}/orders`
        );
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        // Fetch order intents
        const intentsRes = await fetch(
          `http://localhost:3001/x402/stores/${store}/order-intents`
        );
        if (intentsRes.ok) {
          const intentsData = await intentsRes.json();
          setOrderIntents(intentsData);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to fetch data");
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewOnShopify = () => {
    window.open("https://admin.shopify.com/store/60h5mj-ji/orders", "_blank");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "paid":
        return "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10";
      case "fulfilled":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10";
      case "pending":
        return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10";
      case "expired":
        return "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10";
      case "cancelled":
        return "bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30 shadow-lg shadow-slate-500/10";
      default:
        return "bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30 shadow-lg shadow-slate-500/10";
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const totalIntents = orderIntents.length;

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
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleViewOnShopify}
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-300 border-emerald-500/30 hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-emerald-400/50 transition-all duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Shopify
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-12 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                Store Dashboard
              </h1>
              <p className="text-slate-400 text-lg">
                Manage orders and payment intents
              </p>
            </div>
          </div>
          {storeId && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <span className="text-xs text-slate-500 font-medium">Store ID:</span>
              <span className="text-xs text-emerald-300 font-mono font-semibold">{storeId}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 hover:shadow-emerald-500/10 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                  <DollarSign className="w-6 h-6 text-emerald-300" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-white">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 hover:shadow-blue-500/10 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-300"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Package className="w-6 h-6 text-blue-300" />
                </div>
                <CheckCircle2 className="w-5 h-5 text-blue-400/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-white">{orders.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 hover:shadow-amber-500/10 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-300"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                  <Zap className="w-6 h-6 text-amber-300" />
                </div>
                <Clock className="w-5 h-5 text-amber-400/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-400 font-medium">Pending Intents</p>
                <p className="text-3xl font-bold text-white">{totalIntents}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 p-4 text-sm text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10 mb-8 flex items-start gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-r-teal-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-slate-400 text-lg font-medium">Loading your data...</p>
              <p className="text-slate-500 text-sm mt-2">Please wait a moment</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Orders Section */}
            <section>
              <div className="mb-6 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Orders
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {orders.length} {orders.length === 1 ? "order" : "orders"} processed
                  </p>
                </div>
              </div>
              {orders.length === 0 ? (
                <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                  <CardContent className="pt-12 pb-12 text-center relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                    </div>
                    <p className="text-slate-300 font-semibold text-lg mb-2">
                      No orders yet
                    </p>
                    <p className="text-sm text-slate-500">
                      Orders from AI agents will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/50 bg-slate-900/50">
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Email
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Shopify
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, index) => (
                          <tr
                            key={order.id}
                            className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="py-4 px-6 font-mono text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                              {order.id.substring(0, 8)}...
                            </td>
                            <td className="py-4 px-6 text-slate-300 text-sm group-hover:text-white transition-colors">
                              {order.email}
                            </td>
                            <td className="py-4 px-6 font-semibold text-white text-base">
                              {order.currency} ${parseFloat(order.total_amount).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {order.shopify_order_id ? (
                                <a
                                  href={`https://${shopUrl}/admin/orders/${order.shopify_order_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition-all duration-200 hover:gap-2 group/link"
                                >
                                  <span className="font-mono text-xs">
                                    {order.shopify_order_id.substring(0, 8)}...
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-xs group-hover:text-slate-300 transition-colors">
                              {formatDate(order.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </section>

            {/* Order Intents Section */}
            <section>
              <div className="mb-6 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Clock className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Payment Intents
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {orderIntents.length} {orderIntents.length === 1 ? "intent" : "intents"} pending
                  </p>
                </div>
              </div>
              {orderIntents.length === 0 ? (
                <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                  <CardContent className="pt-12 pb-12 text-center relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10">
                      <Clock className="w-8 h-8 text-blue-300" />
                    </div>
                    <p className="text-slate-300 font-semibold text-lg mb-2">
                      No payment intents
                    </p>
                    <p className="text-sm text-slate-500">
                      Pending payment intents will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/50 bg-slate-900/50">
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Intent ID
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Email
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Verification
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                            Expires
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderIntents.map((intent, index) => (
                          <tr
                            key={intent.id}
                            className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="py-4 px-6 font-mono text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                              {intent.id.substring(0, 8)}...
                            </td>
                            <td className="py-4 px-6 text-slate-300 text-sm group-hover:text-white transition-colors">
                              {intent.email}
                            </td>
                            <td className="py-4 px-6 font-semibold text-white text-base">
                              {intent.currency} ${parseFloat(intent.total_amount).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${getStatusColor(
                                  intent.status
                                )}`}
                              >
                                {intent.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {intent.verification_status ? (
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                  {intent.verification_status}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-xs group-hover:text-slate-300 transition-colors">
                              {formatDate(intent.expires_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
