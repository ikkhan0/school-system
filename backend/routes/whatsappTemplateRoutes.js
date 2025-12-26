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
                { school_id: req.tenant_id },
                { school_id: null } // Include system defaults if any
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
            school_id: req.tenant_id,
            type: type,
            isActive: true
        });

        // If not found, find system default
        if (!template) {
            template = await WhatsappTemplate.findOne({
                school_id: null,
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

// @desc    Create a new template
// @route   POST /api/whatsapp-templates
router.post('/', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        const { name, type, content, variables } = req.body;

        // If creating a new active template of a type, deactivate others of that type?
        // User might want multiple templates for "Fee Reminder" and choose one manually?
        // For now, let's assume one active default per type per school for automation, 
        // but if manual, they can pick. The "active" flag might mean "Default".

        const newTemplate = new WhatsappTemplate({
            school_id: req.tenant_id,
            name,
            type,
            content,
            variables,
            isActive: true
        });

        await newTemplate.save();
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
        const template = await WhatsappTemplate.findOne({ _id: req.params.id, school_id: req.tenant_id });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (name) template.name = name;
        if (type) template.type = type;
        if (content) template.content = content;
        if (variables) template.variables = variables;
        if (isActive !== undefined) template.isActive = isActive;

        await template.save();
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete template
// @route   DELETE /api/whatsapp-templates/:id
router.delete('/:id', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        const template = await WhatsappTemplate.findOne({ _id: req.params.id, school_id: req.tenant_id });
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
