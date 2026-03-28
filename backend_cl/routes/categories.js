const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/categoryController');

router.use(auth);

router.get('/',       c.getAll);
router.post('/',      c.create);
router.delete('/:id', c.remove);

module.exports = router;
