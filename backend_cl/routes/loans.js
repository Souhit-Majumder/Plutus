const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/loanController');

router.use(auth);

router.get('/',    c.getAll);
router.get('/:id', c.getOne);
router.post('/',   c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
