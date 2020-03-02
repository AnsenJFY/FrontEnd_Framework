// 回调函数的特点是error first
// 调用回调函数的时候 第一个参数永远是错误对象
let fs = require('fs')
fs.readFile('./1.txt','utf8',(err,data)=>{
  if(err){ // 如果err有值表示程序运行出错
    console.log(err)
  }else{
    // console.log(data)
  }
})
// 缺点：
// 1.无法使用try...catch无法捕获错误
// 2.也无法使用return
// 3.回调地狱
function read(path){
  fs.readFile(path,'utf8',(err,data)=>{
    if(err){ // 如果err有值表示程序运行出错
      console.log(err)
    }else{
      // console.log(data)
    }
  })
}
// 1.无法使用try...catch无法捕获错误
try {
  read('./1.txt') // 出错
} catch (error) {
  console.log(error)
}
// 2.也无法使用return
let result = read('./1.txt') // 出错
// console.log(result) // undefined
// 3.回调地狱 难于阅读和维护 串行效率低
fs.readFile('./1.txt','utf8',(err,data1)=>{
  fs.readFile('./1.txt','utf8',(err,data2)=>{
    fs.readFile('./1.txt','utf8',(err,data3)=>{
      if(err){ // 如果err有值表示程序运行出错
        console.log(err)
      }else{
        // console.log(`${data1}-${data2}-${data3}`)
      }
    })
  })
})

// 解决这个回调嵌套的问题
// 1.通过事件发布订阅来实现
let EventEmitter = require('events')
let eve = new EventEmitter()
// 这个html对象是存放最终数据
let html = {}
// 监听数据获取成功事件，当事件发生后调用回调函数
// eve.on('ready',(key,value)=>{
//   html[key] = value
//   if(Object.keys(html).length ==2){
//     console.log(html)
//   }
// })
// 通过一个哨兵函数来实现
function done(key,value){
  html[key] = value
  if(Object.keys(html).length ==2){
    console.log(html)
  }
}
fs.readFile('./1.txt','utf8',(err,data)=>{
    // 1.事件名 参数往后是传递给回调函数的参数
    done('data1',data)
})
fs.readFile('./1.txt','utf8',(err,data)=>{
    done('data2',data)
})
