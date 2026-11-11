import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { ImagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFirebaseFirestore, getFirebaseStorage, isFirebaseConfigured } from "../firebase.js";
import { sampleProducts } from "../data/sampleProducts.js";
import formatPrice from "../utils/formatPrice.js";
import Header from "../components/Header.jsx";
import CartDrawer from "../components/CartDrawer.jsx";
import FabricImage from "../components/FabricImage.jsx";
import NoIndexMeta from "../components/NoIndexMeta.jsx";

const emptyFabric = { name: "", category: "", price: "", unit: "", tag: "", image: "", inStock: true };

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsLoadError, setProductsLoadError] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [tab, setTab] = useState("fabrics");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
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
    getFirebaseFirestore()
      .then((database) => {
        if (cancelled || !database) return;
        unsubscribe = onSnapshot(
          collection(database, "users"),
          (snapshot) => setCustomers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
          (error) => {
            console.error("Could not load customer records.", error);
            setNotice({ type: "error", text: "Could not load customers. Check your Firebase rules." });
          },
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load customer records.", error);
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

  const categories = useMemo(() => ["All", ...new Set(products.map((item) => item.category).filter(Boolean))], [products]);
  const visibleProducts = useMemo(() => products.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const term = query.trim().toLowerCase();
    return matchesCategory && (!term || item.name?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term));
  }), [products, category, query]);

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

  return (
    <>
    <NoIndexMeta />
    <Header onCartOpen={() => setIsCartOpen(true)} />
    <main className="admin-page">
      <div className="admin-heading">
        <div><span className="eyebrow"><span className="eyebrow-line" /> Store management</span><h1>Admin dashboard</h1></div>
        <button className="button button-primary" onClick={() => openEditor()}><Plus size={17} /> Add new fabric</button>
      </div>
      {notice && <p className={`admin-toast ${notice.type}${noticeClosing ? " is-closing" : ""}`} role="status">{notice.text}</p>}
      <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
        <button role="tab" aria-selected={tab === "fabrics"} className={tab === "fabrics" ? "active" : ""} onClick={() => setTab("fabrics")}>Fabrics ({products.length})</button>
        <button role="tab" aria-selected={tab === "customers"} className={tab === "customers" ? "active" : ""} onClick={() => setTab("customers")}>Customers</button>
      </div>
      {tab === "fabrics" ? (
        <>
          <div className="admin-toolbar">
            <label className="search-field"><Search size={17} /><span className="sr-only">Search fabrics</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fabrics…" /></label>
            <label className="admin-category">Category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
          </div>
          {productsLoading ? (
            <div className="admin-empty">Loading fabrics…</div>
          ) : productsLoadError ? (
            <p className="admin-empty" role="alert">Could not load fabrics. Check your Firebase configuration and rules.</p>
          ) : !products.length ? (
            <div className="admin-import-banner">
              <div><h2>No fabrics yet. Import samples</h2><p>Sample prices are placeholders; update prices and photos in Admin after importing.</p></div>
              <button className="button button-secondary" onClick={importSamples} disabled={busy || !isFirebaseConfigured}>
                {busy ? "Importing…" : "Import sample products"}
              </button>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Photo</th><th>Name</th><th>Category</th><th>Price (₦)</th><th>Unit</th><th>In stock</th><th>Actions</th></tr></thead>
                <tbody>{visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td data-label="Photo"><FabricImage className="admin-product-image" src={product.image} alt={`${product.name} fabric`} width={56} height={56} /></td>
                    <td data-label="Name">{product.name}</td>
                    <td data-label="Category">{product.category}</td>
                    <td data-label="Price (₦)" className="quick-price">
                      {quickPrice === product.id ? (
                        <input aria-label={`New price for ${product.name}`} type="number" min="0" step="1" defaultValue={product.price} autoFocus onKeyDown={(event) => {
                          if (event.key === "Enter") { event.preventDefault(); savePrice(product, event.currentTarget.value); }
                          if (event.key === "Escape") setQuickPrice(null);
                        }} onBlur={() => setQuickPrice(null)} />
                      ) : <button className="price-edit" onClick={() => setQuickPrice(product.id)} aria-label={`Edit price for ${product.name}`}>{formatPrice(product.price)} <span aria-hidden="true">✎</span></button>}
                    </td>
                    <td data-label="Unit">{product.unit}</td>
                    <td data-label="In stock"><button className={`stock-toggle ${product.inStock === false ? "off" : ""}`} onClick={() => toggleStock(product)} aria-pressed={product.inStock !== false}>{product.inStock === false ? "Out of stock" : "In stock"}</button></td>
                    <td data-label="Actions" className="admin-actions"><button onClick={() => openEditor(product)}>Edit</button><button className="delete-action" onClick={() => removeFabric(product)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /> Delete</button></td>
                  </tr>
                ))}</tbody>
              </table>
              {!visibleProducts.length && <p className="admin-empty">No fabrics match your search.</p>}
            </div>
          )}
        </>
      ) : (
        <div className="customers-table-wrap">
          <table className="admin-table customers-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
            <tbody>{customers.map((customer) => <tr key={customer.id}><td data-label="Name">{customer.name || "—"}</td><td data-label="Email">{customer.email || "—"}</td><td data-label="Phone">{customer.phone || "—"}</td></tr>)}</tbody>
          </table>
          {!customers.length && <p className="admin-empty">No registered users found.</p>}
        </div>
      )}
      {editing !== null && (
        <div className={`modal-backdrop${isEditorClosing ? " is-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && closeEditor()}>
          <section className={`fabric-modal${isEditorClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="fabric-modal-title">
            <div className="modal-heading"><h2 id="fabric-modal-title">{editing?.id ? "Edit fabric" : "Add new fabric"}</h2><button className="icon-button" onClick={closeEditor} aria-label="Close form"><X /></button></div>
            <form className="fabric-form" onSubmit={saveFabric}>
              <label>Fabric name<input name="name" value={form.name} onChange={updateForm} required /></label>
              <label>Category<input name="category" value={form.category} onChange={updateForm} required /></label>
              <label>Price in ₦<input name="price" type="number" min="0" step="1" value={form.price} onChange={updateForm} required /></label>
              <label>Unit<input name="unit" value={form.unit} onChange={updateForm} placeholder="per 6 yards" required /></label>
              <label>Tag <span className="optional-label">(optional)</span><input name="tag" value={form.tag} onChange={updateForm} /></label>
              <label className="upload-label">Photo <span className="optional-label">(JPG, PNG or WebP; max 2 MB)</span>
                <span className="upload-control"><ImagePlus size={18} /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} /></span>
              </label>
              {preview && <FabricImage className="image-preview" src={preview} alt="Selected fabric preview" width={640} height={480} />}
              <label className="checkbox-label"><input name="inStock" type="checkbox" checked={Boolean(form.inStock)} onChange={(event) => setForm((current) => ({ ...current, inStock: event.target.checked }))} /> In stock</label>
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={closeEditor}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save fabric"}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
    <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
