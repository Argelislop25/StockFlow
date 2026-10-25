
import { useEffect, useState } from "react";
import api from "./services/api";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  const [exitForm, setExitForm] = useState({
    product: "",
    quantity: "",
    concept: "sale",
    movement_date: new Date().toLocaleDateString("en-CA"),
    movement_time: new Date().toTimeString().slice(0, 5),
    received_by: "",
  });

  const [exitSaving, setExitSaving] = useState(false);
  const [exitError, setExitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    cost: "",
    quantity: 0,
    minimum_stock: 5,
    category: "",
    supplier: "",
  });

  const loadData = async () => {
    try {
      const [productsResponse, categoriesResponse, suppliersResponse] =
        await Promise.all([
          api.get("products/"),
          api.get("categories/"),
          api.get("suppliers/"),
        ]);

      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
      setSuppliers(suppliersResponse.data);
      setError("");
    } catch {
      setError("No se pudieron cargar los datos del inventario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const lowStock = products.filter(
    (product) => product.quantity <= product.minimum_stock
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.cost) * product.quantity,
    0
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setSuccess("");

    try {
      const productData = {
        ...form,
        price: Number(form.price).toFixed(2),
        cost: Number(form.cost).toFixed(2),
        quantity: Number(form.quantity),
        minimum_stock: Number(form.minimum_stock),
        category: Number(form.category),
        supplier: form.supplier ? Number(form.supplier) : null,
      };

      await api.post("products/", productData);

      await loadData();

      setModalOpen(false);
      setForm({
        name: "",
        sku: "",
        description: "",
        price: "",
        cost: "",
        quantity: 0,
        minimum_stock: 5,
        category: "",
        supplier: "",
      });

      setSuccess("Producto registrado correctamente.");
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        setFormError(
          Object.entries(data)
            .map(([field, messages]) =>
              `${field}: ${
                Array.isArray(messages) ? messages.join(", ") : messages
              }`
            )
            .join(" | ")
        );
      } else {
        setFormError("No se pudo registrar el producto.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExitChange = (event) => {
    const { name, value } = event.target;

    setExitForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateExit = async (event) => {
    event.preventDefault();
    setExitSaving(true);
    setExitError("");
    setSuccess("");

    try {
      // Registrar la salida en Django
      const movementResponse = await api.post("movements/", {
        ...exitForm,
        product: Number(exitForm.product),
        quantity: Number(exitForm.quantity),
      });

      const movement = movementResponse.data;

      // Actualizar el inventario
      await loadData();

      // Descargar el comprobante PDF
      try {
        const pdfResponse = await api.get(
          `movements/${movement.id}/pdf/`,
          {
            responseType: "blob",
          }
        );

        const pdfUrl = window.URL.createObjectURL(
          new Blob([pdfResponse.data], {
            type: "application/pdf",
          })
        );

        const downloadLink = document.createElement("a");
        downloadLink.href = pdfUrl;
        downloadLink.download =
          `${movement.document_number || "comprobante-salida"}.pdf`;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        window.URL.revokeObjectURL(pdfUrl);

        setSuccess(
          `Salida registrada correctamente. Comprobante ${movement.document_number} descargado.`
        );
      } catch (pdfError) {
        console.error("Error al generar el PDF:", pdfError);

        setSuccess(
          "La salida se registró correctamente, pero no se pudo descargar el PDF."
        );
      }

      setExitModalOpen(false);

      setExitForm({
        product: "",
        quantity: "",
        concept: "sale",
        movement_date: new Date().toLocaleDateString("en-CA"),
        movement_time: new Date().toTimeString().slice(0, 5),
        received_by: "",
      });
    } catch (err) {
      const data = err.response?.data;

      setExitError(
        data
          ? Object.entries(data)
              .map(([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
              )
              .join(" | ")
          : "No se pudo registrar la salida."
      );
    } finally {
      setExitSaving(false);
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          Stock<span>Core</span>
        </div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <nav>
          <a
            className={`nav-link ${
              currentPage === "dashboard" ? "active" : ""
            }`}
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage("dashboard");
            }}
          >
            Dashboard
          </a>

          <a
            className={`nav-link ${
              currentPage === "inventory" ? "active" : ""
            }`}
            href="#inventory"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage("inventory");
            }}
          >
            Inventario
          </a>

          <a
            className={`nav-link ${
              currentPage === "categories" ? "active" : ""
            }`}
            href="#categories"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage("categories");
            }}
          >
            Categorías
          </a>

          <a
            className={`nav-link ${
              currentPage === "suppliers" ? "active" : ""
            }`}
            href="#suppliers"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage("suppliers");
            }}
          >
            Proveedores
          </a>
        </nav>

        <div className="sidebar-footer">
          <strong>StockCore</strong>
          <p>Inventory Management</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
          </div>

          <div className="user-profile">
            <div className="avatar">A</div>
            <span>Administrator</span>
          </div>
        </header>

        <section className="welcome">
          <div>
            <h2>Bienvenido a StockCore</h2>
            <p>Este es el resumen de tu inventario.</p>
          </div>
          <span className="status">Sistema conectado</span>
        </section>

        {loading && <p>Cargando inventario...</p>}
        {error && <p className="error">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {!loading && !error && currentPage === "dashboard" && (
          <>
            <section className="stats-grid">
              <article className="stat-card">
                <p>Total de productos</p>
                <h2>{products.length}</h2>
                <span>Productos registrados</span>
              </article>

              <article className="stat-card">
                <p>Unidades disponibles</p>
                <h2>{totalUnits}</h2>
                <span>Unidades en inventario</span>
              </article>

              <article className="stat-card">
                <p>Valor del inventario</p>
                <h2>${inventoryValue.toFixed(2)}</h2>
                <span>Valor basado en el costo</span>
              </article>

              <article className="stat-card warning-card">
                <p>Stock bajo</p>
                <h2>{lowStock.length}</h2>
                <span>Productos que necesitan atención</span>
              </article>
            </section>

            <section className="inventory-section" id="inventory">
              <div className="section-heading">
                <div>
                  <h2>Inventario reciente</h2>
                  <p>Productos registrados en StockCore</p>
                </div>

                <div className="inventory-actions">
                  <span>{products.length} productos</span>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setFormError("");
                      setModalOpen(true);
                    }}
                  >
                    + Nuevo producto
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Precio</th>
                      <th>Existencias</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => {
                      const isLow =
                        product.quantity <= product.minimum_stock;

                      return (
                        <tr key={product.id}>
                          <td className="product-name">{product.name}</td>
                          <td>{product.sku}</td>
                          <td>${Number(product.price).toFixed(2)}</td>
                          <td>{product.quantity}</td>
                          <td>
                            <span
                              className={isLow ? "badge-low" : "badge-ok"}
                            >
                              {isLow ? "Stock bajo" : "Disponible"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* PAGINA DE INVENTARIO */}
        {!loading && !error && currentPage === "inventory" && (
          <section className="inventory-section">
            <div className="section-heading">
              <div>
                <h2>Gestión de inventario</h2>
                <p>Administra todos los productos registrados.</p>
              </div>

              <div className="inventory-actions">
                <span>{products.length} productos</span>

                <button
                  className="danger-button"
                  onClick={() => {
                    setExitError("");
                    setExitModalOpen(true);
                  }}
                >
                  − Retirar unidades
                </button>

                <button
                  className="primary-button"
                  onClick={() => {
                    setFormError("");
                    setModalOpen(true);
                  }}
                >
                  + Nuevo producto
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7">No hay productos registrados.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="product-name">{product.name}</td>
                        <td>{product.sku}</td>
                        <td>
                          {categories.find(
                            (cat) => cat.id === product.category
                          )?.name || "—"}
                        </td>
                        <td>
                          {suppliers.find(
                            (sup) => sup.id === product.supplier
                          )?.name || "—"}
                        </td>
                        <td>${Number(product.price).toFixed(2)}</td>
                        <td>{product.quantity}</td>
                        <td>
                          <span
                            className={
                              product.quantity <= product.minimum_stock
                                ? "badge-low"
                                : "badge-ok"
                            }
                          >
                            {product.quantity <= product.minimum_stock
                              ? "Stock bajo"
                              : "Disponible"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PAGINA DE CATEGORIAS */}
        {!loading && !error && currentPage === "categories" && (
          <section className="inventory-section">
            <div className="section-heading">
              <div>
                <h2>Gestión de categorías</h2>
                <p>Organiza y administra las categorías de tus productos.</p>
              </div>

              <div className="inventory-actions">
                <span>{categories.length} categorías</span>
                <button
                  className="primary-button"
                  onClick={() => {
                    const name = window.prompt(
                      "Nombre de la nueva categoría:"
                    );

                    if (name && name.trim()) {
                      api
                        .post("categories/", { name: name.trim() })
                        .then(() => loadData())
                        .catch(() =>
                          alert("No se pudo crear la categoría.")
                        );
                    }
                  }}
                >
                  + Nueva categoría
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre de categoría</th>
                    <th>Productos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="4">No hay categorías registradas.</td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id}>
                        <td>{cat.id}</td>
                        <td className="product-name">{cat.name}</td>
                        <td>
                          {products.filter(
                            (product) => product.category === cat.id
                          ).length}
                        </td>
                        <td>
                          <button
                            className="secondary-button"
                            onClick={() => {
                              const name = window.prompt(
                                "Editar categoría:",
                                cat.name
                              );

                              if (name && name.trim()) {
                                api
                                  .put(`categories/${cat.id}/`, {
                                    name: name.trim(),
                                  })
                                  .then(() => loadData())
                                  .catch(() =>
                                    alert("No se pudo editar la categoría.")
                                  );
                              }
                            }}
                          >
                            Editar
                          </button>

                          <button
                            className="secondary-button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar la categoría ${cat.name}?`
                                )
                              ) {
                                api
                                  .delete(`categories/${cat.id}/`)
                                  .then(() => loadData())
                                  .catch(() =>
                                    alert(
                                      "No se pudo eliminar. Comprueba si tiene productos asociados."
                                    )
                                  );
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PAGINA DE PROVEEDORES */}
        {!loading && !error && currentPage === "suppliers" && (
          <section className="inventory-section">
            <div className="section-heading">
              <div>
                <h2>Gestión de proveedores</h2>
                <p>Administra los proveedores de tu inventario.</p>
              </div>

              <div className="inventory-actions">
                <span>{suppliers.length} proveedores</span>
                <button
                  className="primary-button"
                  onClick={() => {
                    const name = window.prompt("Nombre del proveedor:");

                    if (name && name.trim()) {
                      api
                        .post("suppliers/", { name: name.trim() })
                        .then(() => loadData())
                        .catch(() =>
                          alert("No se pudo crear el proveedor.")
                        );
                    }
                  }}
                >
                  + Nuevo proveedor
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proveedor</th>
                    <th>Productos asociados</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="4">No hay proveedores registrados.</td>
                    </tr>
                  ) : (
                    suppliers.map((sup) => (
                      <tr key={sup.id}>
                        <td>{sup.id}</td>
                        <td className="product-name">{sup.name}</td>
                        <td>
                          {products.filter((product) => {
                            const supplierId =
                              typeof product.supplier === "object"
                                ? product.supplier?.id
                                : product.supplier;

                            return Number(supplierId) === Number(sup.id);
                          }).length}
                        </td>
                        <td>
                          <button
                            className="secondary-button"
                            onClick={() => {
                              const name = window.prompt(
                                "Editar proveedor:",
                                sup.name
                              );

                              if (name && name.trim()) {
                                api
                                  .put(`suppliers/${sup.id}/`, {
                                    name: name.trim(),
                                  })
                                  .then(() => loadData())
                                  .catch(() =>
                                    alert("No se pudo editar el proveedor.")
                                  );
                              }
                            }}
                          >
                            Editar
                          </button>

                          <button
                            className="secondary-button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar el proveedor ${sup.name}?`
                                )
                              ) {
                                api
                                  .delete(`suppliers/${sup.id}/`)
                                  .then(() => loadData())
                                  .catch(() =>
                                    alert(
                                      "No se pudo eliminar el proveedor. Comprueba si tiene productos asociados."
                                    )
                                  );
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* MODAL DE SALIDA DE INVENTARIO */}
      {exitModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !exitSaving && setExitModalOpen(false)}
        >
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Retirar unidades</h2>
                <p>Registra una salida del inventario.</p>
              </div>

              <button
                className="modal-close"
                type="button"
                disabled={exitSaving}
                onClick={() => setExitModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateExit}>
              <div className="form-grid">
                <label className="full-width">
                  Producto *
                  <select
                    name="product"
                    value={exitForm.product}
                    onChange={handleExitChange}
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — Stock: {product.quantity}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Unidades a retirar *
                  <input
                    type="number"
                    name="quantity"
                    value={exitForm.quantity}
                    onChange={handleExitChange}
                    min="1"
                    step="1"
                    required
                  />
                </label>

                <label>
                  Concepto *
                  <select
                    name="concept"
                    value={exitForm.concept}
                    onChange={handleExitChange}
                    required
                  >
                    <option value="sale">Venta</option>
                    <option value="damaged">Producto dañado</option>
                    <option value="loss">Pérdida</option>
                    <option value="internal">Uso interno</option>
                    <option value="other">Otro</option>
                  </select>
                </label>

                <label>
                  Fecha *
                  <input
                    type="date"
                    name="movement_date"
                    value={exitForm.movement_date}
                    onChange={handleExitChange}
                    required
                  />
                </label>

                <label>
                  Hora *
                  <input
                    type="time"
                    name="movement_time"
                    value={exitForm.movement_time}
                    onChange={handleExitChange}
                    required
                  />
                </label>

                <label className="full-width">
                  Recibido por *
                  <input
                    type="text"
                    name="received_by"
                    value={exitForm.received_by}
                    onChange={handleExitChange}
                    placeholder="Nombre de quien recibe el producto"
                    maxLength="150"
                    required
                  />
                </label>
              </div>

              {exitError && <p className="error">{exitError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={exitSaving}
                  onClick={() => setExitModalOpen(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="danger-button"
                  disabled={exitSaving}
                >
                  {exitSaving ? "Registrando..." : "Confirmar salida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVO PRODUCTO */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Nuevo producto</h2>
                <p>Completa la información para registrar un producto.</p>
              </div>

              <button
                className="modal-close"
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-grid">
                <label>
                  Nombre del producto *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength="150"
                  />
                </label>

                <label>
                  SKU *
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    required
                    maxLength="50"
                  />
                </label>

                <label className="full-width">
                  Descripción
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Precio de venta *
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Costo *
                  <input
                    type="number"
                    name="cost"
                    value={form.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Cantidad inicial *
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                  />
                </label>

                <label>
                  Stock mínimo *
                  <input
                    type="number"
                    name="minimum_stock"
                    value={form.minimum_stock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                  />
                </label>

                <label>
                  Categoría *
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Proveedor
                  <select
                    name="supplier"
                    value={form.supplier}
                    onChange={handleChange}
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
