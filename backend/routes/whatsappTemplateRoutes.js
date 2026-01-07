const express = require('express');
const router = express.Router();
const WhatsappTemplate = require('../models/WhatsappTemplate');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// @desc    Get all templates for the school
// @route   GET /api/whatsapp-templates
router.get('/', protect, async (req, res) => {
    try {
        const templates = await WhatsappTemplate.find({
            $or: [
                { tenant_id: req.tenant_id },
                { tenant_id: null } // Include system defaults if any
            ]
        }).sort({ type: 1, name: 1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get active template by type
// @route   GET /api/whatsapp-templates/active/:type
router.get('/active/:type', protect, async (req, res) => {
    try {
        const { type } = req.params;
        // Find specific school template first
        let template = await WhatsappTemplate.findOne({
            tenant_id: req.tenant_id,
            type: type,
            isActive: true
        });

        // If not found, find system default
        if (!template) {
            template = await WhatsappTemplate.findOne({
                tenant_id: null,
                type: type,
                isActive: true
            });
        }

        if (!template) {
            return res.status(404).json({ message: 'No active template found for this type' });
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to deactivate other templates of the same type
async function deactivateOtherTemplates(tenant_id, type, currentTemplateId) {
    await WhatsappTemplate.updateMany(
        {
            tenant_id,
            type,
            _id: { $ne: currentTemplateId },
            isActive: true
        },
        { isActive: false }
    );
}

// @desc    Create a new template
// @route   POST /api/whatsapp-templates
router.post('/', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        const { name, type, content, variables, isActive } = req.body;

        const newTemplate = new WhatsappTemplate({
            tenant_id: req.tenant_id,
            name,
            type,
            content,
            variables,
            isActive: isActive !== undefined ? isActive : true
        });

        await newTemplate.save();

        // If this template is active, deactivate all other templates of the same type
        if (newTemplate.isActive) {
            await deactivateOtherTemplates(req.tenant_id, type, newTemplate._id);
        }

        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update template
// @route   PUT /api/whatsapp-templates/:id
router.put('/:id', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        const { name, type, content, variables, isActive } = req.body;

        // Find the template by ID and ensure it belongs to this tenant
        const template = await WhatsappTemplate.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found or access denied' });
        }

        // Update the template fields
        if (name !== undefined) template.name = name;
        if (type !== undefined) template.type = type;
        if (content !== undefined) template.content = content;
        if (variables !== undefined) template.variables = variables;
        if (isActive !== undefined) template.isActive = isActive;

        await template.save();

        // If this template is being set to active, deactivate all other templates of the same type
        if (template.isActive) {
            await deactivateOtherTemplates(req.tenant_id, template.type, template._id);
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete template
// @route   DELETE /api/whatsapp-templates/:id
router.delete('/:id', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        const template = await WhatsappTemplate.findOne({ _id: req.params.id, tenant_id: req.tenant_id });
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        await template.deleteOne();
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
