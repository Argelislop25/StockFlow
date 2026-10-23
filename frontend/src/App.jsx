
import { useEffect, useState } from "react";
import api from "./services/api";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("products/")
      .then((response) => setProducts(response.data))
      .catch(() => setError("No se pudieron cargar los productos."))
      .finally(() => setLoading(false));
  }, []);

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity, 0
  );

  const lowStock = products.filter(
    (product) => product.quantity <= product.minimum_stock
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.cost) * product.quantity, 0
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">Stock<span>Flow</span></div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <nav>
          <a className="nav-link active" href="#">Dashboard</a>
          <a className="nav-link" href="#inventory">Inventario</a>
          <a className="nav-link" href="#">Categorías</a>
          <a className="nav-link" href="#">Proveedores</a>
        </nav>

        <div className="sidebar-footer">
          <strong>StockFlow</strong>
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
            <h2>Bienvenido a StockFlow</h2>
            <p>Este es el resumen de tu inventario.</p>
          </div>
          <span className="status">Sistema conectado</span>
        </section>

        {loading && <p>Cargando inventario...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
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
                  <p>Productos registrados en StockFlow</p>
                </div>
                <span>{products.length} productos</span>
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
                            <span className={isLow ? "badge-low" : "badge-ok"}>
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
      </main>
    </div>
  );
}

export default App;
