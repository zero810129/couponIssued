const express = require('express');
const uuidv4 = require('uuid/v4');
const { User, Coupon, Domain } = require('../models');
const { sequelize:{Op} } = require('../models');

//////////////////////////////// node-cron /////////////////////////////////
var cron = require('node-cron');

const getPlus3Today = () => {
  let Plus3Day = new Date();

  Plus3Day.setDate(Plus3Day.getDate() + 3);
  let yyyy = Plus3Day.getFullYear();
  let mm = (Plus3Day.getMonth() + 1) + '';
  let dd = Plus3Day.getDate() + '';

  if(dd < 10) {
    dd = '0' + dd;
  }

  if(mm < 10) {
    mm = '0' + mm;
  }

  Plus3Day = yyyy+mm+dd;
  return Plus3Day;
};

//1분마다 실행
cron.schedule('1,10,20,30,40,50 * * * * *', async function(){

  const expDateCoupon = await Coupon.findAll({
    include: [
      {
        model : User,
        attributes: ['userid','username']
      }
    ],
    where: {
      expDate : getPlus3Today() 
    } 

  });

  for ( array in expDateCoupon) {
    console.log( expDateCoupon[array].user.username + "님의 쿠폰 사용 만료가 3일 남았습니다. 쿠폰번호 : " + expDateCoupon[array].couponNumber);
  }

});


const router = express.Router();

router.get('/', (req, res, next) => {

  User.find({
    where: { id: req.user && req.user.id || null },
    include: { model: Domain },
  })
    .then((user) => {
      res.render('login', {
        user,
        loginError: req.flash('loginError'),
        seachuserError: req.flash('seachuserError'),
        couponUseError: req.flash('couponUseError'),
        couponCancelError: req.flash('couponCancelError'),
        domains: user && user.domains,
      });
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/domain', (req, res, next) => {
  Domain.create({
    userId: req.user.id,
    host: req.body.host,
    type: 'premium',
    clientSecret: uuidv4(),
  })
    .then(() => {
      res.redirect('/');
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/join', (req, res) => {

  res.render('join', {
    title: '회원가입 - couponSystem',
    user: req.user,
    joinError: req.flash('joinError'),
  });
});

module.exports = router;
