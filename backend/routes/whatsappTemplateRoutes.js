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
    const result = await WhatsappTemplate.updateMany(
        {
            tenant_id,
            type,
            _id: { $ne: currentTemplateId },
            isActive: true
        },
        { isActive: false }
    );
    console.log(`🔄 Deactivated ${result.modifiedCount} other template(s) of type "${type}"`);
}

// @desc    Create a new template
// @route   POST /api/whatsapp-templates
router.post('/', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        const { name, type, content, variables, isActive } = req.body;

        console.log('📝 POST /api/whatsapp-templates');
        console.log('Creating new template:', { name, type, isActive });

        const newTemplate = new WhatsappTemplate({
            tenant_id: req.tenant_id,
            name,
            type,
            content,
            variables,
            isActive: isActive !== undefined ? isActive : true
        });

        await newTemplate.save();
        console.log('✅ Template created:', newTemplate._id);

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

        console.log('📝 PUT /api/whatsapp-templates/:id');
        console.log('Template ID:', req.params.id);
        console.log('Tenant ID:', req.tenant_id);
        console.log('Request body:', { name, type, content: content?.substring(0, 50), variables, isActive });

        // First, check if this template exists
        const templateCheck = await WhatsappTemplate.findById(req.params.id);

        if (!templateCheck) {
            console.log('❌ Template not found - returning 404');
            return res.status(404).json({ message: 'Template not found' });
        }

        // Check if it's a system default template (tenant_id: null)
        if (!templateCheck.tenant_id) {
            console.log('❌ Cannot edit system default template');
            return res.status(403).json({
                message: 'Cannot edit system default template. Please create a new template instead.'
            });
        }

        // Find the template by ID and ensure it belongs to this tenant
        const template = await WhatsappTemplate.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        console.log('Template found:', template ? `Yes (${template.name})` : 'No');

        if (!template) {
            console.log('❌ Template not found - returning 404');
            return res.status(404).json({ message: 'Template not found or does not belong to your school' });
        }

        // Check if name is being changed and if new name already exists
        if (name && name !== template.name) {
            const existingTemplate = await WhatsappTemplate.findOne({
                tenant_id: req.tenant_id,
                name: name,
                _id: { $ne: req.params.id } // Exclude current template
            });

            if (existingTemplate) {
                console.log('❌ Template with this name already exists');
                return res.status(400).json({
                    message: `A template with the name "${name}" already exists. Please use a different name.`
                });
            }
        }

        // Update the template fields
        if (name !== undefined) template.name = name;
        if (type !== undefined) template.type = type;
        if (content !== undefined) template.content = content;
        if (variables !== undefined) template.variables = variables;
        if (isActive !== undefined) template.isActive = isActive;

        await template.save();
        console.log('✅ Template updated successfully:', template.name);

        // If this template is being set to active, deactivate all other templates of the same type
        if (template.isActive) {
            console.log('🔄 Deactivating other templates of type:', template.type);
            await deactivateOtherTemplates(req.tenant_id, template.type, template._id);
        }

        res.json(template);
    } catch (error) {
        console.error('❌ Error updating template:', error);

        // Handle unique constraint violations
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'A template with this name already exists. Please use a different name.'
            });
        }

        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete template
// @route   DELETE /api/whatsapp-templates/:id
router.delete('/:id', protect, checkPermission('settings.edit'), async (req, res) => {
    try {
        // First, check if this template exists at all
        const templateCheck = await WhatsappTemplate.findById(req.params.id);

        if (!templateCheck) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Check if it's a system default template (tenant_id: null)
        if (!templateCheck.tenant_id) {
            return res.status(403).json({
                message: 'Cannot delete system default template. You can create your own version to override it.'
            });
        }

        // Now check if it belongs to this tenant
        const template = await WhatsappTemplate.findOne({
            _id: req.params.id,
            tenant_id: req.tenant_id
        });

        if (!template) {
            return res.status(404).json({
                message: 'Template not found or does not belong to your school'
            });
        }

        await template.deleteOne();
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
