const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/expenseController');

router.use(auth);

router.get('/',    c.getAll);
router.get('/:id', c.getOne);
router.post('/',   c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

// Notes
router.post('/:id/notes', c.addNote);

// Tags
router.post('/:id/tags',             c.addTag);
router.delete('/:id/tags/:tag_id',   c.removeTag);

module.exports = router;
