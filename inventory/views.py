
from io import BytesIO

from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from .models import Category, Supplier, Product, StockMovement
from .serializers import (
    CategorySerializer,
    SupplierSerializer,
    ProductSerializer,
    StockMovementSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related("product").all()
    serializer_class = StockMovementSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            product_id = serializer.validated_data["product"].id
            quantity = serializer.validated_data["quantity"]

            product = Product.objects.select_for_update().get(
                id=product_id
            )

            if quantity <= 0:
                return Response(
                    {"quantity": "La cantidad debe ser mayor que cero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if product.quantity < quantity:
                return Response(
                    {
                        "quantity": (
                            f"Stock insuficiente. "
                            f"Existencias disponibles: {product.quantity}"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            product.quantity -= quantity
            product.save(update_fields=["quantity", "updated_at"])

            movement = serializer.save(
                product=product,
                movement_type="exit",
                document_number=self.generate_document_number()
            )

        return Response(
            self.get_serializer(movement).data,
            status=status.HTTP_201_CREATED
        )

    def generate_document_number(self):
        last_movement = StockMovement.objects.order_by("-id").first()
        next_number = (last_movement.id + 1) if last_movement else 1
        return f"OUT-{next_number:06d}"

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        movement = get_object_or_404(
            StockMovement.objects.select_related("product"),
            pk=pk
        )

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=45,
            leftMargin=45,
            topMargin=45,
            bottomMargin=45,
        )

        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(
            "<b>STOCKCORE</b>",
            styles["Title"]
        ))

        elements.append(Paragraph(
            "COMPROBANTE DE SALIDA DE INVENTARIO",
            styles["Heading2"]
        ))

        elements.append(Spacer(1, 20))

        data = [
            ["Documento:", movement.document_number],
            ["Estado:", "Registrado"],
            ["Fecha:", str(movement.movement_date)],
            ["Hora:", str(movement.movement_time)],
            ["Concepto:", movement.get_concept_display()],
            ["Entregado por:", movement.delivered_by],
            ["Recibido por:", movement.received_by or "________________"],
        ]

        details = Table(data, colWidths=[130, 350])
        details.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EAF0F8")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 9),
        ]))

        elements.append(details)
        elements.append(Spacer(1, 25))

        product_data = [
            ["Producto", "SKU", "Cantidad"],
            [
                movement.product.name,
                movement.product.sku,
                str(movement.quantity),
            ],
        ]

        product_table = Table(
            product_data,
            colWidths=[250, 120, 110]
        )

        product_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#172B4D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 9),
        ]))

        elements.append(product_table)
        elements.append(Spacer(1, 50))

        signatures = Table(
            [
                ["________________________", "________________________"],
                ["Entregado por", "Recibido por"],
                [movement.delivered_by, movement.received_by],
            ],
            colWidths=[240, 240]
        )

        signatures.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))

        elements.append(signatures)
        elements.append(Spacer(1, 35))

        elements.append(Paragraph(
            "Este documento es un comprobante interno de movimiento de "
            "inventario. No constituye una factura fiscal.",
            styles["Italic"]
        ))

        document.build(elements)

        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(
            pdf,
            content_type="application/pdf"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{movement.document_number}.pdf"'
        )

        return response
