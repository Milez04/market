"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { ChevronDown, ChevronUp, Download, Eye, Grid3X3, ImageIcon, LogOut, Package, Plus, Search, Shield, Sparkles, Trash2, UploadCloud, Users } from "lucide-react";
import { toast } from "sonner";
import { AppLogo } from "@/components/ui/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clearAdminSession,
  getStoredAdmin,
  getStoredAdminToken,
  phpAdminRequest,
  PHP_API_URL,
  storeAdminSession,
  type PhpAdmin,
  type PhpBrilog,
  type PhpCatalog,
  type PhpCatalogProduct,
  type PhpProduct,
} from "@/lib/php-api";

const CARD_W = 1048;
const CARD_H = 590;

type AdminProject = {
  id: number;
  title: string;
  preview?: string;
  design_json?: string;
  updated_at?: string;
  created_at?: string;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  project_count: number;
};

type EditableProduct = PhpProduct & {
  active: number | boolean;
};

type EditableBrilog = PhpBrilog & {
  active: number | boolean;
};

type EditableCatalogProduct = PhpCatalogProduct & {
  active?: number | boolean;
};

type EditableCatalog = PhpCatalog & {
  active: number | boolean;
  products?: EditableCatalogProduct[];
};

export function AdminShell() {
  const [admin, setAdmin] = useState<PhpAdmin | null>(null);
  const [email, setEmail] = useState("admin@cardforge.local");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [brilogs, setBrilogs] = useState<EditableBrilog[]>([]);
  const [catalogs, setCatalogs] = useState<EditableCatalog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<AdminProject[]>([]);
  const [activeSection, setActiveSection] = useState<"products" | "brilogs" | "catalogs" | "users">("products");
  const [userSearch, setUserSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(false);
  const productSaveTimersRef = useRef<Record<number, number>>({});
  const brilogSaveTimersRef = useRef<Record<number, number>>({});
  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return true;
    return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });
  const selectedCatalog = selectedCatalogId === "all" ? null : catalogs.find((catalog) => catalog.id === selectedCatalogId) ?? null;
  const filteredCatalogs = selectedCatalog ? [selectedCatalog] : [];
  const sidebarCatalogs = catalogs.filter((catalog) => {
    const query = catalogSearch.trim().toLowerCase();
    if (!query) return true;
    return catalog.title.toLowerCase().includes(query) || catalog.slug.toLowerCase().includes(query);
  });

  useEffect(() => {
    const timers = productSaveTimersRef.current;
    const brilogTimers = brilogSaveTimersRef.current;
    const storedAdmin = getStoredAdmin();
    if (storedAdmin) {
      setAdmin(storedAdmin);
      void loadAdminData();
    }
    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
      Object.values(brilogTimers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  async function loadAdminData() {
    try {
      const [productData, brilogData, catalogData, userData] = await Promise.all([
        phpAdminRequest<{ products: EditableProduct[] }>("/admin/products.php"),
        phpAdminRequest<{ brilogs: EditableBrilog[] }>("/admin/brilogs.php"),
        phpAdminRequest<{ catalogs: EditableCatalog[] }>("/admin/catalogs.php"),
        phpAdminRequest<{ users: AdminUser[] }>("/admin/users.php"),
      ]);
      setProducts(productData.products);
      setBrilogs(brilogData.brilogs);
      setCatalogs(catalogData.catalogs);
      setUsers(userData.users);
    } catch (error) {
      clearAdminSession();
      setAdmin(null);
      toast.error(error instanceof Error ? error.message : "Admin session expired");
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${PHP_API_URL}/admin/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Admin login failed");
      storeAdminSession(data.admin, data.token);
      setAdmin(data.admin);
      toast.success("Admin login successful");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAdminSession();
    setAdmin(null);
    setSelectedUser(null);
    setSelectedProjects([]);
  }

  function updateProduct(id: number, patch: Partial<EditableProduct>) {
    let nextProduct: EditableProduct | null = null;
    setProducts((current) => current.map((product) => {
      if (product.id !== id) return product;
      nextProduct = { ...product, ...patch };
      return nextProduct;
    }));
    if (nextProduct) scheduleProductSave(nextProduct);
  }

  function updateBrilog(id: number, patch: Partial<EditableBrilog>) {
    let nextBrilog: EditableBrilog | null = null;
    setBrilogs((current) => current.map((brilog) => {
      if (brilog.id !== id) return brilog;
      nextBrilog = { ...brilog, ...patch };
      return nextBrilog;
    }));
    if (nextBrilog) scheduleBrilogSave(nextBrilog);
  }

  function scheduleProductSave(product: EditableProduct) {
    if (product.id <= 0) return;
    if (productSaveTimersRef.current[product.id]) window.clearTimeout(productSaveTimersRef.current[product.id]);
    productSaveTimersRef.current[product.id] = window.setTimeout(() => {
      void saveProduct(product, { silent: true });
    }, 900);
  }

  function scheduleBrilogSave(brilog: EditableBrilog) {
    if (brilog.id <= 0) return;
    if (brilogSaveTimersRef.current[brilog.id]) window.clearTimeout(brilogSaveTimersRef.current[brilog.id]);
    brilogSaveTimersRef.current[brilog.id] = window.setTimeout(() => {
      void saveBrilog(brilog, { silent: true });
    }, 900);
  }

  async function addProduct() {
    try {
      await phpAdminRequest("/admin/products.php", {
        method: "POST",
        body: JSON.stringify({
          title: "New card product",
          description: "Describe this printed card product.",
          price: 5000,
          image_url: "",
          front_image_url: "",
          back_image_url: "",
          active: true,
        }),
      });
      setActiveSection("products");
      toast.success("Product added");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product could not be added");
    }
  }

  async function addBrilog() {
    try {
      await phpAdminRequest("/admin/brilogs.php", {
        method: "POST",
        body: JSON.stringify({
          title: "New 3D brilog",
          description: "Describe this 3D brilog product.",
          price: 15000,
          active: true,
        }),
      });
      setActiveSection("brilogs");
      toast.success("Brilog added");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Brilog could not be added");
    }
  }

  async function addCatalog() {
    try {
      const data = await phpAdminRequest<{ catalog: { id: number } }>("/admin/catalogs.php", {
        method: "POST",
        body: JSON.stringify({
          title: "New product catalog",
          slug: `catalog-${Date.now()}`,
          description: "Describe this product type.",
          active: true,
        }),
      });
      setActiveSection("catalogs");
      setSelectedCatalogId(data.catalog.id);
      toast.success("Catalog added");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog could not be added");
    }
  }

  async function addCatalogProduct(catalog: EditableCatalog) {
    try {
      await phpAdminRequest("/admin/catalogs.php", {
        method: "POST",
        body: JSON.stringify({
          action: "product",
          catalog_id: catalog.id,
          title: "New product",
          description: "Describe this catalog product.",
          price: 5000,
          active: true,
        }),
      });
      toast.success("Catalog product added");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product could not be added");
    }
  }

  async function saveProduct(product: EditableProduct, options: { silent?: boolean } = {}) {
    try {
      await phpAdminRequest("/admin/products.php", {
        method: "POST",
        body: JSON.stringify({
          id: product.id > 0 ? product.id : undefined,
          title: product.title,
          description: product.description,
          price: Number(product.price),
          image_url: product.front_image_url || product.image_url || "",
          front_image_url: product.front_image_url || product.image_url || "",
          back_image_url: product.back_image_url ?? "",
          active: Boolean(product.active),
        }),
      });
      if (!options.silent) toast.success("Product saved");
      if (!options.silent) await loadAdminData();
    } catch (error) {
      if (!options.silent) toast.error(error instanceof Error ? error.message : "Product could not be saved");
    }
  }

  async function saveBrilog(brilog: EditableBrilog, options: { silent?: boolean } = {}) {
    try {
      await phpAdminRequest("/admin/brilogs.php", {
        method: "POST",
        body: JSON.stringify({
          id: brilog.id > 0 ? brilog.id : undefined,
          title: brilog.title,
          description: brilog.description,
          price: Number(brilog.price),
          active: Boolean(brilog.active),
        }),
      });
      if (!options.silent) toast.success("Brilog saved");
      if (!options.silent) await loadAdminData();
    } catch (error) {
      if (!options.silent) toast.error(error instanceof Error ? error.message : "Brilog could not be saved");
    }
  }

  async function saveCatalog(catalog: EditableCatalog) {
    try {
      await phpAdminRequest("/admin/catalogs.php", {
        method: "POST",
        body: JSON.stringify({
          id: catalog.id,
          title: catalog.title,
          slug: catalog.slug,
          description: catalog.description,
          active: Boolean(catalog.active),
        }),
      });
      toast.success("Catalog saved");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog could not be saved");
    }
  }

  async function saveCatalogProduct(product: EditableCatalogProduct) {
    try {
      await phpAdminRequest("/admin/catalogs.php", {
        method: "POST",
        body: JSON.stringify({
          action: "product",
          id: product.id,
          catalog_id: product.catalog_id,
          title: product.title,
          description: product.description,
          price: Number(product.price),
          active: Boolean(product.active),
        }),
      });
      toast.success("Catalog product saved");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product could not be saved");
    }
  }

  async function deleteProduct(product: EditableProduct) {
    if (!window.confirm(`Delete "${product.title}"?`)) return;
    try {
      await phpAdminRequest("/admin/products.php", {
        method: "DELETE",
        body: JSON.stringify({ id: product.id }),
      });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success("Product deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product could not be deleted");
    }
  }

  async function deleteBrilog(brilog: EditableBrilog) {
    if (!window.confirm(`Delete "${brilog.title}"?`)) return;
    try {
      await phpAdminRequest("/admin/brilogs.php", {
        method: "DELETE",
        body: JSON.stringify({ id: brilog.id }),
      });
      setBrilogs((current) => current.filter((item) => item.id !== brilog.id));
      toast.success("Brilog deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Brilog could not be deleted");
    }
  }

  async function deleteCatalog(catalog: EditableCatalog) {
    if (!window.confirm(`Delete catalog "${catalog.title}"?`)) return;
    try {
      await phpAdminRequest("/admin/catalogs.php", {
        method: "DELETE",
        body: JSON.stringify({ id: catalog.id }),
      });
      setCatalogs((current) => current.filter((item) => item.id !== catalog.id));
      toast.success("Catalog deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog could not be deleted");
    }
  }

  async function deleteCatalogProduct(product: EditableCatalogProduct) {
    if (!window.confirm(`Delete "${product.title}"?`)) return;
    try {
      await phpAdminRequest("/admin/catalogs.php", {
        method: "DELETE",
        body: JSON.stringify({ action: "product", id: product.id }),
      });
      await loadAdminData();
      toast.success("Product deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product could not be deleted");
    }
  }

  async function uploadProductImage(product: EditableProduct, side: "front" | "back", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("product_id", String(product.id));
    formData.append("side", side);
    formData.append("image", file);
    try {
      const response = await fetch(`${PHP_API_URL}/admin/product-image.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getStoredAdminToken()}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Image upload failed");
      setProducts((current) => current.map((item) => (
        item.id === product.id
          ? {
              ...item,
              image_url: side === "front" ? data.image_url : item.image_url,
              front_image_url: side === "front" ? data.image_url : item.front_image_url,
              back_image_url: side === "back" ? data.image_url : item.back_image_url,
            }
          : item
      )));
      toast.success("Product image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  }

  async function uploadBrilogImage(brilog: EditableBrilog, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if ((brilog.images?.length ?? 0) >= 10) {
      toast.error("Maximum 10 photos are allowed");
      return;
    }
    const formData = new FormData();
    formData.append("brilog_id", String(brilog.id));
    formData.append("image", file);
    try {
      const response = await fetch(`${PHP_API_URL}/admin/brilog-image.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getStoredAdminToken()}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Image upload failed");
      setBrilogs((current) => current.map((item) => (
        item.id === brilog.id
          ? {
              ...item,
              image_url: item.image_url || data.image.image_url,
              images: [...(item.images ?? []), data.image],
            }
          : item
      )));
      toast.success("Brilog photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  }

  async function deleteBrilogImage(brilog: EditableBrilog, imageId: number) {
    try {
      await phpAdminRequest("/admin/brilog-image.php", {
        method: "DELETE",
        body: JSON.stringify({ id: imageId }),
      });
      setBrilogs((current) => current.map((item) => {
        if (item.id !== brilog.id) return item;
        const nextImages = (item.images ?? []).filter((image) => image.id !== imageId);
        return { ...item, images: nextImages, image_url: nextImages[0]?.image_url ?? "" };
      }));
      toast.success("Brilog photo deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo could not be deleted");
    }
  }

  function updateCatalog(id: number, patch: Partial<EditableCatalog>) {
    setCatalogs((current) => current.map((catalog) => catalog.id === id ? { ...catalog, ...patch } : catalog));
  }

  function updateCatalogProduct(catalogId: number, productId: number, patch: Partial<EditableCatalogProduct>) {
    setCatalogs((current) => current.map((catalog) => {
      if (catalog.id !== catalogId) return catalog;
      return {
        ...catalog,
        products: (catalog.products ?? []).map((product) => product.id === productId ? { ...product, ...patch } : product),
      };
    }));
  }

  async function uploadCatalogImage(product: EditableCatalogProduct, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if ((product.images?.length ?? 0) >= 10) {
      toast.error("Maximum 10 photos are allowed");
      return;
    }
    const formData = new FormData();
    formData.append("product_id", String(product.id));
    formData.append("image", file);
    try {
      const response = await fetch(`${PHP_API_URL}/admin/catalog-image.php`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getStoredAdminToken()}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Image upload failed");
      await loadAdminData();
      toast.success("Catalog photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  }

  async function deleteCatalogImage(imageId: number) {
    try {
      await phpAdminRequest("/admin/catalog-image.php", {
        method: "DELETE",
        body: JSON.stringify({ id: imageId }),
      });
      await loadAdminData();
      toast.success("Catalog photo deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo could not be deleted");
    }
  }

  async function moveCatalog(catalogId: number, direction: -1 | 1) {
    const currentIndex = catalogs.findIndex((catalog) => catalog.id === catalogId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= catalogs.length) return;
    const nextCatalogs = [...catalogs];
    [nextCatalogs[currentIndex], nextCatalogs[nextIndex]] = [nextCatalogs[nextIndex], nextCatalogs[currentIndex]];
    setCatalogs(nextCatalogs);
    try {
      await phpAdminRequest("/admin/catalogs.php", {
        method: "POST",
        body: JSON.stringify({ action: "reorder", ids: nextCatalogs.map((catalog) => catalog.id) }),
      });
      toast.success("Catalog order updated");
      await loadAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog order could not be saved");
      await loadAdminData();
    }
  }

  async function openUser(user: AdminUser) {
    setSelectedUser(user);
    try {
      const data = await phpAdminRequest<{ user: AdminUser; projects: AdminProject[] }>(`/admin/user-projects.php?user_id=${user.id}`);
      setSelectedUser(data.user);
      setSelectedProjects(data.projects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Projects could not be loaded");
    }
  }

  async function downloadProject(project: AdminProject) {
    if (!project.design_json && !project.preview) {
      toast.error("This card has no saved design yet");
      return;
    }

    let dataUrl = project.preview ?? "";
    if (project.design_json) {
      const canvasElement = document.createElement("canvas");
      const canvas = new FabricCanvas(canvasElement, {
        width: CARD_W,
        height: CARD_H,
        backgroundColor: "transparent",
        enableRetinaScaling: false,
        preserveObjectStacking: true,
      });

      try {
        const parsed = JSON.parse(project.design_json) as { sides?: { front?: string } };
        await canvas.loadFromJSON(parsed.sides?.front ?? project.design_json);
        canvas.renderAll();
        dataUrl = canvas.toDataURL({
          format: "png",
          multiplier: 4,
          enableRetinaScaling: false,
        });
      } catch {
        if (!dataUrl) {
          toast.error("High quality render failed");
          canvas.dispose();
          return;
        }
      } finally {
        canvas.dispose();
      }
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `cardforge-${project.id}-print.png`;
    link.click();
  }

  if (!admin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef0f4] px-4 text-slate-950">
        <form className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-300" onSubmit={login}>
          <div className="mb-7 flex items-center justify-between">
            <AppLogo />
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Shield className="h-5 w-5" />
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin login</h1>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="username"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </label>
            <Button variant="accent" className="h-12 rounded-xl" disabled={loading}>
              {loading ? "Opening..." : "Login"}
            </Button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef0f4] text-slate-950 lg:grid lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-slate-200 bg-white/90 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-5">
          <AppLogo />
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Admin panel</p>
            <p className="mt-2 truncate text-sm font-semibold">{admin.email}</p>
          </div>

          <nav className="grid gap-2">
            <button
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                activeSection === "products" ? "bg-slate-950 text-white" : "hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("products")}
            >
              <Package className="h-4 w-4" /> Products
            </button>
            <button
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                activeSection === "brilogs" ? "bg-slate-950 text-white" : "hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("brilogs")}
            >
              <Sparkles className="h-4 w-4" /> 3D Brilogs
            </button>
            <button
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                activeSection === "users" ? "bg-slate-950 text-white" : "hover:bg-slate-100"
              }`}
              onClick={() => setActiveSection("users")}
            >
              <Users className="h-4 w-4" /> Users
            </button>
          </nav>

          <div className="grid min-h-0 gap-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogs</p>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600"
                onClick={() => void addCatalog()}
                aria-label="Add catalog"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-teal-400 focus:bg-white"
                placeholder="Search catalog"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
              />
            </label>
            <div className="grid max-h-72 gap-1 overflow-auto pr-1 lg:max-h-none">
              {sidebarCatalogs.map((catalog) => (
                <button
                  key={catalog.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeSection === "catalogs" && selectedCatalogId === catalog.id
                      ? "bg-slate-950 text-white"
                      : "hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    setActiveSection("catalogs");
                    setSelectedCatalogId(catalog.id);
                  }}
                >
                  <Grid3X3 className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{catalog.title}</span>
                </button>
              ))}
              {sidebarCatalogs.length === 0 && <p className="rounded-xl border border-dashed p-3 text-xs text-slate-500">No catalogs found.</p>}
            </div>
          </div>

          <Button variant="secondary" onClick={logout} className="mt-auto justify-center">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#eef0f4]/85 px-5 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">CardForge admin</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {activeSection === "products" && "Products"}
                {activeSection === "brilogs" && "3D Brilogs"}
                {activeSection === "catalogs" && (catalogs.find((catalog) => catalog.id === selectedCatalogId)?.title ?? "Catalogs")}
                {activeSection === "users" && "Users"}
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7">
          <div className="grid gap-5">
          {activeSection === "products" && <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Sales products</CardTitle>
                <Button variant="accent" onClick={addProduct}>Add product</Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {products.map((product, index) => (
                <div key={product.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[260px_1fr_auto]">
                  <div className="grid grid-cols-2 gap-3">
                    {(["front", "back"] as const).map((sideName) => {
                      const image = sideName === "front" ? product.front_image_url || product.image_url : product.back_image_url;
                      return (
                        <div key={sideName} className="overflow-hidden rounded-xl bg-slate-100">
                          {image ? (
                            <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }} />
                          ) : (
                            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-900 via-teal-700 to-slate-100">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div className="border-t bg-white p-2 text-center text-xs font-semibold capitalize text-slate-500">{sideName}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_130px]">
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                        value={product.title}
                        onChange={(event) => updateProduct(product.id, { title: event.target.value })}
                      />
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                        value={product.price}
                        onChange={(event) => updateProduct(product.id, { price: Number(event.target.value) })}
                        type="number"
                        min={1}
                      />
                    </div>
                    <textarea
                      className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                      value={product.description}
                      onChange={(event) => updateProduct(product.id, { description: event.target.value })}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-400"
                        placeholder="Front image URL"
                        value={product.front_image_url || product.image_url || ""}
                        onChange={(event) => updateProduct(product.id, { front_image_url: event.target.value, image_url: event.target.value })}
                      />
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-400"
                        placeholder="Back image URL"
                        value={product.back_image_url ?? ""}
                        onChange={(event) => updateProduct(product.id, { back_image_url: event.target.value })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold transition hover:bg-slate-200">
                        <UploadCloud className="h-4 w-4" /> Upload front
                        <input
                          className="hidden"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => uploadProductImage(product, "front", event)}
                        />
                      </label>
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold transition hover:bg-slate-200">
                        <UploadCloud className="h-4 w-4" /> Upload back
                        <input
                          className="hidden"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => uploadProductImage(product, "back", event)}
                        />
                      </label>
                      <span className="inline-flex h-10 items-center rounded-lg bg-teal-50 px-3 text-xs font-semibold text-teal-700">
                        Auto-saves changes
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={Boolean(product.active)}
                        onChange={(event) => updateProduct(product.id, { active: event.target.checked })}
                      />
                      Active on homepage
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Button variant="secondary" onClick={() => void saveProduct(product)}>
                      Save #{index + 1}
                    </Button>
                    <Button variant="secondary" onClick={() => deleteProduct(product)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>}

          {activeSection === "brilogs" && <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>3D brilog products</CardTitle>
                <Button variant="accent" onClick={addBrilog}>Add brilog</Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {brilogs.map((brilog, index) => (
                <div key={brilog.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[320px_1fr_auto]">
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(brilog.images ?? []).slice(0, 10).map((image) => (
                        <div key={image.id} className="group relative overflow-hidden rounded-xl bg-slate-100">
                          <div className="h-24 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${image.image_url}")` }} />
                          <button
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100"
                            onClick={() => void deleteBrilogImage(brilog, image.id)}
                            aria-label="Delete brilog photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(brilog.images?.length ?? 0) === 0 && (
                        <div className="col-span-3 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 via-white to-blue-100">
                          <ImageIcon className="h-8 w-8 text-slate-500" />
                        </div>
                      )}
                    </div>
                    <label className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                      (brilog.images?.length ?? 0) >= 10 ? "bg-slate-100 text-slate-400" : "bg-slate-950 text-white hover:bg-slate-800"
                    }`}>
                      <UploadCloud className="h-4 w-4" /> Upload photo ({brilog.images?.length ?? 0}/10)
                      <input
                        className="hidden"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={(brilog.images?.length ?? 0) >= 10}
                        onChange={(event) => uploadBrilogImage(brilog, event)}
                      />
                    </label>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_130px]">
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                        value={brilog.title}
                        onChange={(event) => updateBrilog(brilog.id, { title: event.target.value })}
                      />
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                        value={brilog.price}
                        onChange={(event) => updateBrilog(brilog.id, { price: Number(event.target.value) })}
                        type="number"
                        min={1}
                      />
                    </div>
                    <textarea
                      className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                      value={brilog.description}
                      onChange={(event) => updateBrilog(brilog.id, { description: event.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-10 items-center rounded-lg bg-teal-50 px-3 text-xs font-semibold text-teal-700">
                        Auto-saves changes
                      </span>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={Boolean(brilog.active)}
                          onChange={(event) => updateBrilog(brilog.id, { active: event.target.checked })}
                        />
                        Active on homepage
                      </label>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Button variant="secondary" onClick={() => void saveBrilog(brilog)}>
                      Save #{index + 1}
                    </Button>
                    <Button variant="secondary" onClick={() => deleteBrilog(brilog)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
              {brilogs.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No brilog products yet.</p>}
            </CardContent>
          </Card>}

          {activeSection === "catalogs" && <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{selectedCatalog ? selectedCatalog.title : "Select a catalog"}</CardTitle>
                {selectedCatalog && <Button variant="accent" onClick={() => void addCatalogProduct(selectedCatalog)}>Add product</Button>}
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              {filteredCatalogs.map((catalog) => {
                const catalogIndex = catalogs.findIndex((item) => item.id === catalog.id);
                return (
                <div key={catalog.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
                    <div className="grid gap-3">
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                        value={catalog.title}
                        onChange={(event) => updateCatalog(catalog.id, { title: event.target.value })}
                        placeholder="Catalog title"
                      />
                      <textarea
                        className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                        value={catalog.description}
                        onChange={(event) => updateCatalog(catalog.id, { description: event.target.value })}
                        placeholder="Catalog description"
                      />
                    </div>
                    <div className="grid gap-3">
                      <input
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-400"
                        value={catalog.slug}
                        onChange={(event) => updateCatalog(catalog.id, { slug: event.target.value })}
                        placeholder="catalog-url"
                      />
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={Boolean(catalog.active)}
                          onChange={(event) => updateCatalog(catalog.id, { active: event.target.checked })}
                        />
                        Active on dashboard
                      </label>
                    </div>
                    <div className="flex flex-wrap items-start gap-2">
                      <Button variant="secondary" onClick={() => void moveCatalog(catalog.id, -1)} disabled={catalogIndex <= 0} aria-label="Move catalog up">
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" onClick={() => void moveCatalog(catalog.id, 1)} disabled={catalogIndex < 0 || catalogIndex >= catalogs.length - 1} aria-label="Move catalog down">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" onClick={() => void saveCatalog(catalog)}>Save</Button>
                      <Button variant="secondary" onClick={() => void addCatalogProduct(catalog)}>Add product</Button>
                      <Button variant="secondary" onClick={() => void deleteCatalog(catalog)}><Trash2 className="h-4 w-4" /> Delete</Button>
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4">
                    {(catalog.products ?? []).map((product) => (
                      <div key={product.id} className="grid gap-4 rounded-xl bg-slate-50 p-3 lg:grid-cols-[260px_1fr_auto]">
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 gap-2">
                            {(product.images ?? []).slice(0, 10).map((image) => (
                              <div key={image.id} className="group relative overflow-hidden rounded-lg bg-white">
                                <div className="h-20 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${image.image_url}")` }} />
                                <button
                                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100"
                                  onClick={() => void deleteCatalogImage(image.id)}
                                  aria-label="Delete catalog product photo"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {(product.images?.length ?? 0) === 0 && (
                              <div className="col-span-3 flex h-24 items-center justify-center rounded-lg bg-white">
                                <ImageIcon className="h-7 w-7 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <label className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
                            (product.images?.length ?? 0) >= 10 ? "bg-slate-200 text-slate-400" : "bg-slate-950 text-white hover:bg-slate-800"
                          }`}>
                            <UploadCloud className="h-4 w-4" /> Upload ({product.images?.length ?? 0}/10)
                            <input
                              className="hidden"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              disabled={(product.images?.length ?? 0) >= 10}
                              onChange={(event) => uploadCatalogImage(product, event)}
                            />
                          </label>
                        </div>
                        <div className="grid gap-3">
                          <div className="grid gap-3 md:grid-cols-[1fr_130px]">
                            <input
                              className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                              value={product.title}
                              onChange={(event) => updateCatalogProduct(catalog.id, product.id, { title: event.target.value })}
                            />
                            <input
                              className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-teal-400"
                              value={product.price}
                              onChange={(event) => updateCatalogProduct(catalog.id, product.id, { price: Number(event.target.value) })}
                              type="number"
                              min={1}
                            />
                          </div>
                          <textarea
                            className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                            value={product.description}
                            onChange={(event) => updateCatalogProduct(catalog.id, product.id, { description: event.target.value })}
                          />
                          <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                              type="checkbox"
                              checked={Boolean(product.active)}
                              onChange={(event) => updateCatalogProduct(catalog.id, product.id, { active: event.target.checked })}
                            />
                            Active in catalog
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <Button variant="secondary" onClick={() => void saveCatalogProduct(product)}>Save</Button>
                          <Button variant="secondary" onClick={() => void deleteCatalogProduct(product)}><Trash2 className="h-4 w-4" /> Delete</Button>
                        </div>
                      </div>
                    ))}
                    {(catalog.products?.length ?? 0) === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No products in this catalog yet.</p>}
                  </div>
                </div>
              );})}
              {filteredCatalogs.length === 0 && catalogs.length > 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">Choose a catalog from the left sidebar to edit its settings and products.</p>}
              {catalogs.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No custom catalogs yet.</p>}
            </CardContent>
          </Card>}
        </div>

        {activeSection === "users" && <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-400"
                  placeholder="Search user by name or email"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />
              </label>
              <div className="grid max-h-[620px] gap-2 overflow-auto pr-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className={`rounded-xl border p-3 text-left transition hover:border-teal-300 hover:bg-teal-50 ${
                      selectedUser?.id === user.id ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"
                    }`}
                    onClick={() => openUser(user)}
                  >
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs font-medium text-slate-400">{user.project_count} saved cards</p>
                  </button>
                ))}
                {filteredUsers.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No users found.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedUser ? `${selectedUser.name}'s cards` : "User designs"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {!selectedUser && <p className="text-sm text-slate-500">Click a user to view saved card designs.</p>}
              {selectedUser && selectedProjects.length === 0 && <p className="text-sm text-slate-500">No saved designs yet.</p>}
              {selectedProjects.map((project) => (
                <div key={project.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[120px_1fr_auto]">
                  {project.preview ? (
                    <div className="h-20 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url("${project.preview}")` }} />
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded-lg bg-slate-100">
                      <Eye className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{project.title}</p>
                    <p className="text-xs text-slate-500">{project.updated_at ?? project.created_at}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void downloadProject(project)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>}
        </div>
      </section>
    </main>
  );
}
