"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRBACRoutes = createRBACRoutes;
const express_1 = require("express");
function createRBACRoutes(rbacService) {
    const router = (0, express_1.Router)();
    /**
     * Check permission
     */
    router.post('/check', async (req, res) => {
        try {
            const { user, action, resource, context } = req.body;
            if (!user || !action || !resource) {
                return res.status(400).json({
                    success: false,
                    error: 'User, action, and resource are required',
                });
            }
            const decision = await rbacService.checkPermission(user, action, resource, context);
            res.json({
                success: true,
                data: decision,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
            });
        }
    });
    /**
     * Create permission
     */
    router.post('/permissions', (req, res) => {
        try {
            const permission = rbacService.createPermission(req.body);
            res.json({
                success: true,
                data: permission,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to create permission',
            });
        }
    });
    /**
     * Create role
     */
    router.post('/roles', (req, res) => {
        try {
            const role = rbacService.createRole(req.body);
            res.json({
                success: true,
                data: role,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to create role',
            });
        }
    });
    /**
     * Create policy
     */
    router.post('/policies', (req, res) => {
        try {
            const policy = rbacService.createPolicy(req.body);
            res.json({
                success: true,
                data: policy,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to create policy',
            });
        }
    });
    /**
     * Create resource
     */
    router.post('/resources', (req, res) => {
        try {
            const resource = rbacService.createResource(req.body);
            res.json({
                success: true,
                data: resource,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to create resource',
            });
        }
    });
    return router;
}
//# sourceMappingURL=rbac.js.map