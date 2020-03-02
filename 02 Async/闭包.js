function eat(){
  console.log('吃完了')
}

function after(times,fn){
  // 内部函数引用外部函数的变量
  // 导致垃圾回收机制没有把外部函数变量回收掉
  // 可能会导致内存泄漏的问题
  let count = 0; 
  return function(){
      console.log(count)
      if(++count == times){
          fn();
      }
  }
}

let Eat = new after(3,eat)

Eat()
Eat()
Eat()