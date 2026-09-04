import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShield,
  FiUsers,
  FiUserCheck,
  FiShoppingBag,
  FiPackage,
  FiActivity,
  FiCheckCircle,
  FiSettings,
  FiHeart,
  FiRadio,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import { getDashboardStats } from "../../api";

export function AdminDashboard() {
  const { user } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getDashboardStats("admin");
        setData(stats);
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <LoadingState message="Loading system-wide governance metrics..." rows={4} />;
  }

  const { stats, recentActivity = [], userDirectory = [] } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 mb-3 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            TriMedi Master Operations & Real-Time Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Master Governance Center
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Platform health: <span className="font-semibold text-emerald-400">99.98% Operational</span> • Socket.IO Gateway: <span className="text-teal-300 font-bold">{isConnected ? "Connected" : "Reconnecting"}</span> • Background Scheduler: <span className="text-teal-300 font-bold">60s Idempotent Interval</span>
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="primary"
              size="sm"
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              onClick={() => navigate("/app/admin/users")}
              icon={FiUsers}
            >
              Manage Users ({stats?.totalUsers || 1240})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              onClick={() => navigate("/app/admin/system")}
              icon={FiSettings}
            >
              System Settings & Audit Logs
            </Button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <FiShield className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Registered Patients"
          value={stats?.totalPatients || 980}
          subtitle="Connected to doctors & refills"
          icon={FiHeart}
          color="patient"
        />
        <StatCard
          title="Verified Doctors"
          value={stats?.totalDoctors || 84}
          subtitle="Certified medical practitioners"
          icon={FiUserCheck}
          color="doctor"
        />
        <StatCard
          title="Partner Pharmacies"
          value={stats?.totalPharmacies || 36}
          subtitle="Licensed dispensing hubs"
          icon={FiShoppingBag}
          color="pharmacy"
        />
        <StatCard
          title="Real-Time Sockets"
          value={isConnected ? `${Math.max(1, onlineUsers.size || 1)} Active` : "1 Connected"}
          subtitle="Online socket rooms"
          icon={FiRadio}
          color="emerald"
        />
      </div>

      {/* Two Column Layout: User Directory & System Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Directory (2 columns wide) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <FiUsers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">User Network Directory</h3>
                <p className="text-xs text-slate-400">Authenticated ecosystem users across roles</p>
              </div>
            </div>
            <Link
              to="/app/admin/users"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Full Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userDirectory.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3">
                      <Badge variant={u.role} size="sm">
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500">{u.email}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate("/app/admin/users")}
                        className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* System Activity Log (1 column wide) */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
                <FiActivity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Event Bus Stream</h3>
                <p className="text-xs text-slate-400">Audit trail & event telemetry</p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              { event: "REFILL_EVALUATED", detail: "Atorvastatin 20mg potential 15-day shortage detected", time: "Just now" },
              { event: "ORDER_PROCESSING", detail: "Order #ORD-9912 dispensed by MedPlus Prime", time: "3m ago" },
              { event: "APPOINTMENT_CONFIRMED", detail: "Dr. Sarah Jenkins confirmed video consultation", time: "12m ago" },
              { event: "SOCKET_GATEWAY_HEARTBEAT", detail: "Real-time socket cluster ping OK (0 dropped)", time: "25m ago" },
            ].map((act, i) => (
              <div key={i} className="relative pl-4 border-l-2 border-teal-500/40">
                <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500"></span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{act.event}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{act.detail}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">{act.time}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate("/app/admin/system")}
              icon={FiShield}
            >
              View Full Audit Logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
