# Documentación de la API (Nexofood API)

> [!NOTE]
> **Estado Actual:** El proyecto tiene definidas las entidades de dominio, los repositorios y los DTOs (Data Transfer Objects) para Request/Response en los módulos `auth`, `cart`, `catalog`, `order` y `payment`. **Los Controladores REST aún no están implementados**. 
> La siguiente documentación define el **contrato de la API proyectado** en base a los DTOs existentes en el código fuente actual.

---

## Módulo: Autenticación (Auth)

### [POST] /api/auth/register
*Registra un nuevo usuario en el sistema a partir de sus datos básicos.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `email` | String | Body | Sí | Correo electrónico del usuario (formato válido, max 255). |
| `password` | String | Body | Sí | Contraseña (entre 8 y 100 caracteres). |
| `fullName` | String | Body | Sí | Nombre completo del usuario (max 150). |
| `phone` | String | Body | No | Teléfono de contacto (max 20). |

```json
// 200 OK (AuthResponse esperado)
{
  "accessToken": "eyJhbG...",
  "refreshToken": "d8f9e...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### [PUT] /api/auth/users/{id}
*Actualiza la información de un usuario existente.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `id` | UUID | Params | Sí | Identificador único del usuario. |
| (Campos a actualizar) | Object | Body | Sí | Depende del `UserUpdateRequest`. |

```json
// 200 OK (UserResponse esperado)
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "correo@ejemplo.com",
  "fullName": "Juan Perez",
  "phone": "+123456789",
  "systemRole": "CUSTOMER",
  "isActive": true,
  "createdAt": "2023-10-01T12:00:00Z",
  "updatedAt": "2023-10-02T12:00:00Z"
}
```

### [POST] /api/auth/users/{id}/addresses
*Agrega una dirección para un cliente.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `id` | UUID | Params | Sí | Identificador del usuario. |
| `addressData` | Object | Body | Sí | Datos del `CustomerAddressRequest`. |

---

## Módulo: Catálogo (Catalog)

### [POST] /api/catalog/categories
*Crea una nueva categoría de productos.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `name` | String | Body | Sí | Nombre de la categoría. |
| `description` | String | Body | No | Descripción de la categoría. |

### [POST] /api/catalog/products
*Crea un nuevo producto en el catálogo.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `categoryId` | UUID | Body | No | ID de la categoría a la que pertenece el producto. |
| `name` | String | Body | Sí | Nombre del producto (max 150). |
| `description` | String | Body | No | Descripción del producto. |
| `price` | Decimal | Body | Sí | Precio del producto (mayor a 0). |
| `imageUrl` | String | Body | No | URL de la imagen. |
| `isAvailable` | Boolean| Body | No | Disponibilidad del producto. |

```json
// 200 OK (Ejemplo ilustrativo ProductResponse)
{
  "id": "999e4567-e89b-12d3-a456-426614174999",
  "name": "Hamburguesa Clásica",
  "price": 10.50,
  "isAvailable": true
}
```

---

## Módulo: Carrito (Cart)

### [POST] /api/cart/items
*Agrega un producto al carrito de compras.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `productId` | UUID | Body | Sí | El ID del producto a agregar. |
| `quantity` | Integer | Body | Sí | La cantidad (mínimo 1). |
| `notes` | String | Body | No | Notas adicionales para el producto. |

```json
// 200 OK (CartItemResponse esperado)
{
  "id": "111e4567-e89b-12d3-a456-426614174111",
  "productId": "999e4567-e89b-12d3-a456-426614174999",
  "quantity": 2,
  "notes": "Sin cebolla"
}
```

---

## Módulo: Órdenes (Order)

### [POST] /api/orders
*Crea una nueva orden de compra basándose en el contenido de un carrito.*

| Nombre | Tipo | Ubicación | Obligatorio | Descripción |
|--------|------|-----------|-------------|-------------|
| `orderData` | Object | Body | Sí | Datos provenientes de `OrderCreateRequest` y `OrderItemRequest`. |

```json
// 200 OK (Ejemplo ilustrativo de fallo)
{
  "success": false,
  "error": "Error de validación: El campo X es obligatorio."
}
```
