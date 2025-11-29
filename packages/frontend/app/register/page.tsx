/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Store, Link2, FileText, Key, AlertCircle } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeName.trim() || undefined,
          url: storeUrl.trim(),
          adminAccessToken: adminToken.trim(),
          description: storeDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create store");
      }

      const storeData = await response.json();

      // Store in localStorage for subsequent requests
      localStorage.setItem("shop_domain", storeUrl.trim());
      localStorage.setItem("access_token", adminToken.trim());
      localStorage.setItem("store_id", storeData.id);

      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Failed to connect store. Please try again.");
      console.error("Store connection error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Back button */}
      <div className="relative pt-6 px-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Form Container */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg relative overflow-hidden border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <form onSubmit={handleSubmit} className="contents relative">
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                  <Store className="w-6 h-6 text-emerald-300" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">Connect Your Store</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Enter your store credentials to get started in 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative">
              <div className="space-y-2">
                <Label htmlFor="store-name" className="text-slate-300 flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-400" />
                  Store Name
                </Label>
                <Input
                  id="store-name"
                  type="text"
                  placeholder="My Awesome Store"
                  className="bg-slate-900/50 border-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-url" className="text-slate-300 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  Store URL
                </Label>
                <Input
                  id="store-url"
                  type="url"
                  inputMode="url"
                  required
                  placeholder="https://your-store.myshopify.com"
                  className="bg-slate-900/50 border-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-description" className="text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Store Description
                </Label>
                <Textarea
                  id="store-description"
                  placeholder="Brief description of your store and what you sell"
                  className="bg-slate-900/50 border-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 min-h-24"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-token" className="text-slate-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  Admin API Access Token
                </Label>
                <Input
                  id="admin-token"
                  type="password"
                  required
                  placeholder="shpat_..."
                  className="bg-slate-900/50 border-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 p-4 text-sm text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10 flex items-start gap-3 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                  <div className="font-medium">{error}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="relative">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connecting...
                  </span>
                ) : (
                  "Connect Shopify"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
