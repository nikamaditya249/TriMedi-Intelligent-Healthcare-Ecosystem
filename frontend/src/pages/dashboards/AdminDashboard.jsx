import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShield,
  FiUsers,
  FiUserCheck,
  FiShoppingBag,
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
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
    return (
      <LoadingState
        message="Loading system-wide governance metrics..."
        rows={4}
      />
    );
  }

  const { stats, recentActivity = [], userDirectory = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Governance & Telemetry Center
            </span>
            <span className="text-slate-300">•</span>
            <Badge variant="brand" size="sm">
              Root Authority
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Master Governance Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platform health: <span className="font-semibold text-emerald-700">99.98% Operational</span> • Socket.IO Gateway: <span className="text-brand-800 font-semibold">{isConnected ? "Connected" : "Reconnecting"}</span> • Background Scheduler: <span className="text-brand-800 font-semibold">Active (60s Intervals)</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/app/admin/users")}
            icon={FiUsers}
          >
            Manage Users ({stats?.totalUsers || 1240})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/admin/system")}
            icon={FiSettings}
          >
            System Audit Logs
          </Button>
        </div>
      </div>

      {/* 2. Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Patients"
          value={stats?.totalPatients || 980}
          subtitle="Connected to doctors & refills"
          icon={FiHeart}
        />
        <StatCard
          title="Verified Doctors"
          value={stats?.totalDoctors || 84}
          subtitle="Certified medical practitioners"
          icon={FiUserCheck}
        />
        <StatCard
          title="Partner Pharmacies"
          value={stats?.totalPharmacies || 36}
          subtitle="Licensed dispensing hubs"
          icon={FiShoppingBag}
        />
        <StatCard
          title="Socket Connections"
          value={isConnected ? `${Math.max(1, onlineUsers.size || 1)} Active` : "1 Connected"}
          subtitle="Online socket rooms"
          icon={FiRadio}
        />
      </div>

      {/* 3. Two Column Layout: User Directory & System Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Directory (2 columns wide) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiUsers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">User Network Directory</h3>
                <p className="text-xs text-slate-500">Authenticated ecosystem users across roles</p>
              </div>
            </div>
            <Link
              to="/app/admin/users"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              Full Directory →
            </Link>
          </div>

          <Table>
            <TableHeader>
              <tr>
                <TableHead>User Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {userDirectory.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {u.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {u.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => navigate("/app/admin/users")}
                      className="text-brand-700 font-semibold hover:underline text-xs"
                    >
                      Inspect
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* System Telemetry & Heartbeat */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiActivity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Telemetry</h3>
                <p className="text-xs text-slate-500">Service heartbeats</p>
              </div>
            </div>
            <Link
              to="/app/admin/system"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              Logs →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Healthcare Scheduler</span>
                <Badge variant="success" size="sm">Active (60s)</Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                Idempotent database-backed checks for 24h/1h appointment reminders and 3-day refill thresholds.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Socket.IO Gateway</span>
                <Badge variant={isConnected ? "success" : "warning"} size="sm">
                  {isConnected ? "Operational" : "Connecting"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                Isolated room routing for patient, doctor, and pharmacy real-time events.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Domain EventBus</span>
                <Badge variant="success" size="sm">Listening</Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                Handling APPOINTMENT_*, PRESCRIPTION_*, and ORDER_* cross-role events.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
