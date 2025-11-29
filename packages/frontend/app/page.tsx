"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Globe, Clock } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 md:px-12 py-6 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">X402</div>
        <Button
          onClick={() => router.push("/register")}
          variant="outline"
          className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-300 border-emerald-500/30 hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-emerald-400/50 transition-all duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
        >
          Get Started
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Make Your Shopify Store{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                  Agent Ready
                </span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Empower AI agents to discover and place orders in your Shopify store. The future of commerce is here—extend your store&apos;s reach to intelligent agents in just 2 minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-200">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Discoverable by AI Agents</h3>
                  <p className="text-slate-400">Your store becomes visible to LLM agents and AI assistants</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-200">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <CheckCircle2 className="w-5 h-5 text-blue-300" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Seamless Order Integration</h3>
                  <p className="text-slate-400">Orders placed by agents appear directly in your Shopify dashboard</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-200">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                    <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">2-Minute Setup</h3>
                  <p className="text-slate-400">Connect your store in just 120 seconds and start accepting agent orders</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => router.push("/register")}
              className="w-full md:w-auto px-8 py-6 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
            >
              Get Started in 2 Minutes
            </Button>
          </div>

          {/* Right Visual */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Card showcase */}
              <div className="relative z-10 space-y-4">
                <div className="relative overflow-hidden rounded-xl border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 p-6 border hover:border-emerald-500/30 transition-all duration-300 group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                      <Globe className="w-5 h-5 text-emerald-300" />
                    </div>
                    <h3 className="font-semibold text-white">Agent Discovery</h3>
                  </div>
                  <p className="text-sm text-slate-400 relative">Your products are indexed and searchable by AI agents across the web</p>
                </div>

                <div className="relative overflow-hidden rounded-xl border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 p-6 border hover:border-blue-500/30 transition-all duration-300 group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-300"></div>
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                      <Zap className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="font-semibold text-white">Real-Time Processing</h3>
                  </div>
                  <p className="text-sm text-slate-400 relative">Agent orders are processed instantly and appear in your dashboard</p>
                </div>

                <div className="relative overflow-hidden rounded-xl border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 p-6 border hover:border-amber-500/30 transition-all duration-300 group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-300"></div>
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                      <Clock className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="font-semibold text-white">Future-Ready</h3>
                  </div>
                  <p className="text-sm text-slate-400 relative">As AI becomes the future of web, your store stays ahead of the curve</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Why Store Owners Love X402
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Expand Revenue Streams",
                description: "Reach new customers through AI agents and automated purchasing systems",
                icon: "📈",
                color: "emerald",
              },
              {
                title: "Zero Integration Hassle",
                description: "No code changes needed. We handle all the complexity for you.",
                icon: "⚡",
                color: "blue",
              },
              {
                title: "Same Shopify Experience",
                description: "Orders show up in your Shopify dashboard exactly as they normally would",
                icon: "🛍️",
                color: "amber",
              },
            ].map((feature, idx) => {
              const colorClasses = {
                emerald: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
                blue: "bg-blue-500/10 group-hover:bg-blue-500/20",
                amber: "bg-amber-500/10 group-hover:bg-amber-500/20",
              };
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-xl border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl shadow-2xl shadow-black/30 p-8 border hover:shadow-emerald-500/10 transition-all duration-300 group"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-300`}></div>
                  <div className="text-4xl mb-4 relative">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-white relative">{feature.title}</h3>
                  <p className="text-slate-400 relative">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-4xl mx-auto px-6 md:px-12 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">Ready for the Future?</h2>
        <p className="text-lg text-slate-300 mb-8">
          Set up your agent-ready store in just 2 minutes. No credit card required.
        </p>
        <Button
          onClick={() => router.push("/register")}
          className="px-10 py-6 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
        >
          Get Started Now
        </Button>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 py-8 text-center text-slate-400">
        <p>X402 - Making Shopify stores agent-ready for the future of commerce</p>
      </footer>
    </div>
  );
}
