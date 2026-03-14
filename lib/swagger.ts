export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Testing API Ground',
    version: '1.0.0',
    description:
      'A REST API training ground with full CRUD for Users, Products, Orders + JWT Auth. Use the /auth/login endpoint to get a token, then click "Authorize" to use protected endpoints.',
  },
  servers: [{ url: '/api', description: 'API Server' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Bad Request' },
          message: { type: 'string', example: 'Validation failed' },
          details: { type: 'object', nullable: true },
        },
      },
      AuthRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@test.com' },
          password: { type: 'string', minLength: 6, example: 'Admin123!' },
          full_name: { type: 'string', example: 'Admin User', nullable: true },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          user: { $ref: '#/components/schemas/UserResponse' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['ADMIN', 'USER', 'GUEST'] },
          avatar_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      UserCreateRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          full_name: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['ADMIN', 'USER', 'GUEST'], default: 'USER' },
        },
      },
      UserUpdateRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['ADMIN', 'USER', 'GUEST'] },
        },
      },
      RoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['ADMIN', 'USER', 'GUEST'] },
        },
      },
      PermissionsResponse: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['ADMIN', 'USER', 'GUEST'] },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['read:users', 'write:orders', 'read:products'],
          },
        },
      },
      ProductRequest: {
        type: 'object',
        required: ['name', 'price', 'category', 'stock'],
        properties: {
          name: { type: 'string', example: 'Laptop Pro X' },
          description: { type: 'string', nullable: true, example: 'High-performance laptop' },
          price: { type: 'number', format: 'float', example: 999.99 },
          category: { type: 'string', example: 'electronics' },
          stock: { type: 'integer', minimum: 0, example: 50 },
        },
      },
      ProductResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          price: { type: 'number', format: 'float' },
          category: { type: 'string' },
          stock: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      OrderItemRequest: {
        type: 'object',
        required: ['product_id', 'quantity'],
        properties: {
          product_id: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 },
        },
      },
      OrderRequest: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItemRequest' },
            minItems: 1,
          },
          notes: { type: 'string', nullable: true },
        },
      },
      OrderUpdateRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          notes: { type: 'string', nullable: true },
        },
      },
      OrderItemResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          product_id: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer' },
          unit_price: { type: 'number', format: 'float' },
        },
      },
      OrderResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          total_amount: { type: 'number', format: 'float' },
          notes: { type: 'string', nullable: true },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItemResponse' },
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedUsers: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/UserResponse' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          size: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
      PaginatedProducts: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/ProductResponse' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          size: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
      PaginatedOrders: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/OrderResponse' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          size: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthRequest' } },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: { refresh_token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Tokens refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access_token: { type: 'string' },
                    refresh_token: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (invalidate refresh token)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: { refresh_token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          204: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['created_at', 'email', 'full_name', 'role'], default: 'created_at' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: { description: 'List of users', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedUsers' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user (ADMIN only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } } },
        },
        responses: {
          201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: '00000000-0000-0000-0000-000000000002' }],
      get: {
        tags: ['Users'],
        summary: 'Get user by ID (ADMIN or own user)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          200: { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Full update user (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdateRequest' } } },
        },
        responses: {
          200: { description: 'User updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Partial update user (ADMIN or own user)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdateRequest' } } },
        },
        responses: {
          200: { description: 'User updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
    '/users/{id}/role': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: '00000000-0000-0000-0000-000000000002' }],
      put: {
        tags: ['Users'],
        summary: 'Change user role (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleRequest' } } },
        },
        responses: {
          200: { description: 'Role updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
    '/users/{id}/permissions': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: '00000000-0000-0000-0000-000000000002' }],
      get: {
        tags: ['Users'],
        summary: "Get user's permissions",
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          200: {
            description: 'Permissions',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PermissionsResponse' } } },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Not found' },
        },
      },
    },
    '/users/{id}/avatar': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: '00000000-0000-0000-0000-000000000002' }],
      post: {
        tags: ['Users'],
        summary: 'Upload avatar image',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Avatar uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { avatar_url: { type: 'string' } },
                },
              },
            },
          },
          400: { description: 'Invalid file' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      get: {
        tags: ['Users'],
        summary: 'Get avatar URL',
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          200: {
            description: 'Avatar URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { avatar_url: { type: 'string', nullable: true } },
                },
              },
            },
          },
          404: { description: 'User not found' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products (public)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price', 'name', 'created_at', 'stock'], default: 'created_at' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'List of products',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedProducts' } } },
            headers: {
              'Cache-Control': { schema: { type: 'string', example: 'public, max-age=60' } },
            },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product (ADMIN only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductRequest' } } },
        },
        responses: {
          201: { description: 'Product created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductResponse' } } } },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/products/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: '10000000-0000-0000-0000-000000000001' }],
      get: {
        tags: ['Products'],
        summary: 'Get product by ID (public)',
        parameters: [],
        responses: {
          200: { description: 'Product', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductResponse' } } } },
          404: { description: 'Not found' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Full update product (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductRequest' } } },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Products'],
        summary: 'Partial update product (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductRequest' } } },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders (ADMIN: all, USER: own)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] } },
          { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-01-01' },
          { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date' }, example: '2024-12-31' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'List of orders', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedOrders' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order (authenticated)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderRequest' } } },
        },
        responses: {
          201: { description: 'Order created', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderResponse' } } } },
          400: { description: 'Validation error or insufficient stock' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/orders/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, example: '20000000-0000-0000-0000-000000000001' }],
      get: {
        tags: ['Orders'],
        summary: 'Get order by ID with items (ADMIN or own user)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          200: { description: 'Order with items', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      put: {
        tags: ['Orders'],
        summary: 'Update order status (ADMIN only)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderUpdateRequest' } } },
        },
        responses: {
          200: { description: 'Order updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderResponse' } } } },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Orders'],
        summary: 'Delete order (ADMIN or USER if pending)',
        security: [{ BearerAuth: [] }],
        parameters: [],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
  },
}
