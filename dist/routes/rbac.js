"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRBACRoutes = void 0;
const express_1 = require("express");
function createRBACRoutes(rbacService) {
    const router = (0, express_1.Router)();
    /**
     * Check permission
     */
    router.post('/check', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, action, resource, context } = req.body;
            if (!user || !action || !resource) {
                return res.status(400).json({
                    success: false,
                    error: 'User, action, and resource are required',
                });
            }
            const decision = yield rbacService.checkPermission(user, action, resource, context);
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
    }));
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
exports.createRBACRoutes = createRBACRoutes;
//# sourceMappingURL=rbac.js.map