const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middlewares');
const { User } = require('../models');
const { Coupon } = require('../models');
const { sequelize:{Op} } = require('../models');
const path = require("path");
const fs = require("fs");
const parse = require('csv-parse');

const router = express.Router();

const randomString = () => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  const string_length = 19;
  let randomstring = '';
  for (let i=0; i<string_length; i++) {
    let rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum,rnum+1);
  }
  //document.randform.randomfield.value = randomstring;
  return randomstring;
};

const getToday = () => {
  let today = new Date();
  let yyyy = today.getFullYear();
  let mm = (today.getMonth() + 1) + '';
  let dd = today.getDate() + '';

  if(dd < 10) {
    dd = '0' + dd;
  }

  if(mm < 10) {
    mm = '0' + mm;
  }

  today = yyyy+mm+dd;
  return today;
};

const getNextMonthDay = () => {
  let nextMonthDay = new Date();
  let yyyy = nextMonthDay.getFullYear();
  nextMonthDay.setMonth(nextMonthDay.getMonth() + 1);
  let mm = (nextMonthDay.getMonth() + 1) + '';
  let dd = nextMonthDay.getDate() + '';

  yyyy = mm == 1 ? yyyy+1 : yyyy;
	yyyy = yyyy + "";

  if(dd < 10) {
    dd = '0' + dd;
  }

  if(mm < 10) {
    mm = '0' + mm;
  }

  nextMonthDay = yyyy+mm+dd;
  return nextMonthDay;
};

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { userid, username, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { userid } });
    if (exUser) {
      req.flash('joinError', '이미 가입된 아이디입니다.');
      return res.redirect('/join');
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      userid,
      username,
      password: hash,
    });
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      req.flash('loginError', info.message);
      return res.redirect('/');
    }   

    const token = jwt.sign({
      id: user.id,
      userid: user.userid,
    }, process.env.JWT_SECRET, {
      expiresIn: '10m', // 10분
      issuer: 'couponsystem',
    });

    if (!req.session.jwt) { // 세션에 토큰이 없으면
      req.session.jwt = token; // 세션에 토큰 저장
    }
    console.log('req.session.jwt ==>' + req.session.jwt);

    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

router.post('/couponCreate', verifyToken, async (req, res, next) => {
  const { couponCount } = req.body;
  try {

    req.connection.setTimeout( 60 * 10 * 1000) // set timeout 10 min.

    let couponRandomNm;
    let couponRandomArray = [];   
    for (let i = 0; i < couponCount; i++) {
      couponRandomNm = randomString();
     
      //console.log('randomstring => ' + couponRandomNm);
      
      const exCoupon = await Coupon.findOne({ where: { couponNumber : couponRandomNm } });
      if (exCoupon) {
        console.log('중복 쿠폰 발생!');
      } else {
        const isExistData = couponRandomArray.find(couponRandomArray => couponRandomArray.couponNumber === couponRandomNm)
        //console.log(isExistData);
        if (isExistData != undefined) {
          console.log('중복 쿠폰 발생!');
          i--;
        }else {
          couponRandomArray.push({couponNumber : couponRandomNm + '', useYN :'N', PaymentYN : 'N',});
        }
      } 
    }

    Coupon.bulkCreate(couponRandomArray, { validate: true }).then(() => {
        console.log('couponRandomArray created');
    });

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/couponIssued', verifyToken, async (req, res, next) => {
    const { inputUserID } = req.body;
    try {
    
    const exUserId = await User.findOne({ where: { userid : inputUserID } });
    if (!exUserId) {
      req.flash('seachuserError', '등록되지 않은 사용자 입니다.');
      return res.redirect('/');
    }  

    const issuedCoupon = await Coupon.findOne({ where: { PaymentYN : 'N' } });

    console.log('issuedCoupon ==> ' + issuedCoupon.couponNumber);

    Coupon.update({
      PaymentYN : 'Y',
      userId : exUserId.id,
      expDate : getNextMonthDay()
    }, {
      where: {couponNumber : issuedCoupon.couponNumber}
    });

    
    return res.render("login.pug", {issuedCouponNumber: issuedCoupon.couponNumber,  user: req.user });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/couponIssudSearch', verifyToken, async (req, res, next) => {
  const { inputUserID } = req.body;
  try {
  
  const exUserId = await User.findOne({ where: { userid : inputUserID } });
  const exCoupon = await Coupon.findAll({ where: { userId : exUserId.id } });

  return res.render("login.pug", {exCoupon: exCoupon,  user: req.user });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post('/couponUse', verifyToken, async (req, res, next) => {
  const { inputUserCoupon } = req.body;
  try {
  
  const excouponNM = await Coupon.findOne({ where: { couponNumber : inputUserCoupon } });
  if (!excouponNM) {
    req.flash('couponUseError', '쿠폰이 존재하지 않습니다.');
    return res.redirect('/');
  }

  if (excouponNM.PaymentYN == 'N') {
    req.flash('couponUseError', '사용할 수 없는 쿠폰입니다.');
    return res.redirect('/');
  }
  
  if (excouponNM.useYN == 'Y') {
    req.flash('couponUseError', '이미 사용한 쿠폰입니다.');
    return res.redirect('/');
  }

  Coupon.update({
    useYN : 'Y'
  }, {
    where: {couponNumber : inputUserCoupon}
  });

  return res.redirect('/');
} catch (error) {
  console.error(error);
  return next(error);
}
});

router.post('/couponCancel', verifyToken, async (req, res, next) => {
  const { inputCancelCoupon } = req.body;
  try {
  
  const excouponNM = await Coupon.findOne({ where: { couponNumber : inputCancelCoupon } });
  if (!excouponNM) {
    req.flash('couponCancelError', '쿠폰이 존재하지 않습니다.');
    return res.redirect('/');
  }

  if (excouponNM.PaymentYN == 'N') {
    req.flash('couponCancelError', '사용할 수 없는 쿠폰입니다.');
    return res.redirect('/');
  }
  
  if (excouponNM.useYN == 'N') {
    req.flash('couponCancelError', '사용 전 쿠폰입니다.');
    return res.redirect('/');
  }

  Coupon.update({
    useYN : 'N'
  }, {
    where: {couponNumber : inputCancelCoupon}
  });

  return res.redirect('/');
} catch (error) {
  console.error(error);
  return next(error);
}
});

router.post('/couponExpSearch', verifyToken, async (req, res, next) => {
  const { } = req.body;
  try {

    
    const todate = getToday();
    const expDateCoupon = await Coupon.findAll({
      include: [
        {
          model : User,
          attributes: ['userid','username']
        }
      ],
      where: {
        expDate : {[Op.lte]:todate} 
      } 
    });
    
    return res.render("login.pug", {expDateCoupon: expDateCoupon, user: req.user});
    } catch (error) {
      console.error(error);
      return next(error);
    }
});

router.post('/importCSVData', isNotLoggedIn, async (req, res, next) => {
  const { } = req.body;
  try {

    let filePath = path.join(__dirname, "../empCoupon.csv");
    const data = fs.readFileSync(filePath, {encoding: "utf8"});
    const rows = data.split("\n");
    let couponRandomArray = [];

    await fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',' }))
      .on('data', function (csvrow) {
        couponRandomArray.push({ couponNumber: (csvrow[0]).trim() + '', useYN: 'N', PaymentYN: 'N', });
      })
      .on('end', function () {
        //do something wiht csvData
        Coupon.bulkCreate(couponRandomArray, { validate: true }).then(() => {
          console.log('couponRandomArray created');
        });
      });


    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
