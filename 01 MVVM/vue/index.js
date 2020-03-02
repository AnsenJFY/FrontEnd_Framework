function Ansen(options){
  this.$options = options    // 实现$options的效果
  let data = this._data = this.$options.data    // 保存一个函数内的data方法
  observe(data)    // 观察者
  for(let key in data){
    Object.defineProperty(this,key,{
      enumerable: true,
      get(){
        return this._data[key]  // this.a = this._data.a
      },
      set(newVal){
        this._data[key] = newVal //  this就代理了this._data
      }
    })
  }
  initComputed.call(this)
  new Complie(options.el, this)
}

function observe(data){    // 因为$options下data的数据结构，可能是多维对象，所以需要递归
  if(typeof data !== 'object') return
  return Observe(data)
}

// 计算属性
function initComputed(){
  let vm = this
  let computed = this.$options.computed // Objeck.keys()
  
  Object.keys(computed).forEach(key=>{
    Object.defineProperty(vm, key, {
      // computed[key]
      get:typeof computed[key] === 'function' ? computed[key] : computed[key].get,
      set(){

      }
    })
  })

}

// Vue特点，不能新增不存在的属性，新添加的属性没有get和set
// 深度响应 因为每次赋予一个新对象都会给这个新对象增加数据劫持

function Observe(data){
  let dep = new Dep()
  for(let key in data){
    let val = data[key]
    observe(val) // 递归这个对象！！
    // 将 Key & Value 的模式转换为Object.defineProPerty的方式 定义属性
    Object.defineProperty(data,key,{
      enumerable: true,   // 可枚举类型，是属性可以被循环到
      get(){
        Dep.target && dep.addSub(Dep.target) // 监控函数[watcher]
        return val
      },
      set(newVal){
        if(newVal === val){
          // 如果新旧的值相等 不进行操作
          return
        }
        val = newVal // 将刚才设置的值设置回去
        observe(newVal) // 新值也需要通过observe方法添加get和set属性
        dep.notify() // 让所有watcherupdate方法执行
      }
    })
  }
}

// 编译 模板订阅 将{{内的值}}替换成目标模式
function Complie(el,vm){
  vm.$el = document.querySelector(el)
  let fragment = document.createDocumentFragment()
  while(child = vm.$el.firstChild){
    // 将app中的内容移到内存中
    fragment.appendChild(child)
  }
  replace(fragment)
  function replace(fragment){
    Array.from(fragment.childNodes).forEach(node=>{
      // 循环每一层
      let text = node.textContent
      let reg = /\{\{(.*)\}\}/
      // 判断标签是否是文本
      if(node.nodeType === 3 && reg.test(text) ){
        let arr = RegExp.$1.split('.')
        let val = vm
        arr.forEach( key => { // 取this.a.a
          val = val[key]
        })
        new Watcher(vm, RegExp.$1, function(newVal){ // 函数需要接收一个新的值
          node.textContent = text.replace(/\{\{(.*)\}\}/, newVal)
        })
        // 模板替换
        node.textContent = text.replace(/\{\{(.*)\}\}/, val)
      }
      // 
      if(node.nodeType === 1){
        // 元素节点
        let nodeAttrs = node.attributes // 获取当前dom节点的属性
        Array.from(nodeAttrs).forEach(attr=>{
          let name = attr.name // type='text'
          let exp = attr.value
          // 判断属性是否以v-开头
          if(name.indexOf('v-') == 0){
            node.value = vm[exp]
          }
          new Watcher(vm,exp,function(newVal){
            node.value = newVal
            // 当watcher触发时 会自动将内容放到输入框内
          })
          node.addEventListener('input',(e)=>{
            let newVal = e.target.value
            vm[exp] = newVal
          })
        })
      }
      // 判断是否存在子节点
      if(node.childNodes){
        replace(node)
      }
    })
  }
  vm.$el.appendChild(fragment)
}


/** ==================================================================== */


// 发布订阅模式  先订阅 再发布[fn1,fn2,fn3]
// 约定 每个发布的方法中都有一个upddate属性
function Dep(){
  this.subs = []
}

// 订阅
Dep.prototype.addSub = function(sub){
  this.subs.push(sub)
}

// 发布
Dep.prototype.notify = function(){
  this.subs.forEach(sub=>sub.update())
}

// 观察者
// 是一个类 通过这个类创建的实例都拥有update属性
function Watcher(vm, exp, fn){
  // 构造函数
  this.fn = fn 
  this.vm = vm 
  this.exp = exp // 添加到订阅中
  Dep.target = this
  let val = vm
  let arr = exp.split('.')
  arr.forEach(function(key){ // this.a.a
    val = val[key]
  })
  Dep.target = null
}
// update属性默认会执行传入的方法
Watcher.prototype.update = function(){
  let val = this.vm
  let arr = this.exp.split('.')
  arr.forEach( function(key){ // this.a.a
    val = val[key]
  })
  this.fn(val)
}

/**
 *  发布订阅的Demo
 
 // 实例化Watcher并传入一个方法
 let watcher = new Watcher(function(){ // 监听函数
   alert(1)
 })
 // 实例化Dep
 let Dep = new Dep()
 Dep.addSub(watcher) // 发布 将watch放到数组中 [watcher.update]方法自动被调用
 Dep.notify() // 订阅 使用到的是数组关系 函数内部依次执行
 
 */