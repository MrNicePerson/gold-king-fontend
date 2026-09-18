import { useState, useEffect, useCallback } from "react";
import * as saAPI from "../../services/superAdminApi";

const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString("en-PK", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const fmtUSD = (n) =>
  n != null ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200",  dot: "bg-yellow-400"  },
  approved:  { label: "Approved",  bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400"    },
  completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  rejected:  { label: "Rejected",  bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-400"     },
};

const ORDER_TYPE_CONFIG = {
  buy:  { label: "Buy",  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  sell: { label: "Sell", bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200"    },
};

const METAL_CONFIG = {
  gold:   { label: "Gold",   bg: "bg-amber-50",  text: "text-amber-700" },
  silver: { label: "Silver", bg: "bg-slate-100", text: "text-slate-600" },
};

const Ico = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  refresh:  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  filter:   "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z",
  close:    "M6 18L18 6M6 6l12 12",
  orders:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  alert:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  chevLeft: "M15 19l-7-7 7-7",
  chevRight:"M9 5l7 7-7 7",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  phone:    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  mail:     "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  shop:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  receipt:  "M9 14l2 2 4-4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3h6a1 1 0 011 1v0a1 1 0 01-1 1H9a1 1 0 01-1-1v0a1 1 0 011-1z",
  check:    "M5 13l4 4L19 7",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold max-w-sm
      ${type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
      <Ico d={type === "error" ? ICONS.alert : ICONS.check} className="w-4 h-4 shrink-0" />
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none ml-1">×</button>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = ORDER_TYPE_CONFIG[type] ?? { label: type, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function MetalBadge({ metal, carat }) {
  const cfg = METAL_CONFIG[metal] ?? { label: metal, bg: "bg-gray-50", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label} {carat && <span className="opacity-70">{carat}</span>}
    </span>
  );
}

// ─── Order drawer ─────────────────────────────────────────────────────────────

function OrderDrawer({ order, open, onClose, onStatusChanged }) {
  const [changing, setChanging]     = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  useEffect(() => { setLocalOrder(order); }, [order]);

  if (!open || !localOrder) return null;

  const customer = localOrder.customerId;
  const shop     = localOrder.adminId;
  const date     = (d) => d ? new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const Row = ({ label, value, accent }) =>
    value ? (
      <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50">
        <span className="text-xs text-gray-400 font-medium shrink-0">{label}</span>
        <span className={`text-xs font-semibold text-right ${accent ?? "text-gray-800"}`}>{value}</span>
      </div>
    ) : null;

  const Section = ({ title, children }) => (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{title}</p>
      {children}
    </div>
  );

  const ALL_STATUSES = ["pending", "approved", "completed", "rejected"];
  const nextStatuses = ALL_STATUSES.filter((s) => s !== localOrder.status);

  const STATUS_BTN = {
    pending:   { bg: "bg-yellow-50 hover:bg-yellow-100",   text: "text-yellow-700",  border: "border-yellow-200"  },
    approved:  { bg: "bg-blue-50 hover:bg-blue-100",       text: "text-blue-700",    border: "border-blue-200"    },
    completed: { bg: "bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    rejected:  { bg: "bg-red-50 hover:bg-red-100",         text: "text-red-600",     border: "border-red-200"     },
  };

  const handleStatusChange = async (newStatus) => {
    setChanging(newStatus);
    try {
      const res = await saAPI.updateOrderStatus(localOrder._id, { status: newStatus });
      const updated = res.data?.order ?? { ...localOrder, status: newStatus };
      setLocalOrder(updated);
      onStatusChanged(updated);
    } catch (err) {
      onStatusChanged(null, err.response?.data?.message || "Failed to update status.");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <p className="font-black text-gray-900">Order Details</p>
            {localOrder.receiptNumber && (
              <p className="text-xs text-gray-400 mt-0.5">#{localOrder.receiptNumber}</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
            <Ico d={ICONS.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <TypeBadge type={localOrder.orderType} />
            <StatusBadge status={localOrder.status} />
            <MetalBadge metal={localOrder.metalType} carat={localOrder.carat} />
          </div>

          {/* ── Status change ── */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Change Status</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((s) => {
                const cfg = STATUS_BTN[s];
                const isChanging = changing === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={!!changing}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black border transition disabled:opacity-50
                      ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {isChanging ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Updating…
                      </span>
                    ) : (
                      `→ ${s.charAt(0).toUpperCase() + s.slice(1)}`
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Section title="Customer">
            <Row label="Name"  value={customer?.name} />
            <Row label="Email" value={customer?.email} />
            <Row label="Phone" value={customer?.phoneNumber} />
          </Section>

          <Section title="Shop">
            <Row label="Shop Name" value={shop?.shopName} />
            <Row label="Phone"     value={shop?.phoneNumber} />
          </Section>

          <Section title="Order Info">
            <Row label="Metal"    value={`${localOrder.metalType?.toUpperCase()} ${localOrder.carat ?? ""}`} />
            <Row label="Quantity" value={`${fmt(localOrder.quantity)} ${localOrder.unit}`} />
            <Row label="In Tola"  value={localOrder.quantityInTola ? `${localOrder.quantityInTola} tola` : null} />
            <Row label="In Gram"  value={localOrder.quantityInGram ? `${localOrder.quantityInGram} g` : null} />
            <Row label="Payment"  value={localOrder.paymentMethod?.toUpperCase()} />
            {localOrder.notes && <Row label="Notes" value={localOrder.notes} />}
          </Section>

          <Section title="Pricing">
            <Row label="Market Price USD"   value={fmtUSD(localOrder.marketPriceUSD)} />
            <Row label="Dollar Rate (PKR)"  value={localOrder.dollarRatePKR ? `PKR ${fmt(localOrder.dollarRatePKR, 2)}` : null} />
            <Row label="Base Price / Tola"  value={localOrder.basePricePerTolaPKR ? `PKR ${fmt(localOrder.basePricePerTolaPKR)}` : null} />
            <Row label="Admin Diff"         value={localOrder.adminDiffPKR != null ? `${localOrder.adminDiffPKR >= 0 ? "+" : ""}PKR ${fmt(localOrder.adminDiffPKR)}` : null} accent={localOrder.adminDiffPKR > 0 ? "text-emerald-600" : localOrder.adminDiffPKR < 0 ? "text-red-600" : "text-gray-400"} />
            <Row label="Final Price / Tola" value={localOrder.finalPricePerTolaPKR ? `PKR ${fmt(localOrder.finalPricePerTolaPKR)}` : null} accent="text-amber-700" />
            <Row label="Total Amount"       value={localOrder.totalAmount ? `PKR ${fmt(localOrder.totalAmount)}` : null} accent="text-gray-900" />
            {localOrder.finalizedAmount != null && localOrder.finalizedAmount !== localOrder.totalAmount && (
              <Row label="Finalized Amount" value={`PKR ${fmt(localOrder.finalizedAmount)}`} accent="text-emerald-700" />
            )}
          </Section>

          {localOrder.status === "completed" && (
            <Section title="Payment">
              <Row label="Payment Status" value={localOrder.paymentStatus?.toUpperCase()} accent={localOrder.paymentStatus === "paid" ? "text-emerald-600" : "text-yellow-600"} />
              {localOrder.paymentTime && <Row label="Payment Time" value={date(localOrder.paymentTime)} />}
              {localOrder.receiptNumber && <Row label="Receipt #" value={localOrder.receiptNumber} />}
            </Section>
          )}

          <Section title="Timeline">
            <Row label="Created"  value={date(localOrder.createdAt)} />
            {localOrder.approvedAt && <Row label="Approved" value={date(localOrder.approvedAt)} />}
            {localOrder.lockedAt   && <Row label="Locked"   value={date(localOrder.lockedAt)} />}
          </Section>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, onView, isMobile }) {
  const customer = order.customerId;
  const shop     = order.adminId;
  const date     = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  if (isMobile) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={order.orderType} />
            <MetalBadge metal={order.metalType} carat={order.carat} />
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900">{customer?.name ?? "—"}</p>
          <p className="text-xs text-gray-400">{customer?.phoneNumber ?? customer?.email ?? "—"}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Ico d={ICONS.shop} className="w-3 h-3" />
            <span>{shop?.shopName ?? "—"}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Qty: {fmt(order.quantity)} {order.unit}</p>
            <p className="text-sm font-black text-amber-700">PKR {fmt(order.finalizedAmount ?? order.totalAmount)}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">{date}</p>
            <button onClick={() => onView(order)} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition">
              <Ico d={ICONS.eye} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr className="hover:bg-gray-50/60 transition-colors border-b border-gray-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <TypeBadge type={order.orderType} />
          <MetalBadge metal={order.metalType} carat={order.carat} />
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-bold text-gray-900">{customer?.name ?? "—"}</p>
        <p className="text-xs text-gray-400">{customer?.phoneNumber ?? customer?.email ?? "—"}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-gray-700">{shop?.shopName ?? "—"}</p>
        <p className="text-xs text-gray-400">{shop?.phoneNumber ?? "—"}</p>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">
        {fmt(order.quantity)} {order.unit}
        {order.quantityInTola != null && (
          <p className="text-xs text-gray-400">{order.quantityInTola} tola</p>
        )}
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-black text-amber-700">PKR {fmt(order.finalizedAmount ?? order.totalAmount)}</p>
        {order.finalPricePerTolaPKR && (
          <p className="text-xs text-gray-400">@ PKR {fmt(order.finalPricePerTolaPKR)}/tola</p>
        )}
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={order.status} />
        {order.paymentStatus && order.status === "completed" && (
          <p className={`text-[10px] font-bold mt-1 ${order.paymentStatus === "paid" ? "text-emerald-600" : "text-yellow-600"}`}>
            {order.paymentStatus.toUpperCase()}
          </p>
        )}
      </td>
      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{date}</td>
      <td className="px-5 py-4">
        <button
          onClick={() => onView(order)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-500 text-xs font-bold transition"
        >
          <Ico d={ICONS.eye} className="w-3.5 h-3.5" /> View
        </button>
      </td>
    </tr>
  );
}

export default function Orders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");

  const [status,  setStatus]  = useState("");
  const [adminId, setAdminId] = useState("");
  const [search,  setSearch]  = useState("");

  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  const [drawerOrder, setDrawerOrder] = useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const fetchOrders = useCallback(async (isRefresh = false, pg = page) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (status)  params.status  = status;
      if (adminId) params.adminId = adminId;
      const res = await saAPI.getAllOrders(params);
      const d = res.data ?? res;
      setOrders(d.orders ?? []);
      setTotal(d.total ?? 0);
      setPages(d.pages ?? 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, status, adminId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleFilterChange = (key, val) => {
    setPage(1);
    if (key === "status")  setStatus(val);
    if (key === "adminId") setAdminId(val);
  };

  const changePage = (p) => {
    setPage(p);
    fetchOrders(false, p);
  };

  // Update order in list optimistically after status change
  const handleStatusChanged = (updatedOrder, errorMsg) => {
    if (errorMsg) { showToast(errorMsg, "error"); return; }
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o))
    );
    showToast(`Order status updated to ${updatedOrder.status}.`);
  };

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.customerId?.name?.toLowerCase().includes(q) ||
      o.customerId?.email?.toLowerCase().includes(q) ||
      o.customerId?.phoneNumber?.includes(q) ||
      o.adminId?.shopName?.toLowerCase().includes(q) ||
      o.receiptNumber?.toLowerCase().includes(q) ||
      o.metalType?.toLowerCase().includes(q) ||
      o.orderType?.toLowerCase().includes(q)
    );
  });

  const counts = {
    pending:   orders.filter(o => o.status === "pending").length,
    approved:  orders.filter(o => o.status === "approved").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected:  orders.filter(o => o.status === "rejected").length,
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
          <Ico d={ICONS.alert} className="w-7 h-7" />
        </div>
        <div>
          <p className="font-black text-gray-900 text-lg">Failed to load orders</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
        <button onClick={() => fetchOrders()} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition">
          Try Again
        </button>
      </div>
    );

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">All orders across every shop — {fmt(total)} total</p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Ico d={ICONS.refresh} className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "pending",   label: "Pending",   color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200"  },
          { key: "approved",  label: "Approved",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200"      },
          { key: "completed", label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200"},
          { key: "rejected",  label: "Rejected",  color: "text-red-700",     bg: "bg-red-50 border-red-200"        },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => handleFilterChange("status", status === key ? "" : key)}
            className={`rounded-2xl border px-4 py-3 text-center transition hover:shadow-sm ${
              status === key ? bg + " shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"
            }`}
          >
            <p className={`text-2xl font-black ${status === key ? color : "text-gray-900"}`}>{counts[key]}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Ico d={ICONS.search} className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, shop, metal, receipt…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition placeholder-gray-300"
          />
        </div>
        <select
          value={status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        {(status || search) && (
          <button
            onClick={() => { setStatus(""); setSearch(""); setPage(1); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
          >
            <Ico d={ICONS.close} className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-200 p-4">
            <Ico d={ICONS.orders} className="w-full h-full" />
          </div>
          <p className="font-bold text-gray-600">
            {search || status ? "No orders match your filters" : "No orders yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search || status ? "Try adjusting your search or filter" : "Orders will appear here once customers place them"}
          </p>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onView={(o) => { setDrawerOrder(o); setDrawerOpen(true); }}
              isMobile
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Type / Metal", "Customer", "Shop", "Quantity", "Amount", "Status", "Date", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    onView={(o) => { setDrawerOrder(o); setDrawerOpen(true); }}
                    isMobile={false}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {pages} · {fmt(total)} orders</p>
              <div className="flex items-center gap-2">
                <button onClick={() => changePage(page - 1)} disabled={page <= 1}
                  className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">
                  <Ico d={ICONS.chevLeft} className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const pg = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                  return (
                    <button key={pg} onClick={() => changePage(pg)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition
                        ${pg === page ? "bg-amber-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => changePage(page + 1)} disabled={page >= pages}
                  className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">
                  <Ico d={ICONS.chevRight} className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isMobile && pages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => changePage(page - 1)} disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 transition">
            <Ico d={ICONS.chevLeft} className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs text-gray-400">Page {page} of {pages}</span>
          <button onClick={() => changePage(page + 1)} disabled={page >= pages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 transition">
            Next <Ico d={ICONS.chevRight} className="w-4 h-4" />
          </button>
        </div>
      )}

      <OrderDrawer
        open={drawerOpen}
        order={drawerOrder}
        onClose={() => setDrawerOpen(false)}
        onStatusChanged={handleStatusChanged}
      />

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
    </div>
  );
}