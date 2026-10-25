function Suppliers({ suppliers, products }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Proveedores</h2>
          <p>{suppliers.length} proveedores registrados</p>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <p className="empty-state">
          No hay proveedores. Créalos desde el panel de administración del backend.
        </p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th className="num">Productos</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((sup) => (
                <tr key={sup.id}>
                  <td className="product-name">{sup.name}</td>
                  <td className="num">
                    {products.filter((p) => p.supplier === sup.id).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Suppliers;