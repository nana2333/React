//引入express模块
const express = require('express');
//引入md5加密
const md5 = require('blueimp-md5');
//引入cookie-parser
const cookieParser = require('cookie-parser');
//引入Users
const Users = require('../models/users');


//获取Router
const Router = express.Router;
//创建路由器对象
const router = new Router();

//解析请求体的数据
router.use(express.urlencoded({extended: true}));
//解析cookie
router.use(cookieParser());

//登录
router.post('/login', async (req, res) => {
  //1. 收集用户提交信息
  const {username, password} = req.body;
  //2. 判断用户输入是否合法
  if (!username || !password) {
    //说明有数据不合法
    res.json({
      "code": 2,
      "msg": "用户输入不合法"
    });
    return;
  }
  //3. 去数据库中查找是否有指定用户和密码
  try {
    const data = await Users.findOne({username, password: md5(password)});
    
    if (data) {
      //说明用户找到了，登录成功，返回成功的响应
      //返回cookie
      res.cookie('userid', data.id, {maxAge: 1000 * 3600 * 24 * 7});
      res.json({
        "code": 0,
        "data": {
          "_id": data.id,
          "username": data.username,
          "type": data.type
        }
      })
    } else {
      //说明用户名或密码错误，返回失败的响应
      res.json({
        "code": 1,
        "msg": "用户名或密码错误"
      })
    }
  } catch (e) {
    res.json({
      "code": 3,
      "msg": "网络不稳定，请重新试试~"
    })
  }
  
})

//注册
router.post('/register',async (req, res) => {
  // 1. 收集用户提交信息
  const {username, password, type} = req.body;
  console.log(username, password, type);
  // 2. 判断用户输入是否合法
  if (!username || !password || !type) {
    //说明有数据不合法
    res.json({
      "code": 2,
      "msg": "用户输入不合法"
    });
    return;
  }
  // 3. 去数据库查找用户是否存在
  /*Users.findOne({username})
   .then(data => {
   console.log(data);  //文档对象
   if (data) {
   //返回错误
   return Promise.reject({
   "code": 1,
   "msg": "用户名已存在"
   });
   } else {
   console.log('1111111111');
   return Users.create({username, password: md5(password), type})
   }
   })
   .catch(err => {
   console.log('第一个catch');
   console.log(err);
   if (!err.code) {
   err = {
   "code": 3,
   "msg": "网络不稳定，请重新试试~"
   }
   }
   //方法出错
   return Promise.reject(err);
   })
   .then(data => {
   //说明用户注册成功, 返回成功的响应
   res.json({
   code: 0,
   data: {
   _id: data.id,
   username: data.username,
   type: data.type
   }
   })
   })
   .catch(err => {
   console.log('第二个catch');
   console.log(err);
   if (!err.code) {
   err = {
   "code": 3,
   "msg": "网络不稳定，请重新试试~"
   }
   }
   //返回失败的响应
   res.json(err);
   })*/
  try {
    const data = await Users.findOne({username});
    
    if (data) {
      //返回错误
      res.json({
        "code": 1,
        "msg": "用户名已存在"
      });
    } else {
      const data = await Users.create({username, password: md5(password), type});
      //返回成功的响应
      res.cookie('userid', data.id, {maxAge: 1000 * 3600 * 24 * 7});
      res.json({
        code: 0,
        data: {
          _id: data.id,
          username: data.username,
          type: data.type
        }
      })
    }
  } catch (e) {
    //说明findOne / create方法出错了
    //返回失败的响应
    res.json({
      "code": 3,
      "msg": "网络不稳定，请重新试试~"
    })
  }
  
})

// 更新用户信息的路由
router.post('/update', (req, res) => {
  // 从请求的cookie得到userid
  const userid = req.cookies.userid
  // 如果不存在, 直接返回一个提示信息
  if (!userid) {
    return res.json({code: 1, msg: '请先登陆'});
  }
  // 存在, 根据userid更新对应的user文档数据
  // 得到提交的用户数据
  const user = req.body // 没有_id
  Users.findByIdAndUpdate({_id: userid}, user)
    .then(oldUser => {
      if (!oldUser) {
        //更新数据失败
        // 通知浏览器删除userid cookie
        res.clearCookie('userid');
        // 返回返回一个提示信息
        res.json({code: 1, msg: '请先登陆'});
      } else {
        //更新数据成功
        // 准备一个返回的user数据对象
        const {_id, username, type} = oldUser;
        //此对象有所有的数据
        const data = Object.assign({_id, username, type}, user)
        // 返回成功的响应
        res.json({code: 0, data})
      }
    })
    .catch(error => {
      // console.error('登陆异常', error)
      res.send({code: 3, msg: '网络不稳定，请重新试试~'})
    })
})

//暴露出去
module.exports = router;