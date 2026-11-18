import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Grid2X2,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Package,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Trash2,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getFirebaseFirestore, getFirebaseStorage, isFirebaseConfigured } from "../firebase.js";
import { sampleProducts } from "../data/sampleProducts.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import formatPrice from "../utils/formatPrice.js";
import CartDrawer from "../components/CartDrawer.jsx";
import FabricImage from "../components/FabricImage.jsx";
import NoIndexMeta from "../components/NoIndexMeta.jsx";
import "./AdminDashboard.css";

const emptyFabric = { name: "", category: "", price: "", unit: "", tag: "", image: "", inStock: true };

const navItems = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "inventory", label: "Inventory", Icon: Boxes },
  { id: "catalog", label: "Catalog", Icon: PackageSearch },
  { id: "stock", label: "Stock levels", Icon: Package },
  { id: "customers", label: "Customers", Icon: UsersRound },
  { id: "sales", label: "Sales", Icon: ShoppingCart },
  { id: "reports", label: "Reports", Icon: BarChart3 },
  { id: "settings", label: "Settings", Icon: Settings },
];

const pageDetails = {
  overview: ["Overview", "A clear view of your fabric store, all in one place."],
  activity: ["Activity", "Recent catalog updates recorded in your inventory."],
  inventory: ["Inventory", "Manage the products currently in your store."],
  catalog: ["Fabric catalog", "Browse, search and manage every fabric in your collection."],
  stock: ["Stock levels", "See which fabrics are available to your customers."],
  customers: ["Customers", "Your registered Tehilla Fabrics customers."],
  sales: ["Sales analytics", "Sales insights will appear when order tracking is connected."],
  reports: ["Reports", "A helpful snapshot of your current product catalog."],
  settings: ["Settings", "Your store setup and inventory tracking details."],
};

function getActivityDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatActivityDate(value) {
  const date = getActivityDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function toCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function StatCard({ Icon, label, value, detail, tone = "green" }) {
  return (
    <article className="tf-stat-card">
      <div className={`tf-stat-icon ${tone}`}><Icon size={19} strokeWidth={1.8} /></div>
      <p className="tf-stat-label">{label}</p>
      <div className="tf-stat-value">{value}</div>
      <p className="tf-stat-detail">{detail}</p>
    </article>
  );
}

function StatusBadge({ inStock }) {
  return (
    <span className={`tf-status ${inStock ? "available" : "unavailable"}`}>
      <span />{inStock ? "In stock" : "Out of stock"}
    </span>
  );
}

function EmptyState({ Icon = PackageSearch, title, children, action }) {
  return (
    <div className="tf-empty">
      <span className="tf-empty-icon"><Icon size={23} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

function CategoryChart({ categories }) {
  if (!categories.length) {
    return <EmptyState Icon={BarChart3} title="No category data yet">Add fabrics to see how your catalog is distributed.</EmptyState>;
  }
  const maxCount = Math.max(...categories.map(([, count]) => count), 1);
  return (
    <div className="tf-category-chart" role="img" aria-label="Fabric count by category">
      {categories.map(([name, count], index) => (
        <div className="tf-chart-row" key={name}>
          <div className="tf-chart-label"><span>{name}</span><strong>{count}</strong></div>
          <div className="tf-chart-track"><span className={`tf-chart-fill chart-tone-${index % 4}`} style={{ width: `${Math.max((count / maxCount) * 100, 4)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsLoadError, setProductsLoadError] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersLoadError, setCustomersLoadError] = useState(false);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [editing, setEditing] = useState(null);
  const [isEditorClosing, setIsEditorClosing] = useState(false);
  const [form, setForm] = useState(emptyFabric);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [noticeClosing, setNoticeClosing] = useState(false);
  const noticeTimers = useRef({ duration: null, exit: null });
  const [quickPrice, setQuickPrice] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, cachedProfile, logout } = useAuth();
  const { itemCount } = useCart();
  const displayName = user?.displayName || cachedProfile?.name || user?.email || "Admin";
  const outOfStockCount = products.filter((item) => item.inStock === false).length;

  useEffect(() => () => {
    window.clearTimeout(noticeTimers.current.duration);
    window.clearTimeout(noticeTimers.current.exit);
  }, []);

  useEffect(() => {
    if (!isEditorClosing) return undefined;
    const timeout = window.setTimeout(() => {
      setEditing(null);
      setIsEditorClosing(false);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [isEditorClosing]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setProductsLoading(false);
      return undefined;
    }
    let cancelled = false;
    let unsubscribe;
    getFirebaseFirestore()
      .then((database) => {
        if (cancelled) return;
        if (!database) {
          setProductsLoading(false);
          setProductsLoadError(true);
          setNotice({ type: "error", text: "Could not load fabrics. Check your Firebase configuration and rules." });
          return;
        }
        unsubscribe = onSnapshot(
          collection(database, "products"),
          (snapshot) => {
            setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            setProductsLoading(false);
            setProductsLoadError(false);
          },
          (error) => {
            console.error("Could not load products for admin.", error);
            setProductsLoading(false);
            setProductsLoadError(true);
            setNotice({ type: "error", text: "Could not load fabrics. Check your Firebase configuration and rules." });
          },
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load products for admin.", error);
        setProductsLoading(false);
        setProductsLoadError(true);
        setNotice({ type: "error", text: "Could not load fabrics. Check your Firebase configuration and rules." });
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (tab !== "customers") return undefined;
    let cancelled = false;
    let unsubscribe;
    setCustomersLoading(true);
    setCustomersLoadError(false);
    getFirebaseFirestore()
      .then((database) => {
        if (cancelled) return;
        if (!database) {
          setCustomersLoading(false);
          setCustomersLoadError(true);
          setNotice({ type: "error", text: "Could not load customers. Check your Firebase configuration and rules." });
          return;
        }
        unsubscribe = onSnapshot(
          collection(database, "users"),
          (snapshot) => {
            setCustomers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
            setCustomersLoading(false);
          },
          (error) => {
            console.error("Could not load customer records.", error);
            setCustomersLoading(false);
            setCustomersLoadError(true);
            setNotice({ type: "error", text: "Could not load customers. Check your Firebase rules." });
          },
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load customer records.", error);
        setCustomersLoading(false);
        setCustomersLoadError(true);
        setNotice({ type: "error", text: "Could not load customers. Check your Firebase rules." });
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [tab]);

  useEffect(() => {
    if (!photo) {
      setPreview(form.image || "");
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo, form.image]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((item) => item.category).filter(Boolean))],
    [products],
  );
  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesTerm = !term || item.name?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term);
      const matchesStock = stockFilter === "all"
        || (stockFilter === "in" && item.inStock !== false)
        || (stockFilter === "out" && item.inStock === false);
      return matchesCategory && matchesTerm && matchesStock;
    });
  }, [products, category, query, stockFilter]);
  const categoryCounts = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      const name = product.category || "Uncategorized";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()].sort((first, second) => second[1] - first[1]);
  }, [products]);
  const recentActivity = useMemo(() => products
    .map((product) => {
      const created = getActivityDate(product.createdAt);
      const updated = getActivityDate(product.updatedAt);
      const date = updated || created;
      return date ? { product, date, isUpdate: Boolean(updated && (!created || updated.getTime() > created.getTime() + 1000)) } : null;
    })
    .filter(Boolean)
    .sort((first, second) => second.date.getTime() - first.date.getTime())
    .slice(0, 8), [products]);

  function showNotice(type, text) {
    window.clearTimeout(noticeTimers.current.duration);
    window.clearTimeout(noticeTimers.current.exit);
    setNoticeClosing(false);
    setNotice({ type, text });
    noticeTimers.current.duration = window.setTimeout(() => {
      setNoticeClosing(true);
      noticeTimers.current.exit = window.setTimeout(() => {
        setNotice(null);
        setNoticeClosing(false);
      }, 180);
    }, 4020);
  }

  function navigateTo(section) {
    setTab(section);
    setMobileNavOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    if (section !== "catalog") setQuery("");
  }

  function openEditor(product = null) {
    setIsEditorClosing(false);
    setEditing(product || { id: null });
    setForm(product ? { ...emptyFabric, ...product, price: String(product.price ?? "") } : emptyFabric);
    setPhoto(null);
    setPreview(product?.image || "");
  }

  function closeEditor() {
    setIsEditorClosing(true);
  }

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      showNotice("error", "Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotice("error", "Image must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }
    setPhoto(file);
  }

  async function saveFabric(event) {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim() || !Number.isFinite(price) || price < 0) {
      showNotice("error", "Enter a name, category, valid non-negative price and unit.");
      return;
    }
    if (!isFirebaseConfigured) {
      showNotice("error", "Firebase is not configured. Add your Firebase values to .env.");
      return;
    }
    setBusy(true);
    try {
      const db = await getFirebaseFirestore();
      if (!db) throw new Error("Firebase Firestore is not configured.");
      const target = editing?.id ? doc(db, "products", editing.id) : doc(collection(db, "products"));
      let image = form.image;
      if (photo) {
        const { getDownloadURL, ref, uploadBytes } = await import("firebase/storage");
        const storage = await getFirebaseStorage();
        if (!storage) throw new Error("Firebase Storage is not configured.");
        const imageRef = ref(storage, `product-images/${target.id}/${Date.now()}-${photo.name}`);
        await uploadBytes(imageRef, photo, { contentType: photo.type });
        image = await getDownloadURL(imageRef);
      }
      const data = {
        name: form.name.trim(),
        category: form.category.trim(),
        price,
        unit: form.unit.trim(),
        tag: form.tag.trim(),
        image,
        inStock: Boolean(form.inStock),
        updatedAt: new Date().toISOString(),
      };
      if (editing?.id) await updateDoc(target, data);
      else await setDoc(target, { ...data, createdAt: new Date().toISOString() });
      closeEditor();
      showNotice("success", editing?.id ? "Fabric updated successfully." : "Fabric added successfully.");
    } catch (error) {
      console.error("Could not save fabric.", error);
      showNotice("error", "Could not save this fabric. Check your connection and Firebase permissions.");
    } finally {
      setBusy(false);
    }
  }

  async function removeFabric(product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    try {
      const db = await getFirebaseFirestore();
      if (!db) throw new Error("Firebase Firestore is not configured.");
      await deleteDoc(doc(db, "products", product.id));
      showNotice("success", "Fabric deleted.");
    } catch (error) {
      console.error("Could not delete fabric.", error);
      showNotice("error", "Could not delete this fabric. Check your Firebase permissions.");
    }
  }

  async function toggleStock(product) {
    const inStock = product.inStock === false;
    try {
      const db = await getFirebaseFirestore();
      if (!db) throw new Error("Firebase Firestore is not configured.");
      await updateDoc(doc(db, "products", product.id), { inStock });
      showNotice("success", `${product.name} marked ${inStock ? "in stock" : "out of stock"}.`);
    } catch (error) {
      console.error("Could not update fabric stock.", error);
      showNotice("error", "Could not update stock status.");
    }
  }

  async function savePrice(product, value) {
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) {
      showNotice("error", "Enter a valid non-negative price.");
      return;
    }
    try {
      const db = await getFirebaseFirestore();
      if (!db) throw new Error("Firebase Firestore is not configured.");
      await updateDoc(doc(db, "products", product.id), { price, updatedAt: new Date().toISOString() });
      showNotice("success", "Price updated.");
    } catch (error) {
      console.error("Could not update fabric price.", error);
      showNotice("error", "Could not update this price.");
    }
    setQuickPrice(null);
  }

  async function importSamples() {
    if (!isFirebaseConfigured || productsLoading || products.length || busy) return;
    setBusy(true);
    try {
      const db = await getFirebaseFirestore();
      if (!db) throw new Error("Firebase Firestore is not configured.");
      await Promise.all(sampleProducts.map((product) => setDoc(doc(db, "products", product.id), {
        ...product,
        createdAt: new Date().toISOString(),
      })));
      const snapshot = await getDocs(collection(db, "products"));
      setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      showNotice("success", `${sampleProducts.length} sample fabrics imported.`);
    } catch (error) {
      console.error("Could not import sample products.", error);
      showNotice("error", "Sample import failed. Check Firebase permissions and try again.");
    } finally {
      setBusy(false);
    }
  }

  function exportInventory() {
    const rows = [
      ["Fabric", "Category", "Price (NGN)", "Unit", "Availability"],
      ...products.map((product) => [
        product.name,
        product.category,
        product.price,
        product.unit,
        product.inStock === false ? "Out of stock" : "In stock",
      ]),
    ];
    const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tehilla-fabrics-inventory.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function signOut() {
    try {
      await logout();
    } catch (error) {
      console.error("Could not log out.", error);
      showNotice("error", "Could not sign out. Please try again.");
    }
  }

  function renderFabricCard(product) {
    return (
      <article className="tf-fabric-card" key={product.id}>
        <div className="tf-fabric-photo">
          <FabricImage src={product.image} alt={`${product.name} fabric`} width={440} height={300} />
          <StatusBadge inStock={product.inStock !== false} />
        </div>
        <div className="tf-fabric-info">
          <p className="tf-fabric-category">{product.category || "Uncategorized"}</p>
          <h3>{product.name}</h3>
          <div className="tf-fabric-price-row">
            {quickPrice === product.id ? (
              <input
                aria-label={`New price for ${product.name}`}
                type="number"
                min="0"
                step="1"
                defaultValue={product.price}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    savePrice(product, event.currentTarget.value);
                  }
                  if (event.key === "Escape") setQuickPrice(null);
                }}
                onBlur={() => setQuickPrice(null)}
              />
            ) : (
              <button className="tf-price-edit" onClick={() => setQuickPrice(product.id)} aria-label={`Edit price for ${product.name}`}>
                {formatPrice(product.price)} <Pencil size={12} />
              </button>
            )}
            <span>{product.unit || "Unit not specified"}</span>
          </div>
          <div className="tf-fabric-actions">
            <button className="tf-card-edit" onClick={() => openEditor(product)}><Pencil size={14} /> Edit</button>
            <button className="tf-card-delete" onClick={() => removeFabric(product)} aria-label={`Delete ${product.name}`}><Trash2 size={15} /> Delete</button>
          </div>
        </div>
      </article>
    );
  }

  function renderCatalog() {
    if (productsLoading) return <div className="tf-panel-message">Loading fabrics…</div>;
    if (productsLoadError) return <div className="tf-panel-message error" role="alert">Could not load fabrics. Check your Firebase configuration and rules.</div>;
    return (
      <>
        {!products.length ? (
          <div className="tf-empty-panel">
            <EmptyState Icon={PackageSearch} title="Your catalog is ready for its first fabric">
              Sample prices are placeholders. Review prices and photos after importing.
              <button className="tf-button secondary" onClick={importSamples} disabled={busy || !isFirebaseConfigured}>
                {busy ? "Importing…" : "Import sample products"}
              </button>
            </EmptyState>
          </div>
        ) : !visibleProducts.length ? (
          <EmptyState Icon={Search} title="No fabrics found">Try a different search or update your category and availability filters.</EmptyState>
        ) : (
          <div className={`tf-fabric-grid ${view === "list" ? "list-view" : ""}`}>
            {visibleProducts.map(renderFabricCard)}
          </div>
        )}
      </>
    );
  }

  function renderOverview() {
    return (
      <>
        <section className="tf-welcome">
          <div>
            <span className="tf-eyebrow"><span /> STORE OVERVIEW</span>
            <h1>Welcome back, Admin!</h1>
            <p>Here's what's happening with your fabric store today.</p>
          </div>
          <button className="tf-button primary" onClick={() => openEditor()}><Plus size={17} /> Add new fabric</button>
        </section>
        <section className="tf-stats-grid" aria-label="Inventory overview">
          <StatCard Icon={Boxes} label="Total fabrics" value={productsLoading ? "—" : products.length} detail="Products in your catalog" />
          <StatCard Icon={BarChart3} label="Total stock value" value="Not tracked" detail="Quantity data isn't available" tone="sage" />
          <StatCard Icon={CheckCircle2} label="Available fabrics" value={productsLoading ? "—" : products.filter((item) => item.inStock !== false).length} detail="Marked as in stock" tone="blue" />
          <StatCard Icon={CircleAlert} label="Low stock items" value="Not tracked" detail="Quantity data isn't available" tone="amber" />
        </section>
        <section className="tf-overview-grid">
          <div className="tf-panel tf-inventory-panel">
            <div className="tf-panel-heading">
              <div><h2>Inventory overview</h2><p>A quick look at your current collection</p></div>
              <button className="tf-text-link" onClick={() => navigateTo("inventory")}>View inventory <ArrowUpRight size={15} /></button>
            </div>
            {productsLoading ? <div className="tf-panel-message">Loading inventory…</div> : productsLoadError ? (
              <div className="tf-panel-message error">Inventory couldn't be loaded.</div>
            ) : (
              <>
                <div className="tf-stock-summary">
                  <div><span className="tf-stock-dot green" /><span>In stock</span><strong>{products.filter((item) => item.inStock !== false).length}</strong></div>
                  <div><span className="tf-stock-dot red" /><span>Out of stock</span><strong>{outOfStockCount}</strong></div>
                </div>
                <div className="tf-availability-bar" aria-label={`${products.length ? Math.round((products.length - outOfStockCount) / products.length * 100) : 0}% marked in stock`}>
                  <span style={{ width: `${products.length ? (products.length - outOfStockCount) / products.length * 100 : 0}%` }} />
                </div>
                <p className="tf-chart-caption">Availability is based on each fabric's stock status.</p>
                {categoryCounts.length > 0 && <div className="tf-top-categories"><h3>Top categories</h3>{categoryCounts.slice(0, 3).map(([name, count]) => <div key={name}><span>{name}</span><strong>{count} {count === 1 ? "fabric" : "fabrics"}</strong></div>)}</div>}
                {!products.length && <p className="tf-chart-caption">Add a fabric to start building your inventory.</p>}
              </>
            )}
          </div>
          <div className="tf-panel tf-recent-panel">
            <div className="tf-panel-heading">
              <div><h2>Recent activity</h2><p>Latest catalog changes</p></div>
              <button className="tf-icon-link" onClick={() => navigateTo("activity")} aria-label="View all activity"><ArrowUpRight size={17} /></button>
            </div>
            {productsLoading ? <div className="tf-panel-message">Loading activity…</div> : recentActivity.length ? (
              <div className="tf-activity-list compact">
                {recentActivity.slice(0, 4).map(({ product, date, isUpdate }) => (
                  <div className="tf-activity-item" key={product.id}>
                    <span className="tf-activity-icon">{isUpdate ? <Pencil size={15} /> : <Plus size={15} />}</span>
                    <div><strong>{product.name}</strong><p>{isUpdate ? "Catalog item updated" : "Fabric added to catalog"}</p></div>
                    <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date)}</time>
                  </div>
                ))}
              </div>
            ) : <p className="tf-chart-caption">Newly added or updated fabrics will appear here when activity dates are available.</p>}
          </div>
        </section>
        <section className="tf-panel tf-latest-panel">
          <div className="tf-panel-heading">
            <div><h2>Recently added fabrics</h2><p>Your latest items in the catalog</p></div>
            <button className="tf-text-link" onClick={() => navigateTo("catalog")}>Browse catalog <ArrowUpRight size={15} /></button>
          </div>
          {productsLoading ? <div className="tf-panel-message">Loading fabrics…</div> : (
            <div className="tf-latest-grid">{products.slice(0, 4).map(renderFabricCard)}</div>
          )}
        </section>
      </>
    );
  }

  function renderInventory() {
    if (productsLoading) return <div className="tf-panel-message">Loading inventory…</div>;
    if (productsLoadError) return <div className="tf-panel-message error" role="alert">Could not load inventory. Check your Firebase configuration and rules.</div>;
    return (
      <>
        <div className="tf-stats-grid tf-stock-stats">
          <StatCard Icon={CheckCircle2} label="In stock" value={products.filter((item) => item.inStock !== false).length} detail="Marked available" />
          <StatCard Icon={XCircle} label="Out of stock" value={outOfStockCount} detail="Not currently available" tone="rose" />
          <StatCard Icon={CircleAlert} label="Low stock" value="Not tracked" detail="No quantity field in product data" tone="amber" />
        </div>
        <div className="tf-panel">
          <div className="tf-panel-heading">
            <div><h2>All inventory</h2><p>{products.length} {products.length === 1 ? "fabric" : "fabrics"} in your collection</p></div>
            <button className="tf-button secondary small" onClick={() => navigateTo("catalog")}>Manage catalog <ArrowUpRight size={15} /></button>
          </div>
          {products.length ? (
            <div className="tf-inventory-list">
              {products.map((product) => (
                <div className="tf-inventory-row" key={product.id}>
                  <FabricImage src={product.image} alt={`${product.name} fabric`} width={56} height={56} />
                  <div className="tf-inventory-name"><strong>{product.name}</strong><span>{product.category || "Uncategorized"} · {product.unit || "Unit not specified"}</span></div>
                  <strong className="tf-inventory-price">{formatPrice(product.price)}</strong>
                  <StatusBadge inStock={product.inStock !== false} />
                  <button className="tf-icon-button" onClick={() => openEditor(product)} aria-label={`Edit ${product.name}`}><Pencil size={15} /></button>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No fabrics in your inventory">Add a fabric to begin tracking availability.</EmptyState>}
        </div>
      </>
    );
  }

  function renderStock() {
    if (productsLoading) return <div className="tf-panel-message">Loading stock levels…</div>;
    if (productsLoadError) return <div className="tf-panel-message error" role="alert">Could not load stock levels. Check your Firebase configuration and rules.</div>;
    const inStockProducts = products.filter((item) => item.inStock !== false);
    const outOfStockProducts = products.filter((item) => item.inStock === false);
    return (
      <>
        <div className="tf-stats-grid tf-stock-stats">
          <StatCard Icon={CheckCircle2} label="In stock" value={inStockProducts.length} detail="Available to customers" />
          <StatCard Icon={XCircle} label="Out of stock" value={outOfStockProducts.length} detail="Currently unavailable" tone="rose" />
          <StatCard Icon={CircleAlert} label="Low stock" value="Not tracked" detail="Quantity data isn't available" tone="amber" />
        </div>
        <div className="tf-stock-explainer"><ShieldCheck size={18} /><p>Availability reflects each fabric's <code>inStock</code> status. Quantity and low-stock tracking aren't part of the current product data.</p></div>
        <div className="tf-stock-sections">
          <section className="tf-panel">
            <div className="tf-panel-heading"><div><h2><span className="tf-stock-dot green" /> In stock</h2><p>{inStockProducts.length} available {inStockProducts.length === 1 ? "fabric" : "fabrics"}</p></div></div>
            {inStockProducts.length ? <div className="tf-stock-grid">{inStockProducts.map(renderFabricCard)}</div> : <EmptyState Icon={CheckCircle2} title="No fabrics marked in stock" />}
          </section>
          <section className="tf-panel">
            <div className="tf-panel-heading"><div><h2><span className="tf-stock-dot red" /> Out of stock</h2><p>{outOfStockProducts.length} unavailable {outOfStockProducts.length === 1 ? "fabric" : "fabrics"}</p></div></div>
            {outOfStockProducts.length ? <div className="tf-stock-grid">{outOfStockProducts.map(renderFabricCard)}</div> : <EmptyState Icon={CheckCircle2} title="Everything is marked available">Fabrics marked out of stock will appear here.</EmptyState>}
          </section>
        </div>
      </>
    );
  }

  function renderCustomers() {
    if (customersLoading) return <div className="tf-panel-message">Loading customers…</div>;
    if (customersLoadError) return <div className="tf-panel-message error" role="alert">Could not load customers. Check your Firebase configuration and rules.</div>;
    return (
      <section className="tf-panel">
        <div className="tf-panel-heading"><div><h2>Customer directory</h2><p>{customers.length} registered {customers.length === 1 ? "customer" : "customers"}</p></div></div>
        {customers.length ? (
          <div className="tf-customer-table-wrap">
            <table className="tf-customer-table">
              <thead><tr><th>Customer</th><th>Email address</th><th>Phone number</th></tr></thead>
              <tbody>{customers.map((customer) => (
                <tr key={customer.id}>
                  <td><span className="tf-avatar">{(customer.name || customer.email || "C").slice(0, 1).toUpperCase()}</span><strong>{customer.name || "Unnamed customer"}</strong></td>
                  <td>{customer.email || "—"}</td>
                  <td>{customer.phone || "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState Icon={UsersRound} title="No registered customers yet">Customer profiles will appear here when people create an account.</EmptyState>}
      </section>
    );
  }

  function renderSales() {
    return (
      <section className="tf-sales-empty">
        <span className="tf-sales-illustration"><ShoppingCart size={32} /></span>
        <span className="tf-eyebrow"><span /> SALES ANALYTICS</span>
        <h2>Sales insights are on their way</h2>
        <p>There isn't an orders or sales collection connected to this store yet. Once order tracking is available, this page can show real revenue, sales trends, date filters and recent activity.</p>
        <div className="tf-sales-points">
          <span><CheckCircle2 size={16} /> Revenue overview</span>
          <span><CheckCircle2 size={16} /> Sales trends</span>
          <span><CheckCircle2 size={16} /> Order activity</span>
        </div>
        <button className="tf-button secondary" onClick={() => navigateTo("inventory")}>View your inventory <ArrowUpRight size={15} /></button>
      </section>
    );
  }

  function renderReports() {
    return (
      <>
        <section className="tf-report-heading">
          <div><h2>Inventory summary</h2><p>Based on the live product catalog in Firestore.</p></div>
          <button className="tf-button secondary" onClick={exportInventory} disabled={productsLoading || productsLoadError || !products.length}>
            <ArrowDownToLine size={16} /> Export inventory CSV
          </button>
        </section>
        <div className="tf-stats-grid">
          <StatCard Icon={Boxes} label="Total fabrics" value={productsLoading ? "—" : products.length} detail="Products in catalog" />
          <StatCard Icon={CheckCircle2} label="Available" value={productsLoading ? "—" : products.filter((item) => item.inStock !== false).length} detail="Marked in stock" />
          <StatCard Icon={XCircle} label="Unavailable" value={productsLoading ? "—" : outOfStockCount} detail="Marked out of stock" tone="rose" />
          <StatCard Icon={CircleAlert} label="Quantity value" value="Not tracked" detail="Unit prices aren't stock totals" tone="amber" />
        </div>
        <div className="tf-report-grid">
          <section className="tf-panel"><div className="tf-panel-heading"><div><h2>Products by category</h2><p>Catalog distribution</p></div></div><CategoryChart categories={categoryCounts} /></section>
          <section className="tf-panel"><div className="tf-panel-heading"><div><h2>Stock availability</h2><p>Current availability flags</p></div></div>
            {!products.length ? <EmptyState Icon={BarChart3} title="No availability data yet">Add fabrics to see their stock status.</EmptyState> : (
              <div className="tf-availability-report">
                <div><span className="tf-stock-dot green" /><span>In stock</span><strong>{products.length ? Math.round((products.length - outOfStockCount) / products.length * 100) : 0}%</strong></div>
                <div className="tf-availability-bar"><span style={{ width: `${products.length ? (products.length - outOfStockCount) / products.length * 100 : 0}%` }} /></div>
                <div><span className="tf-stock-dot red" /><span>Out of stock</span><strong>{outOfStockCount} {outOfStockCount === 1 ? "fabric" : "fabrics"}</strong></div>
                <div className="tf-availability-bar red"><span style={{ width: `${products.length ? outOfStockCount / products.length * 100 : 0}%` }} /></div>
              </div>
            )}
          </section>
        </div>
        <p className="tf-report-note"><CircleAlert size={16} /> Sales and revenue reports aren't available because the current app has no connected orders or sales records.</p>
      </>
    );
  }

  function renderSettings() {
    return (
      <section className="tf-settings-grid">
        <article className="tf-panel tf-setting-card">
          <span className="tf-setting-icon"><Store size={19} /></span>
          <h2>Store connection</h2>
          <p>Product catalog and customer records are read from your existing Firebase project.</p>
          <div className={`tf-connection-status ${isFirebaseConfigured ? "connected" : "disconnected"}`}><span />{isFirebaseConfigured ? "Firebase configured" : "Firebase not configured"}</div>
        </article>
        <article className="tf-panel tf-setting-card">
          <span className="tf-setting-icon"><Boxes size={19} /></span>
          <h2>Inventory fields</h2>
          <p>Fabrics currently use price, unit, image and a boolean availability status.</p>
          <div className="tf-setting-detail"><span>Quantity tracking</span><strong>Not configured</strong></div>
          <div className="tf-setting-detail"><span>Low-stock alerts</span><strong>Not available</strong></div>
        </article>
        <article className="tf-panel tf-setting-card">
          <span className="tf-setting-icon"><ShoppingCart size={19} /></span>
          <h2>Sales tracking</h2>
          <p>No orders or sales collection was found in the current project.</p>
          <button className="tf-text-link" onClick={() => navigateTo("sales")}>View sales analytics <ArrowUpRight size={15} /></button>
        </article>
        <article className="tf-panel tf-setting-card">
          <span className="tf-setting-icon"><ShieldCheck size={19} /></span>
          <h2>Administrator</h2>
          <p>{displayName}</p>
          <span className="tf-setting-email">{user?.email || "Signed in as administrator"}</span>
        </article>
      </section>
    );
  }

  const [title, description] = pageDetails[tab] || pageDetails.overview;

  return (
    <>
      <NoIndexMeta />
      <div className="tf-admin">
        <header className="tf-topbar">
          <div className="tf-topbar-brand">
            <button className="tf-mobile-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open dashboard navigation"><Menu size={21} /></button>
            <Link to="/shop" className="tf-brand" aria-label="Tehilla Fabrics storefront">
              <span className="tf-brand-mark">T</span><span>Tehilla<span className="tf-brand-light"> Fabrics</span></span>
            </Link>
            <span className="tf-brand-divider" />
            <span className="tf-dashboard-label">Admin</span>
          </div>
          <nav className="tf-topnav" aria-label="Dashboard shortcuts">
            {[["overview", "Overview"], ["activity", "Activity"], ["stock", "Stock levels"]].map(([id, label]) => (
              <button className={tab === id ? "active" : ""} key={id} onClick={() => navigateTo(id)}>{label}</button>
            ))}
          </nav>
          <div className="tf-topbar-actions">
            <label className="tf-global-search">
              <Search size={16} />
              <span className="sr-only">Search fabrics</span>
              <input value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value) setTab("catalog"); }} onFocus={() => { if (query) setTab("catalog"); }} placeholder="Search fabrics…" />
            </label>
            <div className="tf-popover-wrap">
              <button className={`tf-icon-button tf-notification-button ${notificationsOpen ? "selected" : ""}`} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen}>
                <Bell size={18} />{outOfStockCount > 0 && <span className="tf-notification-dot" />}
              </button>
              {notificationsOpen && <div className="tf-popover tf-notification-popover"><strong>Inventory notifications</strong><p>{outOfStockCount ? `${outOfStockCount} ${outOfStockCount === 1 ? "fabric is" : "fabrics are"} currently marked out of stock.` : "No fabrics are currently marked out of stock."}</p><button className="tf-text-link" onClick={() => navigateTo("stock")}>Review stock levels <ArrowUpRight size={14} /></button></div>}
            </div>
            <button className="tf-icon-button tf-cart-button" onClick={() => setIsCartOpen(true)} aria-label={`Open cart, ${itemCount} items`}><ShoppingBag size={18} />{itemCount > 0 && <span className="tf-cart-count">{itemCount}</span>}</button>
            <button className="tf-button primary tf-top-add" onClick={() => openEditor()}><Plus size={16} /> <span>Add new fabric</span></button>
            <div className="tf-popover-wrap tf-profile-wrap">
              <button className="tf-profile-button" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }} aria-expanded={profileOpen}>
                <span className="tf-avatar admin-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                <span className="tf-profile-name">{displayName.split(" ")[0].split("@")[0]}<small>Administrator</small></span><ChevronDown size={15} />
              </button>
              {profileOpen && <div className="tf-popover tf-profile-popover"><div className="tf-profile-popover-user"><strong>{displayName}</strong><span>{user?.email}</span></div><Link to="/shop" onClick={() => setProfileOpen(false)}><Store size={15} /> Visit storefront</Link><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>

        <div className="tf-app-layout">
          {mobileNavOpen && <button className="tf-mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close dashboard navigation" />}
          <aside className={`tf-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
            <div className="tf-sidebar-mobile-head"><span>Menu</span><button className="tf-icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
            <p className="tf-sidebar-label">WORKSPACE</p>
            <nav className="tf-side-nav" aria-label="Admin dashboard sections">
              {navItems.map(({ id, label, Icon }) => (
                <button key={id} className={tab === id ? "active" : ""} onClick={() => navigateTo(id)}>
                  <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === "stock" && outOfStockCount > 0 && <span className="tf-nav-count">{outOfStockCount}</span>}
                </button>
              ))}
            </nav>
            <div className="tf-sidebar-bottom">
              <div className="tf-sidebar-help">              <span className="tf-sidebar-help-icon"><Activity size={17} /></span><strong>Made for your store</strong><p>A simpler way to manage every fabric in your collection.</p></div>
              <Link to="/shop" className="tf-store-link"><Store size={16} /> View storefront <ArrowUpRight size={14} /></Link>
            </div>
          </aside>

          <main className="tf-main">
            {notice && <p className={`tf-toast ${notice.type}${noticeClosing ? " is-closing" : ""}`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></p>}
            <div className="tf-page-header">
              <div className="tf-breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
              {tab === "overview" ? null : <div className="tf-page-title-row"><div><h1>{title}</h1><p>{description}</p></div>{tab === "catalog" && <button className="tf-button primary" onClick={() => openEditor()}><Plus size={16} /> Add new fabric</button>}</div>}
            </div>

            {tab === "overview" && renderOverview()}
            {tab === "activity" && (
              <section className="tf-panel tf-full-activity">
                <div className="tf-panel-heading"><div><h2>Catalog activity</h2><p>Based on product creation and update timestamps stored in Firestore.</p></div><Clock3 size={18} /></div>
                {productsLoading ? <div className="tf-panel-message">Loading activity…</div> : recentActivity.length ? (
                  <div className="tf-activity-list">
                    {recentActivity.map(({ product, date, isUpdate }) => <div className="tf-activity-item" key={product.id}><span className="tf-activity-icon">{isUpdate ? <Pencil size={15} /> : <Plus size={15} />}</span><div><strong>{product.name}</strong><p>{isUpdate ? "Fabric details updated" : "Fabric added to catalog"}{product.category ? ` · ${product.category}` : ""}</p></div><time dateTime={date.toISOString()}>{formatActivityDate(date.toISOString())}</time></div>)}
                  </div>
                ) : <EmptyState Icon={Activity} title="No dated activity available">Activity is based on product timestamps. New fabrics and edits will appear here.</EmptyState>}
              </section>
            )}
            {tab === "inventory" && renderInventory()}
            {tab === "catalog" && (
              <section className="tf-catalog-section">
                <div className="tf-catalog-toolbar">
                  <div className="tf-filter-group"><SlidersHorizontal size={16} /><span>Filter:</span>
                    <label className="tf-select-wrap"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
                    <label className="tf-select-wrap"><span className="sr-only">Filter by availability</span><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="all">All availability</option><option value="in">In stock</option><option value="out">Out of stock</option></select><ChevronDown size={14} /></label>
                  </div>
                  <div className="tf-view-controls" aria-label="Catalog layout">
                    <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}><Grid2X2 size={17} /></button>
                    <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}><List size={18} /></button>
                  </div>
                </div>
                {!productsLoading && !productsLoadError && products.length > 0 && <div className="tf-catalog-count">Showing <strong>{visibleProducts.length}</strong> of {products.length} fabrics</div>}
                {renderCatalog()}
              </section>
            )}
            {tab === "stock" && renderStock()}
            {tab === "customers" && renderCustomers()}
            {tab === "sales" && renderSales()}
            {tab === "reports" && (productsLoading ? <div className="tf-panel-message">Loading reports…</div> : productsLoadError ? <div className="tf-panel-message error" role="alert">Could not load report data.</div> : renderReports())}
            {tab === "settings" && renderSettings()}
            <footer className="tf-footer"><span>Tehilla Fabrics · Inventory management</span><span>Connected to your live catalog</span></footer>
          </main>
        </div>
      </div>
      {editing !== null && (
        <div className={`modal-backdrop tf-modal-backdrop${isEditorClosing ? " is-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && closeEditor()}>
          <section className={`fabric-modal tf-glass-modal${isEditorClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="fabric-modal-title">
            <div className="modal-heading"><h2 id="fabric-modal-title">{editing?.id ? "Edit fabric" : "Add new fabric"}</h2><button className="icon-button" onClick={closeEditor} aria-label="Close form"><X /></button></div>
            <form className="fabric-form" onSubmit={saveFabric}>
              <label>Fabric name<input name="name" value={form.name} onChange={updateForm} required /></label>
              <label>Category<input name="category" value={form.category} onChange={updateForm} required /></label>
              <label>Price in ₦<input name="price" type="number" min="0" step="1" value={form.price} onChange={updateForm} required /></label>
              <label>Unit<input name="unit" value={form.unit} onChange={updateForm} placeholder="per 6 yards" required /></label>
              <label>Tag <span className="optional-label">(optional)</span><input name="tag" value={form.tag} onChange={updateForm} /></label>
              <label className="upload-label">Photo <span className="optional-label">(JPG, PNG or WebP; max 2 MB)</span>
                <span className="upload-control"><Plus size={18} /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></span>
              </label>
              {preview && <FabricImage className="image-preview" src={preview} alt="Selected fabric preview" width={640} height={480} />}
              <label className="checkbox-label"><input name="inStock" type="checkbox" checked={Boolean(form.inStock)} onChange={(event) => setForm((current) => ({ ...current, inStock: event.target.checked }))} /> In stock</label>
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={closeEditor}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save fabric"}</button></div>
            </form>
          </section>
        </div>
      )}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} glass />
    </>
  );
}
