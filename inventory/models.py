from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Corregido: era created_a

    def __str__(self):
        return self.name

class Product(models.Model):  # Corregido: Product con P mayúscula por convención
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)

    quantity = models.PositiveIntegerField(default=10)
    minimum_stock = models.PositiveIntegerField(default=5)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products"
    )

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    
class StockMovement(models.Model):
    CONCEPT_CHOICES = [
        ("sale", "Venta"),
        ("damaged", "Producto dañado"),
        ("loss", "Pérdida"),
        ("internal", "Uso interno"),
        ("other", "Otro"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="movements"
    )

    document_number = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True
    )

    delivered_by = models.CharField(
        max_length=150,
        default="Administrador"
    )

    received_by = models.CharField(
        max_length=150,
        blank=True,
        default=""
    )

    

    movement_type = models.CharField(
        max_length=10,
        default="exit"
    )

    quantity = models.PositiveIntegerField()

    concept = models.CharField(
        max_length=20,
        choices=CONCEPT_CHOICES
    )

    movement_date = models.DateField()
    movement_time = models.TimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.quantity} - {self.concept}"
