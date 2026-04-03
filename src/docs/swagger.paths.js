/**
 * @swagger
 * tags:
 *   - name: Health
 *   - name: Auth
 *   - name: Users
 *   - name: Financial Records
 *   - name: Dashboard
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: "Health check"
 *     responses:
 *       200:
 *         description: Service health
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: "Login and obtain access/refresh tokens"
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login success
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: "Rotate refresh token and issue new access token"
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token rotated
 *       401:
 *         description: Invalid refresh token
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: "Revoke one refresh token session"
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logged out
 */

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: "Revoke all active sessions for current user"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Logged out from all sessions
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: "Get current authenticated profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Profile fetched
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: "Create a user (permission: create)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Users]
 *     summary: "List users (permission: read)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Users fetched
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: "Update user (permission: update)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/financial-records:
 *   post:
 *     tags: [Financial Records]
 *     summary: "Create financial record (permission: create)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialRecordRequest'
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Financial Records]
 *     summary: "List records with filters and pagination (permission: read)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Records fetched
 */

/**
 * @swagger
 * /api/financial-records/{id}:
 *   patch:
 *     tags: [Financial Records]
 *     summary: "Update financial record (permission: update)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialRecordUpdateRequest'
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 *   delete:
 *     tags: [Financial Records]
 *     summary: "Soft delete financial record (permission: delete)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Record soft-deleted
 */

/**
 * @swagger
 * /api/dashboard/total-income:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Get total income (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Total income returned
 */

/**
 * @swagger
 * /api/dashboard/total-expense:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Get total expense (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Total expense returned
 */

/**
 * @swagger
 * /api/dashboard/net-balance:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Get net balance (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Net balance returned
 */

/**
 * @swagger
 * /api/dashboard/category-wise:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Category-wise totals (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Category totals returned
 */

/**
 * @swagger
 * /api/dashboard/monthly-trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Monthly trends (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Monthly trends returned
 */

/**
 * @swagger
 * /api/dashboard/last-transactions:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Last N transactions (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Last transactions returned
 */

/**
 * @swagger
 * /api/dashboard/top-expense-categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Top expense categories (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Top categories returned
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: "Dashboard summary (permission: summary)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - $ref: '#/components/parameters/XRoleHeader'
 *     responses:
 *       200:
 *         description: Dashboard summary returned
 */
