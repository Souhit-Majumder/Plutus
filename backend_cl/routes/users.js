const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');

router.use(auth);

router.get('/me',           getProfile);
router.put('/me',           updateProfile);
router.put('/me/password',  changePassword);

module.exports = router;
