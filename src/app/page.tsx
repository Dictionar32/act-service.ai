"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

interface SummaryData {
  totalRevenue: number;
  totalChats: number;
  totalOrders: number;
  conversionRate: number;
  today: {
    date: string;
    total_chat: number;
    total_order: number;
    revenue: number;
  };
  yesterday: {
    date: string;
    total_chat: number;
    total_order: number;
    revenue: number;
  };
}

interface AnalyticsRow {
  date: string;
  total_chat: number;
  total_order: number;
  revenue: number;
}

interface OrderItem {
  rowNumber: number;
  date: string;
  customer: string;
  item: string;
  qty: number;
  total: number;
  status: string;
}

interface DashboardPayload {
  success: boolean;
  summary: SummaryData;
  analytics: AnalyticsRow[];
  orders: OrderItem[];
}

// 7 Days of realistic default mock data in case API or sheets are not configured
const MOCK_DASHBOARD_DATA: DashboardPayload = {
  success: true,
  summary: {
    totalRevenue: 2840000,
    totalChats: 250,
    totalOrders: 120,
    conversionRate: 48.0,
    today: { date: "2026-05-23", total_chat: 25, total_order: 12, revenue: 280000 },
    yesterday: { date: "2026-05-22", total_chat: 20, total_order: 9, revenue: 210000 }
  },
  analytics: [
    { date: "2026-05-17", total_chat: 30, total_order: 14, revenue: 310000 },
    { date: "2026-05-18", total_chat: 35, total_order: 15, revenue: 340000 },
    { date: "2026-05-19", total_chat: 28, total_order: 13, revenue: 290000 },
    { date: "2026-05-20", total_chat: 40, total_order: 18, revenue: 420000 },
    { date: "2026-05-21", total_chat: 42, total_order: 22, revenue: 510000 },
    { date: "2026-05-22", total_chat: 45, total_order: 21, revenue: 490000 },
    { date: "2026-05-23", total_chat: 50, total_order: 25, revenue: 580000 }
  ],
  orders: [
    { rowNumber: 101, date: "2026-05-23", customer: "IG-user12", item: "brown sugar boba", qty: 2, total: 50000, status: "PENDING" },
    { rowNumber: 102, date: "2026-05-23", customer: "IG-user12", item: "dimsum", qty: 1, total: 18000, status: "PENDING" },
    { rowNumber: 103, date: "2026-05-23", customer: "boba_lover_99", item: "thai tea", qty: 3, total: 45000, status: "COMPLETED" },
    { rowNumber: 104, date: "2026-05-22", customer: "santi_putri", item: "taro milk tea", qty: 1, total: 23000, status: "COMPLETED" },
    { rowNumber: 105, date: "2026-05-22", customer: "rendy_firmansyah", item: "matcha latte", qty: 2, total: 48000, status: "CANCELLED" },
    { rowNumber: 106, date: "2026-05-21", customer: "dewi_lestari", item: "mango yakult", qty: 2, total: 44000, status: "COMPLETED" },
    { rowNumber: 107, date: "2026-05-21", customer: "ahmad_sujak", item: "dimsum", qty: 3, total: 54000, status: "COMPLETED" }
  ]
};

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

interface VolumePoint {
  date: string;
  chat: {
    x: number;
    y: number;
    height: number;
    width: number;
    value: number;
  };
  order: {
    x: number;
    y: number;
    height: number;
    width: number;
    value: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<"7" | "30" | "all">("7");

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingRowNumber, setUpdatingRowNumber] = useState<number | null>(null);

  // Chat Simulator State
  const [simulatorMessage, setSimulatorMessage] = useState<string>("");
  const [simulatorReply, setSimulatorReply] = useState<string | null>(null);
  const [simulatorLoading, setSimulatorLoading] = useState<boolean>(false);
  const [simulatorIsOrder, setSimulatorIsOrder] = useState<boolean | null>(null);

  // Chart Tooltips
  const [hoveredRevenuePoint, setHoveredRevenuePoint] = useState<ChartPoint | null>(null);
  const [hoveredVolumePoint, setHoveredVolumePoint] = useState<VolumePoint | null>(null);

  const fetchData = useCallback(async (forceDemo = false) => {
    // Defer state updates to avoid synchronous setState inside useEffect
    await Promise.resolve();
    setLoading(true);
    setError(null);
    if (forceDemo) {
      setData(MOCK_DASHBOARD_DATA);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setIsDemoMode(false);
      } else {
        throw new Error(json.error || "Gagal mengambil data dari Google Sheets.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("Menggunakan Demo Mode karena Google Sheets API gagal:", errMsg);
      setData(MOCK_DASHBOARD_DATA);
      setIsDemoMode(true);
      setError("Gagal terhubung ke Google Sheets API. Mengaktifkan Demo Mode.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Filter & calculate values based on Timeframe and Status Filter
  const filteredAnalytics = useMemo(() => {
    if (!data?.analytics) return [];
    let analyticsData = [...data.analytics];
    if (timeframe === "7") {
      analyticsData = analyticsData.slice(-7);
    } else if (timeframe === "30") {
      analyticsData = analyticsData.slice(-30);
    }
    return analyticsData;
  }, [data, timeframe]);

  const summary = useMemo(() => {
    if (!data) return null;
    if (timeframe === "all") return data.summary;

    // Recalculate summary metrics for the selected timeframe
    let totalRevenue = 0;
    let totalChats = 0;
    let totalOrders = 0;

    filteredAnalytics.forEach((day) => {
      totalRevenue += day.revenue;
      totalChats += day.total_chat;
      totalOrders += day.total_order;
    });

    return {
      totalRevenue,
      totalChats,
      totalOrders,
      conversionRate: totalChats > 0 ? (totalOrders / totalChats) * 100 : 0,
      today: data.summary.today,
      yesterday: data.summary.yesterday,
    };
  }, [data, filteredAnalytics, timeframe]);

  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter((order) => {
      const matchesSearch =
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.item.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const handleUpdateStatus = async (rowNumber: number, newStatus: string) => {
    if (isDemoMode) {
      setData((prev) => {
        if (!prev) return prev;
        const updatedOrders = prev.orders.map((o) =>
          o.rowNumber === rowNumber ? { ...o, status: newStatus } : o
        );
        return { ...prev, orders: updatedOrders };
      });
      return;
    }

    setUpdatingRowNumber(rowNumber);
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev) => {
          if (!prev) return prev;
          const updatedOrders = prev.orders.map((o) =>
            o.rowNumber === rowNumber ? { ...o, status: newStatus } : o
          );
          return { ...prev, orders: updatedOrders };
        });
      } else {
        alert("Gagal memperbarui status: " + json.error);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert("Gagal memperbarui status: " + errMsg);
    } finally {
      setUpdatingRowNumber(null);
    }
  };

  const handleSimulateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatorMessage.trim()) return;
    setSimulatorLoading(true);
    setSimulatorReply(null);
    setSimulatorIsOrder(null);

    if (isDemoMode) {
      setTimeout(() => {
        const lower = simulatorMessage.toLowerCase();
        const foundItems: { name: string; price: number; qty: number }[] = [];
        const menuItems = [
          { name: "thai tea", price: 15000 },
          { name: "dimsum", price: 18000 },
          { name: "brown sugar boba", price: 25000 },
          { name: "taro milk tea", price: 23000 },
          { name: "matcha latte", price: 24000 },
          { name: "mango yakult", price: 22000 },
        ];

        menuItems.forEach((m) => {
          if (lower.includes(m.name)) {
            // Find qty
            const idx = lower.indexOf(m.name);
            const window = lower.slice(Math.max(0, idx - 10), idx + m.name.length + 10);
            const match = window.match(/\b(\d+)\b/);
            const qty = match ? Number(match[1]) : 1;
            foundItems.push({ name: m.name, price: m.price, qty });
          }
        });

        if (foundItems.length > 0) {
          const totalVal = foundItems.reduce((s, i) => s + i.price * i.qty, 0);
          const itemLines = foundItems
            .map((i) => `🧋 ${i.name} x${i.qty}  →  Rp ${(i.price * i.qty).toLocaleString("id-ID")}`)
            .join("\n");

          const mockInvoice = `Halo Kak 😊\n\n🧾 Invoice Order Umayumcha (Demo)\n━━━━━━━━━━━━━━━━━━━━\n${itemLines}\n━━━━━━━━━━━━━━━━━━━━\n💰 Total: Rp ${totalVal.toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━━━━\n\nTransfer ke:\n🏦 BCA  : 1234567890\n       a/n Umayumcha`;
          
          setSimulatorIsOrder(true);
          setSimulatorReply(mockInvoice);

          // Add to local orders
          const newOrders = foundItems.map((item, idx) => ({
            rowNumber: Date.now() + idx,
            date: new Date().toISOString().split("T")[0],
            customer: "Demo-User-IG",
            item: item.name,
            qty: item.qty,
            total: item.price * item.qty,
            status: "PENDING",
          }));

          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              orders: [...newOrders, ...prev.orders],
              summary: {
                ...prev.summary,
                totalOrders: prev.summary.totalOrders + newOrders.length,
                totalChats: prev.summary.totalChats + 1,
                totalRevenue: prev.summary.totalRevenue + totalVal,
                today: {
                  ...prev.summary.today,
                  total_chat: prev.summary.today.total_chat + 1,
                  total_order: prev.summary.today.total_order + newOrders.length,
                  revenue: prev.summary.today.revenue + totalVal,
                },
              },
            };
          });
        } else {
          setSimulatorIsOrder(false);
          setSimulatorReply(
            `Kaka sudah pernah kesini sebelumnya?\n\nHalo Kak! Menu favorit kami:\n🧋 Brown Sugar Boba: Rp 25.000\n🥟 Dimsum: Rp 18.000\n🧋 Thai Tea: Rp 15.000\n\nMau pesan apa Kak?`
          );

          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              summary: {
                ...prev.summary,
                totalChats: prev.summary.totalChats + 1,
                today: {
                  ...prev.summary.today,
                  total_chat: prev.summary.today.total_chat + 1,
                },
              },
            };
          });
        }
        setSimulatorLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simulatorMessage, senderId: "DemoUserSimulated" }),
      });
      const json = await res.json();
      if (json.reply) {
        setSimulatorReply(json.reply);
        setSimulatorIsOrder(!!json.isOrder);
        // Refresh dashboard data
        fetchData();
      } else {
        setSimulatorReply("Error: " + (json.error || "Gagal mengirim pesan"));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSimulatorReply("Error: " + errMsg);
    } finally {
      setSimulatorLoading(false);
    }
  };

  // SVG Chart Calculation Helpers
  const revenueChartPoints = useMemo(() => {
    if (filteredAnalytics.length === 0) return [];
    const maxVal = Math.max(...filteredAnalytics.map((d) => d.revenue), 100000);
    const height = 180;
    const width = 500;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    return filteredAnalytics.map((day, i) => {
      const x = paddingLeft + (i / Math.max(1, filteredAnalytics.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (day.revenue / maxVal) * chartHeight;
      return { x, y, value: day.revenue, date: day.date };
    });
  }, [filteredAnalytics]);

  const volumeChartBars = useMemo(() => {
    if (filteredAnalytics.length === 0) return [];
    const maxVal = Math.max(...filteredAnalytics.map((d) => Math.max(d.total_chat, d.total_order)), 10);
    const height = 180;
    const width = 500;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const barGroupWidth = chartWidth / filteredAnalytics.length;
    const innerBarWidth = Math.max(4, barGroupWidth * 0.3);

    return filteredAnalytics.map((day, i) => {
      const groupX = paddingLeft + i * barGroupWidth;
      const chatHeight = (day.total_chat / maxVal) * chartHeight;
      const orderHeight = (day.total_order / maxVal) * chartHeight;

      return {
        date: day.date,
        chat: {
          x: groupX + barGroupWidth * 0.15,
          y: paddingTop + chartHeight - chatHeight,
          height: chatHeight,
          width: innerBarWidth,
          value: day.total_chat,
        },
        order: {
          x: groupX + barGroupWidth * 0.15 + innerBarWidth + 4,
          y: paddingTop + chartHeight - orderHeight,
          height: orderHeight,
          width: innerBarWidth,
          value: day.total_order,
        },
      };
    });
  }, [filteredAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Memuat dashboard Umayumcha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased select-none pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-amber-500/20">
            🧋
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-200 to-orange-400 leading-none">
              Umayumcha AI Hub
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Admin & Sales Analytics Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDemoMode && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Demo Mode
            </span>
          )}
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all cursor-pointer"
          >
            🔄 Refresh
          </button>
          {isDemoMode && (
            <button
              onClick={() => fetchData(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white transition-all cursor-pointer"
            >
              Connect Sheets
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-6 flex flex-col gap-6">
        {/* Warning Alert if Demo Mode Active */}
        {error && isDemoMode && (
          <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-900/40 text-orange-200 flex items-start gap-3 shadow-md">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div className="text-sm">
              <span className="font-semibold block text-orange-300">Gagal Memuat Google Sheets</span>
              {error}. Anda tetap dapat menggunakan simulator dan melacak data menggunakan data simulasi lokal. Pastikan `.env` terkonfigurasi dengan benar di environment server.
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Revenue */}
          <div className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-all rounded-xl p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-amber-500/10 to-transparent rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold tracking-wide uppercase">
              <span>Pendapatan</span>
              <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 text-amber-400">💰</span>
            </div>
            <div className="text-2xl font-bold mt-3 text-zinc-50 tracking-tight">
              Rp {summary?.totalRevenue.toLocaleString("id-ID") || 0}
            </div>
            <div className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
              Hari ini:
              <span className="text-amber-400 font-semibold">
                Rp {summary?.today.revenue.toLocaleString("id-ID") || 0}
              </span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-all rounded-xl p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-emerald-500/10 to-transparent rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold tracking-wide uppercase">
              <span>Total Pesanan</span>
              <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 text-emerald-400">🛍️</span>
            </div>
            <div className="text-2xl font-bold mt-3 text-zinc-50 tracking-tight">
              {summary?.totalOrders || 0} <span className="text-xs text-zinc-500 font-normal">cup</span>
            </div>
            <div className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
              Hari ini:
              <span className="text-emerald-400 font-semibold">{summary?.today.total_order || 0} order</span>
            </div>
          </div>

          {/* Card 3: Chats Volume */}
          <div className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-all rounded-xl p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-blue-500/10 to-transparent pointer-events-none rounded-full"></div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold tracking-wide uppercase">
              <span>Volume Percakapan</span>
              <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 text-blue-400">💬</span>
            </div>
            <div className="text-2xl font-bold mt-3 text-zinc-50 tracking-tight">
              {summary?.totalChats || 0} <span className="text-xs text-zinc-500 font-normal">chat</span>
            </div>
            <div className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
              Hari ini:
              <span className="text-blue-400 font-semibold">{summary?.today.total_chat || 0} chat</span>
            </div>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-all rounded-xl p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-indigo-500/10 to-transparent pointer-events-none rounded-full"></div>
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold tracking-wide uppercase">
              <span>Tingkat Konversi</span>
              <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 text-indigo-400">📈</span>
            </div>
            <div className="text-2xl font-bold mt-3 text-zinc-50 tracking-tight">
              {summary?.conversionRate.toFixed(1) || "0.0"}%
            </div>
            <div className="text-xs text-zinc-500 mt-2 font-medium">
              Chats-to-Orders conversion
            </div>
          </div>
        </section>

        {/* Charts & Chat Simulator Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Charts Column (Left, 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-5 shadow-xl flex flex-col h-70 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Tren Pendapatan Harian (IDR)</h2>
                  <p className="text-[11px] text-zinc-500">Pendapatan penjualan boba & dimsum harian</p>
                </div>
                {/* Timeframe selector */}
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                  {(["7", "30", "all"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                        timeframe === t
                          ? "bg-amber-600 text-white shadow"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {t === "all" ? "Semua" : `${t}H`}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Line Chart */}
              <div className="flex-1 w-full relative mt-2">
                {revenueChartPoints.length > 0 ? (
                  <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y = 20 + ratio * 130;
                      return (
                        <line
                          key={index}
                          x1="60"
                          y1={y}
                          x2="480"
                          y2={y}
                          stroke="#27272a"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {/* Gradient Area under line */}
                    {revenueChartPoints.length > 0 && (
                      <path
                        d={`M ${revenueChartPoints[0].x} 150 
                           ${revenueChartPoints.map((p) => `L ${p.x} ${p.y}`).join(" ")} 
                           L ${revenueChartPoints[revenueChartPoints.length - 1].x} 150 Z`}
                        fill="url(#revenue-gradient)"
                      />
                    )}

                    {/* Chart Line */}
                    <path
                      d={revenueChartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive dots and hovers */}
                    {revenueChartPoints.map((p, i) => (
                      <g key={i}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={hoveredRevenuePoint?.date === p.date ? "5" : "3.5"}
                          fill={hoveredRevenuePoint?.date === p.date ? "#ea580c" : "#f59e0b"}
                          stroke="#18181b"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredRevenuePoint(p)}
                          onMouseLeave={() => setHoveredRevenuePoint(null)}
                        />
                      </g>
                    ))}

                    {/* X axis labels (dates) */}
                    {revenueChartPoints.map((p, i) => {
                      // Only draw label for every nth point to avoid crowding
                      const showLabel =
                        filteredAnalytics.length <= 7 ||
                        (filteredAnalytics.length <= 15 && i % 2 === 0) ||
                        i % 5 === 0 ||
                        i === filteredAnalytics.length - 1;

                      if (!showLabel) return null;
                      const dateParts = p.date.split("-");
                      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : p.date;

                      return (
                        <text
                          key={i}
                          x={p.x}
                          y="168"
                          fill="#71717a"
                          fontSize="9"
                          textAnchor="middle"
                          className="font-medium"
                        >
                          {formattedDate}
                        </text>
                      );
                    })}

                    {/* Y Axis Max Label */}
                    <text x="50" y="24" fill="#71717a" fontSize="8" textAnchor="end" className="font-semibold">
                      Rp{" "}
                      {Math.max(...filteredAnalytics.map((d) => d.revenue), 100000).toLocaleString("id-ID")}
                    </text>
                    <text x="50" y="153" fill="#71717a" fontSize="8" textAnchor="end" className="font-semibold">
                      Rp 0
                    </text>
                  </svg>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500 font-medium">
                    Belum ada data analitik.
                  </div>
                )}

                {/* Floating Tooltip HTML Overlay */}
                {hoveredRevenuePoint && (
                  <div
                    className="absolute bg-zinc-950 border border-zinc-800 rounded-lg p-2 shadow-2xl pointer-events-none text-[10px] z-20 flex flex-col gap-0.5"
                    style={{
                      left: `${Math.min(360, (hoveredRevenuePoint.x / 500) * 100)}%`,
                      top: `${Math.max(10, (hoveredRevenuePoint.y / 180) * 100 - 30)}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <span className="text-zinc-500 font-bold">{hoveredRevenuePoint.date}</span>
                    <span className="text-amber-400 font-bold">
                      Rp {hoveredRevenuePoint.value.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat vs Orders Volume Chart */}
            <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-5 shadow-xl flex flex-col h-70 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Rasio Chat & Pesanan Masuk</h2>
                  <p className="text-[11px] text-zinc-500">Membandingkan total volume chat dan pesanan tercatat</p>
                </div>
                {/* Legend indicator */}
                <div className="flex items-center gap-3 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 block"></span> Chat
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span> Order
                  </span>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <div className="flex-1 w-full relative mt-2">
                {volumeChartBars.length > 0 ? (
                  <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                    {/* Y Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y = 20 + ratio * 130;
                      return (
                        <line
                          key={index}
                          x1="50"
                          y1={y}
                          x2="480"
                          y2={y}
                          stroke="#27272a"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {/* Bars Render */}
                    {volumeChartBars.map((bar, i) => (
                      <g key={i}>
                        {/* Chat Bar */}
                        <rect
                          x={bar.chat.x}
                          y={bar.chat.y}
                          width={bar.chat.width}
                          height={Math.max(0, bar.chat.height)}
                          fill={hoveredVolumePoint?.date === bar.date ? "#3b82f6" : "#2563eb"}
                          rx="2"
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredVolumePoint(bar)}
                          onMouseLeave={() => setHoveredVolumePoint(null)}
                        />
                        {/* Order Bar */}
                        <rect
                          x={bar.order.x}
                          y={bar.order.y}
                          width={bar.order.width}
                          height={Math.max(0, bar.order.height)}
                          fill={hoveredVolumePoint?.date === bar.date ? "#10b981" : "#059669"}
                          rx="2"
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredVolumePoint(bar)}
                          onMouseLeave={() => setHoveredVolumePoint(null)}
                        />
                      </g>
                    ))}

                    {/* X axis labels (dates) */}
                    {volumeChartBars.map((bar, i) => {
                      const showLabel =
                        filteredAnalytics.length <= 7 ||
                        (filteredAnalytics.length <= 15 && i % 2 === 0) ||
                        i % 5 === 0 ||
                        i === filteredAnalytics.length - 1;

                      if (!showLabel) return null;
                      const dateParts = bar.date.split("-");
                      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : bar.date;
                      
                      // Calculate center of the bar group
                      const groupCenterX = (bar.chat.x + bar.order.x + bar.order.width) / 2;

                      return (
                        <text
                          key={i}
                          x={groupCenterX}
                          y="168"
                          fill="#71717a"
                          fontSize="9"
                          textAnchor="middle"
                          className="font-medium"
                        >
                          {formattedDate}
                        </text>
                      );
                    })}

                    {/* Y Axis Labels */}
                    <text x="40" y="24" fill="#71717a" fontSize="8" textAnchor="end" className="font-semibold">
                      {Math.max(...filteredAnalytics.map((d) => Math.max(d.total_chat, d.total_order)), 10)}
                    </text>
                    <text x="40" y="153" fill="#71717a" fontSize="8" textAnchor="end" className="font-semibold">
                      0
                    </text>
                  </svg>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500 font-medium">
                    Belum ada data volume chat & pesanan.
                  </div>
                )}

                {/* Floating Tooltip HTML Overlay for volume */}
                {hoveredVolumePoint && (
                  <div
                    className="absolute bg-zinc-950 border border-zinc-800 rounded-lg p-2 shadow-2xl pointer-events-none text-[10px] z-20 flex flex-col gap-0.5"
                    style={{
                      left: `${Math.min(360, (hoveredVolumePoint.chat.x / 500) * 100)}%`,
                      top: `${Math.max(10, (Math.min(hoveredVolumePoint.chat.y, hoveredVolumePoint.order.y) / 180) * 100 - 45)}%`,
                      transform: "translateX(-20%)",
                    }}
                  >
                    <span className="text-zinc-500 font-bold">{hoveredVolumePoint.date}</span>
                    <span className="text-blue-400 font-bold flex items-center gap-1.5">
                      💬 Chat: {hoveredVolumePoint.chat.value}
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      🛍️ Order: {hoveredVolumePoint.order.value}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Simulator Column (Right, 4 cols) */}
          <div className="lg:col-span-4 bg-zinc-900 border border-zinc-850 rounded-xl p-5 shadow-xl flex flex-col">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>🤖</span> AI Chat Simulator
              </h2>
              <p className="text-[11px] text-zinc-500">Simulasikan percakapan pelanggan untuk menguji parser pesanan & AI</p>
            </div>

            <form onSubmit={handleSimulateChat} className="mt-4 flex flex-col gap-2">
              <textarea
                value={simulatorMessage}
                onChange={(e) => setSimulatorMessage(e.target.value)}
                placeholder='Contoh: "Halo, saya mau beli 2 boba brown sugar dan dimsum 1 ya kak"'
                className="w-full min-h-22.5 text-xs p-3 rounded-lg bg-zinc-950 border border-zinc-805 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-600 transition-all font-medium resize-none leading-relaxed"
              />
              <button
                type="submit"
                disabled={simulatorLoading || !simulatorMessage.trim()}
                className="w-full py-2 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {simulatorLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Memproses...
                  </>
                ) : (
                  "Kirim ke Bot CS"
                )}
              </button>
            </form>

            <div className="mt-4 flex-1 flex flex-col bg-zinc-950 rounded-lg border border-zinc-850 p-4 min-h-42.5 overflow-y-auto">
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider block mb-2">
                Respon AI / Invoice
              </span>

              {simulatorReply ? (
                <div className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-zinc-300 flex-1">
                  {simulatorIsOrder ? (
                    <div className="border border-emerald-900/30 bg-emerald-950/10 p-3 rounded-lg text-emerald-300">
                      {simulatorReply}
                    </div>
                  ) : (
                    <div className="border border-zinc-850 bg-zinc-900/35 p-3 rounded-lg text-zinc-400">
                      {simulatorReply}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-2xl text-zinc-700">💬</span>
                  <p className="text-[11px] text-zinc-600 mt-2 font-medium">
                    Belum ada chat yang dikirim. Kirim pesan di atas untuk melihat respon bot.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Orders Management Table */}
        <section className="bg-zinc-900 border border-zinc-850 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>📋</span> Daftar Pesanan Pelanggan
              </h2>
              <p className="text-[11px] text-zinc-500">Kelola pesanan masuk dan ganti status pemesanan</p>
            </div>

            {/* Table Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <input
                type="text"
                placeholder="Cari customer atau menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-600 transition-all font-medium flex-1 sm:flex-none"
              />

              {/* Status filter dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300 focus:outline-none focus:border-amber-600 transition-all font-semibold"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">PENDING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-3">Tanggal</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Pesanan</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 pr-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-xs font-medium text-zinc-300">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const statusStyles: Record<string, string> = {
                      PENDING: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                      COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                      CANCELLED: "bg-red-500/10 border-red-500/20 text-red-400",
                    };

                    return (
                      <tr
                        key={order.rowNumber}
                        className="hover:bg-zinc-850/30 transition-all"
                      >
                        <td className="py-3.5 pl-3 text-zinc-500 font-mono text-[10px]">
                          {order.date}
                        </td>
                        <td className="py-3.5 font-bold text-zinc-200">
                          {order.customer}
                        </td>
                        <td className="py-3.5 capitalize">
                          {order.item}
                        </td>
                        <td className="py-3.5 text-center font-mono text-zinc-400">
                          {order.qty}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-zinc-100">
                          Rp {order.total.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 border rounded-full text-[9px] font-extrabold tracking-wider ${
                              statusStyles[order.status] || "bg-zinc-800 border-zinc-700 text-zinc-300"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-3 text-center relative">
                          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
                            {(["PENDING", "COMPLETED", "CANCELLED"] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(order.rowNumber, st)}
                                disabled={updatingRowNumber === order.rowNumber}
                                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                                  order.status === st
                                    ? st === "PENDING"
                                      ? "bg-amber-600/90 text-white"
                                      : st === "COMPLETED"
                                      ? "bg-emerald-600/90 text-white"
                                      : "bg-red-600/90 text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                                } disabled:opacity-50`}
                              >
                                {st === "PENDING" ? "Pend" : st === "COMPLETED" ? "Comp" : "Canc"}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                      Tidak ada pesanan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
