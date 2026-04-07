const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/reminderController');

router.use(auth);

router.get('/',    c.getAll);
router.get('/:id', c.getOne);
router.post('/',   c.create);
router.post('/:id/complete', c.complete);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
