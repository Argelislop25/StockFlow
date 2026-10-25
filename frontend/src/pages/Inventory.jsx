import ProductTable from "../components/ProductTable";

function Inventory({ products, onNewProduct }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Inventario completo</h2>
          <p>{products.length} productos registrados</p>
        </div>
        <button className="primary-button" onClick={onNewProduct}>
          Nuevo producto
        </button>
      </div>
      <ProductTable
        products={products}
        emptyMessage="Aún no hay productos. Usa «Nuevo producto» para registrar el primero."
      />
    </section>
  );
}

export default Inventory;